const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const source = ts.transpileModule(fs.readFileSync('src/utils/admissionDate.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const compiled = { exports: {} }
new Function('module', 'exports', source)(compiled, compiled.exports)
const { formatAdmissionDate } = compiled.exports
let checks = 0
for (const locale of ['ru', 'uz', 'en']) {
  for (const value of [undefined, null, '', '   ', 'bad-date', {}, [], NaN, Infinity]) {
    assert.equal(formatAdmissionDate(value, locale), '—'); checks++
    assert.equal(formatAdmissionDate(value, locale, true), '—'); checks++
  }
  assert.notEqual(formatAdmissionDate('2026-10-18T04:00:00.000Z', locale), '—'); checks++
  assert.equal(formatAdmissionDate('2026-10-18T04:00:00.000Z', locale, true).replace(/\D/g, ''), '0900'); checks++
}
console.log(`${checks} admission date assertions passed`)
