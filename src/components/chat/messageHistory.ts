import type { Message } from '@/types/chat'

/** A history request may finish after an acknowledged send or a socket event. */
export function mergeMessageHistory(current: Message[], snapshot: Message[], deleted: ReadonlySet<string> = new Set()): Message[] {
  const byId = new Map<string, Message>()
  for (const message of snapshot) {
    if (!deleted.has(message.id)) byId.set(message.id, message)
  }
  for (const message of current) {
    if (deleted.has(message.id)) continue
    const fetched = byId.get(message.id)
    // Keep locally acknowledged messages absent from an older/paginated snapshot,
    // and do not let a snapshot undo a completed edit.
    if (!fetched || Date.parse(message.editedAt ?? '') > Date.parse(fetched.editedAt ?? '')) {
      byId.set(message.id, message)
    } else if (message.editedAt && !fetched.editedAt) {
      byId.set(message.id, message)
    }
  }
  return [...byId.values()].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id))
}
