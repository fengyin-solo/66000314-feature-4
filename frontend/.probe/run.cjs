const m = require('./out/store/regex.js')
for (const [p, i] of [['^[a-zA-Z]{2,}$','user'],['^\\d{6}$','100000'],['a{2}','aa'],['a+','aa'],['(abc','abc'],['[abc','a'],['*abc','abc'],['abc\\','abc'],['','abc']]) {
  try {
    const b = m.buildNFA(p); const r = m.runMatch(b.states, b.startState, i)
    console.log(JSON.stringify({p, i, matched: r.matched, matchText: r.matchText}))
  } catch (e) { console.log(JSON.stringify({p, i, threw: e.message})) }
}
