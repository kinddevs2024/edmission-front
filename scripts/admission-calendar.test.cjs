const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const compiled = { exports: {} }
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/utils/admissionCalendar.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(compiled, compiled.exports)
const { admissionWeekStart, admissionWeekLayout, allAdmissionBookingPages, ADMISSION_DAY } = compiled.exports
const week = admissionWeekStart(Date.parse('2026-10-18T20:00:00Z'))
assert.equal(new Date(week).toISOString(), '2026-10-18T19:00:00.000Z') // Monday00:00 Tashkent while UTC still Sunday
assert.equal(admissionWeekStart(Date.parse('2026-10-18T18:59:59Z')), week - 7 * ADMISSION_DAY)
const make = (id, start, end, status = 'active') => ({ _id: id, start, end, status })
const rows = [make('a', '2026-10-19T04:00:00Z', '2026-10-19T05:00:00Z'), make('b', '2026-10-19T04:30:00Z', '2026-10-19T05:30:00Z'), make('c', '2026-10-19T06:00:00Z', '2026-10-19T07:00:00Z'), make('cancelled', '2026-10-19T04:00:00Z', '2026-10-19T05:00:00Z', 'cancelled'), make('otherWeek', '2026-10-26T04:00:00Z', '2026-10-26T05:00:00Z')]
const layout = admissionWeekLayout(rows, week)
assert.equal(layout.blocks.length, 3)
assert.equal(layout.blocks[0].startHour, 9)
assert.equal(layout.blocks[0].lanes, 2)
assert.notEqual(layout.blocks[0].lane, layout.blocks[1].lane)
assert.equal(layout.blocks[2].lanes, 1)
assert.equal(layout.firstHour, 9); assert.equal(layout.lastHour, 18)
const midnight = admissionWeekLayout([make('night', '2026-10-19T18:30:00Z', '2026-10-19T20:00:00Z')], week)
assert.equal(midnight.blocks.length, 2)
assert.equal(midnight.blocks[0].endHour, 24); assert.equal(midnight.blocks[1].startHour, 0)
assert.equal(midnight.firstHour, 0); assert.equal(midnight.lastHour, 24)
assert.equal(admissionWeekLayout([make('bad', undefined, 'bad')], week).invalid.length, 1)
;(async () => {
 const calls = []; const records = Array.from({ length: 121 }, (_, i) => ({ _id: String(i) }))
 const loaded = await allAdmissionBookingPages(async page => { calls.push(page); return { items: records.slice((page - 1) * 50, page * 50), total: 121, limit: 50 } })
 assert.equal(loaded.length, 121); assert.deepEqual(calls, [1, 2, 3])
 console.log('Calendar timezone, week boundaries, overlaps, midnight split, invalid records and all-page loading passed')
})().catch(error => { console.error(error); process.exit(1) })
