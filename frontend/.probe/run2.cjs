const m = require('./out/store/regex.js')
function probe(p, i) {
  try {
    const b = m.buildNFA(p); const r = m.runMatch(b.states, b.startState, i)
    console.log(JSON.stringify({p, i, matched: r.matched, matchText: r.matchText, steps: r.totalSteps}))
  } catch (e) { console.log(JSON.stringify({p, i, threw: e.message})) }
}
probe('[abc]+','xabcx')
probe('\\d+','abc123')
probe('(ab|cd)+','cdab')
probe('colou?r','color')
probe('a{1,3}','aaa')
probe('(\\d{4})-(\\d{2})','2024-01')
probe('^(\\d{6})$','100000 518000')
