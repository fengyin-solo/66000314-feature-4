export interface NFAState {
  id: number
  isStart: boolean
  isAccept: boolean
  x: number
  y: number
}

export interface NFATransition {
  from: number
  to: number
  symbol: string | null // null = epsilon
  label: string
}

export interface NFA {
  states: NFAState[]
  transitions: NFATransition[]
  startState: number
  acceptStates: number[]
}

export interface MatchStep {
  stepIndex: number
  charIndex: number
  char: string
  currentState: number
  nextState: number
  transition: string
  isBacktrack: boolean
  isMatch: boolean
}

export interface MatchResult {
  matched: boolean
  matchText: string
  groups: string[]
  steps: MatchStep[]
  backtracks: number
  totalSteps: number
  duration: number
}

export interface RegexTemplate {
  name: string
  pattern: string
  description: string
  testString: string
  category: string
}

/** 解析反馈：模板套用与手动输入共用同一套规则、阈值与口径 */
export type FeedbackSeverity = 'error' | 'warning'
export type FeedbackCode =
  | 'EMPTY_PATTERN'
  | 'PATTERN_TOO_LONG'
  | 'INPUT_TOO_LONG'
  | 'UNTERMINATED_GROUP'
  | 'UNMATCHED_PAREN'
  | 'UNTERMINATED_CLASS'
  | 'UNTERMINATED_ESCAPE'
  | 'NOTHING_TO_REPEAT'
  | 'INVALID_QUANTIFIER'
  | 'QUANTIFIER_TOO_LARGE'
  | 'UNSUPPORTED_GROUP'

export interface ParseFeedback {
  severity: FeedbackSeverity
  code: FeedbackCode
  message: string
  /** 出错片段在模式中的起止下标（含头不含尾）；-1 表示与具体位置无关 */
  index: number
  length: number
}

export interface ASTNode {
  type: 'char' | 'star' | 'plus' | 'question' | 'repeat' | 'or' | 'concat' | 'group' | 'dot' | 'anchor' | 'charclass' | 'digit' | 'word' | 'space' | 'empty'
  value?: string
  children?: ASTNode[]
  groupIndex?: number
  /** 该节点对应模式片段的下标范围，便于解释与定位 */
  index?: number
  length?: number
  lazy?: boolean
  negative?: boolean
  min?: number
  max?: number
}
