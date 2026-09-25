import { buildNFA, runMatch } from './src/store/regex'

function test(pattern: string, input: string) {
  const built = buildNFA(pattern)
  const r = runMatch(built.states, built.startState, input)
  console.log(JSON.stringify({ pattern, input, matched: r.matched, matchText: r.matchText }))
}

test('^[a-zA-Z]{2,}$', 'user')
test('^\\d{6}$', '100000')
test('a{2}', 'aa')
test('a+', 'aa')
test('(abc', 'abc')
test('[abc', 'a')
test('*abc', 'abc')
test('abc\\', 'abc')
test('', 'abc')
