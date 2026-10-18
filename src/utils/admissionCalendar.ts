export const ADMISSION_DAY = 86400000
const OFFSET = 5 * 3600000
/** Monday midnight in Tashkent, independent of the browser's timezone. */
export function admissionWeekStart(now = Date.now()): number {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (name: string) => Number(parts.find(p => p.type === name)?.value)
  const localDay = Date.UTC(part('year'), part('month') - 1, part('day'))
  return localDay - ((new Date(localDay).getUTCDay() + 6) % 7) * ADMISSION_DAY - OFFSET
}
export interface CalendarBooking { _id: string; start?: string; end?: string; status: string }
export interface CalendarBlock<T> { booking: T; day: number; startHour: number; endHour: number; lane: number; lanes: number }
export function admissionWeekLayout<T extends CalendarBooking>(bookings: T[], week: number) {
  const blocks: CalendarBlock<T>[] = []
  const invalid: T[] = []
  for (const booking of bookings) {
    if (booking.status === 'cancelled') continue
    const start = Date.parse(booking.start || ''); const end = Date.parse(booking.end || '')
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) { invalid.push(booking); continue }
    for (let day = 0; day < 7; day++) {
      const midnight = week + day * ADMISSION_DAY
      if (start < midnight + ADMISSION_DAY && end > midnight) blocks.push({ booking, day, startHour: (Math.max(start, midnight) - midnight) / 3600000, endHour: (Math.min(end, midnight + ADMISSION_DAY) - midnight) / 3600000, lane: 0, lanes: 1 })
    }
  }
  for (let day = 0; day < 7; day++) {
    const rows = blocks.filter(b => b.day === day).sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour)
    let group: CalendarBlock<T>[] = []; let laneEnds: number[] = []; let groupEnd = -1
    const finish = () => group.forEach(b => { b.lanes = laneEnds.length })
    for (const block of rows) {
      if (block.startHour >= groupEnd) { finish(); group = []; laneEnds = []; groupEnd = -1 }
      let lane = laneEnds.findIndex(end => end <= block.startHour)
      if (lane < 0) lane = laneEnds.length
      laneEnds[lane] = block.endHour; block.lane = lane; group.push(block); groupEnd = Math.max(groupEnd, block.endHour)
    }
    finish()
  }
  return { blocks, invalid, firstHour: Math.min(9, ...blocks.map(b => Math.floor(b.startHour))), lastHour: Math.max(18, ...blocks.map(b => Math.ceil(b.endHour))) }
}
/** Read every page; the visible week must never be limited to the first 50 records. */
export async function allAdmissionBookingPages<T extends { _id: string }>(getPage: (page: number) => Promise<{ items: T[]; total: number; limit?: number }>) {
  const rows = new Map<string, T>()
  for (let page = 1; ; page++) {
    const result = await getPage(page)
    for (const row of result.items) rows.set(row._id, row)
    const limit = result.limit || 50
    if (!result.items.length || page * limit >= result.total) return [...rows.values()]
  }
}
