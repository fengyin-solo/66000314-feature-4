import type { ParseIssue } from '../types'

// 统一阈值：所有入口（手动输入 / 模板套用 / 执行按钮）共用同一套限制
export const MAX_PATTERN_LENGTH = 500
export const MAX_TEST_LENGTH = 20000

function issue(message: string, position: number, hint: string, target: 'pattern' | 'test' = 'pattern'): ParseIssue {
  return { message, position, hint, target }
}

/**
 * 校验正则模式，返回第一个发现的问题；无问题返回 null。
 * 所有解析反馈均通过此函数产出，保证同一规则、同一口径。
 */
export function validatePattern(pattern: string): ParseIssue | null {
  if (pattern.length === 0) {
    return issue('模式为空', 0, '请输入正则表达式，或从模板库选择一个模板')
  }
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return issue(`模式超长（${pattern.length} 字符，上限 ${MAX_PATTERN_LENGTH}）`, MAX_PATTERN_LENGTH, '请精简模式，或拆分为多个较短的表达式')
  }

  const stack: number[] = [] // 未闭合的 ( 的位置
  // prev: 前一个 token 类别，用于判断量词是否有前置目标
  let prev: 'start' | 'atom' | 'open' | 'or' | 'quant' | 'lazy' = 'start'

  let i = 0
  while (i < pattern.length) {
    const ch = pattern[i]

    if (ch === '\\') {
      if (i + 1 >= pattern.length) {
        return issue('转义符 "\\" 后缺少字符', i, '行尾的反斜杠需要跟随一个字符，如 \\d、\\.；若要匹配反斜杠本身请写成 \\\\')
      }
      i += 2
      prev = 'atom'
      continue
    }

    if (ch === '[') {
      const start = i
      i++
      if (pattern[i] === '^') i++
      if (pattern[i] === ']') i++ // 首字符 ] 视为字面量
      let closed = false
      while (i < pattern.length) {
        if (pattern[i] === '\\') { i += 2; continue }
        if (pattern[i] === ']') { closed = true; i++; break }
        i++
      }
      if (!closed) {
        return issue('未闭合的字符类 "["', start, `第 ${start + 1} 个字符的 "[" 缺少对应的 "]"`)
      }
      prev = 'atom'
      continue
    }

    if (ch === '(') {
      stack.push(i)
      i++
      // 分组修饰前缀：(?: ?= ?! ?<= ?<! ?<name>
      if (pattern[i] === '?') {
        const p = pattern[i + 1]
        if (p === ':' || p === '=' || p === '!') {
          i += 2
        } else if (p === '<') {
          const q = pattern[i + 2]
          if (q === '=' || q === '!') {
            i += 3
          } else {
            const gt = pattern.indexOf('>', i + 2)
            if (gt === -1) {
              return issue('未闭合的命名分组 "(?<"', i - 1, '命名分组缺少 ">"，格式为 (?<名称>...)')
            }
            i = gt + 1
          }
        } else {
          return issue('未知的分组修饰 "(?"', i - 1, '"(?" 后仅支持 ?:、?=、?!、?<=、?<! 或 ?<名称>')
        }
      }
      prev = 'open'
      continue
    }

    if (ch === ')') {
      if (stack.length === 0) {
        return issue('多余的右括号 ")"', i, '该 ")" 没有匹配的 "("，请删除它或在前面补充左括号')
      }
      stack.pop()
      i++
      prev = 'atom'
      continue
    }

    if (ch === '*' || ch === '+' || ch === '?') {
      if (prev === 'start' || prev === 'open' || prev === 'or') {
        return issue(`量词 "${ch}" 缺少前置目标`, i, '量词必须跟在字符、分组或字符类之后')
      }
      if (prev === 'quant') {
        // 仅允许一个 "?" 作为惰性标记（如 *?、+?、??、{n}?）
        if (ch === '?') {
          prev = 'lazy'
          i++
          continue
        }
        return issue(`量词 "${ch}" 连续出现`, i, '两个量词不能直接相连；如需惰性匹配请使用 "*?"、"+?" 或 "??"')
      }
      if (prev === 'lazy') {
        return issue(`量词 "${ch}" 出现在惰性标记之后`, i, '惰性标记后不能再跟随量词')
      }
      prev = 'quant'
      i++
      continue
    }

    if (ch === '{') {
      const rest = pattern.slice(i)
      const m = /^\{\d+(,\d*)?\}/.exec(rest)
      if (m) {
        if (prev === 'start' || prev === 'open' || prev === 'or') {
          return issue('量词 "{...}" 缺少前置目标', i, '量词必须跟在字符、分组或字符类之后')
        }
        if (prev === 'quant' || prev === 'lazy') {
          return issue('量词 "{...}" 连续出现', i, '两个量词不能直接相连')
        }
        i += m[0].length
        prev = 'quant'
        continue
      }
      if (/^\{\d+(,\d*)?$/.test(rest)) {
        return issue('未闭合的量词 "{"', i, `第 ${i + 1} 个字符的 "{" 缺少对应的 "}"，如 {2,5}`)
      }
      // 不构成量词，按字面量处理
      prev = 'atom'
      i++
      continue
    }

    if (ch === '|') {
      prev = 'or'
      i++
      continue
    }

    prev = 'atom'
    i++
  }

  if (stack.length > 0) {
    const pos = stack[stack.length - 1]
    return issue('未闭合的分组 "("', pos, `第 ${pos + 1} 个字符的 "(" 缺少对应的 ")"`)
  }
  return null
}

/** 校验测试文本，与模式校验共用同一套阈值口径 */
export function validateTestString(testString: string): ParseIssue | null {
  if (testString.length > MAX_TEST_LENGTH) {
    return issue(`测试文本超长（${testString.length} 字符，上限 ${MAX_TEST_LENGTH}）`, MAX_TEST_LENGTH, '请截取较短的文本片段进行测试', 'test')
  }
  return null
}
