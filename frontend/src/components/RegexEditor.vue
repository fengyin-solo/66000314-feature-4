<template>
  <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <h3 class="text-sm font-bold text-slate-400 mb-3">正则表达式输入</h3>
    <div class="relative">
      <span class="absolute left-3 top-2 text-cyan-500 font-bold text-lg">/</span>
      <input
        v-model="localPattern"
        @input="onInput"
        @keyup.enter="execute"
        type="text"
        placeholder="输入正则表达式..."
        :class="['w-full bg-slate-900 border rounded-lg pl-8 pr-12 py-2 text-cyan-400 font-mono text-sm focus:outline-none',
          store.error && store.error.target === 'pattern' ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-cyan-500']"
      />
      <span class="absolute right-3 top-2 text-cyan-500 font-bold text-lg">/g</span>
    </div>

    <div v-if="store.error" class="mt-2 rounded-lg border border-red-800 bg-red-950/40 p-2 text-sm">
      <div class="text-red-400">
        ⚠ {{ store.error.message }}
        <span v-if="store.error.position >= 0" class="text-red-500 text-xs">（第 {{ store.error.position + 1 }} 个字符）</span>
      </div>
      <div v-if="store.error.target === 'pattern' && caretLine" class="mt-1 font-mono text-xs overflow-x-auto">
        <div class="text-cyan-500 whitespace-pre">{{ localPattern }}</div>
        <div class="text-red-400 whitespace-pre">{{ caretLine }}</div>
      </div>
      <div class="text-slate-400 text-xs mt-1">💡 {{ store.error.hint }}</div>
    </div>
    <div v-if="store.isStale" class="mt-2 text-xs text-orange-400">
      当前输入未生效，工作台仍显示上一次有效模式「{{ store.lastValidPattern }}」的结果
    </div>

    <textarea
      v-model="localTestString"
      @input="onTestInput"
      placeholder="输入测试字符串..."
      rows="3"
      :class="['w-full mt-3 bg-slate-900 border rounded-lg px-3 py-2 text-slate-200 font-mono text-sm focus:outline-none resize-none',
        store.error && store.error.target === 'test' ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-cyan-500']"
    ></textarea>
    <button @click="execute" class="w-full mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold text-sm">执行匹配</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRegexStore } from '../store/regex'

const store = useRegexStore()
const localPattern = ref(store.pattern)
const localTestString = ref(store.testString)

// 模板套用等外部修改同步回输入框，保证模板与手动输入两种方式的展示与结果一致
watch(() => store.pattern, p => { if (p !== localPattern.value) localPattern.value = p })
watch(() => store.testString, s => { if (s !== localTestString.value) localTestString.value = s })

// 在出错字符下方标注 ^，给出大致出错位置
const caretLine = computed(() => {
  const err = store.error
  if (!err || err.position < 0 || err.position > localPattern.value.length) return ''
  return ' '.repeat(err.position) + '^'
})

let debounceTimer: ReturnType<typeof setTimeout>
function onInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { store.setPattern(localPattern.value) }, 300)
}
function onTestInput() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { store.setTestString(localTestString.value) }, 300)
}
function execute() {
  store.setPattern(localPattern.value)
  store.setTestString(localTestString.value)
  store.execute()
}
</script>
