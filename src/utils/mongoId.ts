const OBJECT_ID_HEX_RE = /^[a-fA-F0-9]{24}$/

export function normalizeMongoId(value: unknown): string | null {
  if (typeof value === 'string') {
    const s = value.trim()
    return OBJECT_ID_HEX_RE.test(s) ? s : null
  }
  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid: unknown }).$oid
    if (typeof oid === 'string' && OBJECT_ID_HEX_RE.test(oid.trim())) return oid.trim()
  }
  return null
}

/** Resolves StudentProfile id for university pipeline / lists (never use raw String(object) for routes). */
export function pickStudentProfileId(item: {
  studentProfileId?: string
  id?: string
  student?: { _id?: unknown }
}): string {
  const explicit = item.studentProfileId?.trim()
  if (explicit && OBJECT_ID_HEX_RE.test(explicit)) return explicit
  const fromStudent = item.student ? normalizeMongoId(item.student._id) : null
  if (fromStudent) return fromStudent
  const fallback = item.id?.trim()
  if (fallback && OBJECT_ID_HEX_RE.test(fallback)) return fallback
  return ''
}
