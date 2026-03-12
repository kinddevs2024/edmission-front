/**
 * Parse [PROFILE_UPDATE]{...} and [OPEN_PAGE:/path] from AI response text.
 * Used by AIChatDrawer and AIChatPage to apply profile updates and navigation.
 */

export interface ParsedAIActions {
  displayText: string
  profileUpdate?: Record<string, unknown>
  openPath?: string
}

export function parseAIActions(text: string): ParsedAIActions {
  let displayText = text
  let profileUpdate: Record<string, unknown> | undefined
  let openPath: string | undefined
  const toRemove: string[] = []

  const profileIdx = text.indexOf('[PROFILE_UPDATE]')
  if (profileIdx !== -1) {
    const rest = text.slice(profileIdx + '[PROFILE_UPDATE]'.length)
    const start = rest.indexOf('{')
    if (start !== -1) {
      let depth = 0
      let end = start
      for (let i = start; i < rest.length; i++) {
        if (rest[i] === '{') depth++
        else if (rest[i] === '}') {
          depth--
          if (depth === 0) {
            end = i + 1
            break
          }
        }
      }
      try {
        const raw = rest.slice(start, end)
        profileUpdate = JSON.parse(raw) as Record<string, unknown>
        toRemove.push('[PROFILE_UPDATE]' + raw)
      } catch (_) {
        /* invalid JSON */
      }
    }
  }

  const openMatch = text.match(/\[OPEN_PAGE:([^\]]+)\]/)
  if (openMatch) {
    openPath = openMatch[1].trim()
    toRemove.push(openMatch[0])
  }

  for (const r of toRemove) {
    displayText = displayText.replace(r, '').trim()
  }
  displayText = displayText.replace(/\n{3,}/g, '\n\n').trim()

  return { displayText, profileUpdate, openPath }
}
