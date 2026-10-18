const fs = require('node:fs'), assert = require('node:assert/strict'), ts = require('typescript')
const compiled = { exports: {} }
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/components/ai/assistantState.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(compiled, compiled.exports)
const { assistantButtons, assistantReplyKeyboard, mergeAssistantMessages, readAssistantPending } = compiled.exports
const calendar = { id: 9, direction: 'out', text: 'Days', options: { reply_markup: { inline_keyboard: [[{ text: '1', callback_data: 'cal:d:2026-10-19' }], [{ text: 'Helpful', callback_data: 'fb:123' }], [{ text: '/stop', callback_data: 'stop' }]] } } }
assert.equal(assistantButtons(calendar).length, 1)
assert.equal(assistantButtons(calendar)[0][0].text, '1')
const updated = { ...calendar, text: 'Hours' }
assert.deepEqual(mergeAssistantMessages([calendar], [updated]), [updated])
const finalCalendar = { ...updated, editedAt: '2026-10-18T10:00:00Z' }
assert.deepEqual(mergeAssistantMessages([finalCalendar], [{ ...calendar, editedAt: '2026-10-18T09:00:00Z' }]), [finalCalendar])
assert.equal(mergeAssistantMessages([{ id: 'student1', text: 'Hi' }], [calendar, updated]).length, 2)
assert.equal(readAssistantPending('bad'), null)
assert.equal(readAssistantPending(JSON.stringify({ requestId: 'x', text: 'Hi' })), null)
const pending = { requestId: '12345678-1234-1234-1234-123456789012', messageId: 9, data: 'cal:m:2026-10' }
assert.deepEqual(readAssistantPending(JSON.stringify(pending)), pending)
assert.equal(typeof readAssistantPending(JSON.stringify(pending)).messageId, 'number')
assert.deepEqual(assistantReplyKeyboard([{ id: 1, direction: 'out', options: { reply_markup: { keyboard: [[{ text: 'Menu' }]] } } }, { id: 2, direction: 'out', options: { reply_markup: { inline_keyboard: [[{ text: 'Day', callback_data: 'cal' }]] } } }]), [[{ text: 'Menu' }]])
assert.equal(assistantReplyKeyboard([{ id: 1, direction: 'out', options: { reply_markup: { keyboard: [['Menu']] } } }, { id: 2, direction: 'out', options: { reply_markup: { remove_keyboard: true } } }]), undefined)
console.log('Website assistant keyboard filtering, calendar replacement, history merging and idempotent retry validation passed')
