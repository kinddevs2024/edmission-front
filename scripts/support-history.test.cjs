const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/components/chat/messageHistory.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const moduleValue = { exports: {} }
new Function('exports', 'require', 'module', compiled)(moduleValue.exports, require, moduleValue)
const { mergeMessageHistory } = moduleValue.exports
const m = (id, minute, extra = {}) => ({ id, text: id, createdAt: `2026-10-18T10:${minute}:00Z`, ...extra })
const old = m('old', '00'), sent = m('sent', '01'), received = m('received', '02')
// Reproduce the former UI loss: sending succeeds while a GET still holds the pre-send history.
assert.deepEqual(mergeMessageHistory([old, sent], [old]).map(x => x.id), ['old', 'sent'])
assert.deepEqual(mergeMessageHistory([old, sent, received], [old]).map(x => x.id), ['old', 'sent', 'received'])
assert.equal(mergeMessageHistory([sent], [sent]).length, 1)
assert.deepEqual(mergeMessageHistory([sent], [old, sent]).map(x => x.id), ['old', 'sent'])
const edited = { ...sent, text: 'corrected', editedAt: '2026-10-18T11:00:00Z' }
assert.equal(mergeMessageHistory([edited], [sent])[0].text, 'corrected')
assert.equal(mergeMessageHistory([sent], [edited])[0].text, 'corrected')
assert.deepEqual(mergeMessageHistory([sent], [old, sent], new Set(['sent'])).map(x => x.id), ['old'])
console.log('7 support history race regression checks passed')
