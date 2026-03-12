/**
 * Parses message text and identifies app paths so they can be rendered as clickable links.
 * Uses an allowlist of path prefixes to avoid linking arbitrary strings (XSS-safe).
 */

import { Link } from 'react-router-dom'

/** Path prefixes that are valid app routes (from Router). */
const PATH_PREFIXES = [
  '/student/',
  '/university/',
  '/admin',
  '/school/',
  '/profile',
  '/notifications',
  '/payment',
  '/support',
  '/ai',
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
  '/set-password',
  '/choose-language',
  '/privacy',
  '/cookies',
  '/maintenance',
]

function isAppPath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) return normalized.startsWith(prefix)
    return normalized === prefix || normalized.startsWith(prefix + '/')
  })
}

/** Matches path-like segments: /word or /word/word etc. (letters, digits, hyphens, slashes). */
const PATH_REGEX = /(\/(?:[\w-]+\/)*[\w-]+)/g

export type Segment = { type: 'text'; value: string } | { type: 'path'; value: string }

/**
 * Splits text into segments. Path-like substrings that match app routes become path segments.
 */
export function parsePathSegments(text: string): Segment[] {
  if (!text) return []
  const segments: Segment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  PATH_REGEX.lastIndex = 0
  while ((match = PATH_REGEX.exec(text)) !== null) {
    const path = match[1]
    if (isAppPath(path)) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
      }
      segments.push({ type: 'path', value: path })
      lastIndex = match.index + path.length
    }
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return segments.length ? segments : [{ type: 'text', value: text }]
}

interface MessageTextWithLinksProps {
  text: string
  className?: string
  /** When rendering loading placeholder, pass true so we don't parse empty/placeholder. */
  isPlaceholder?: boolean
}

/**
 * Renders message text with app paths as React Router Links. Safe: no raw HTML.
 */
export function MessageTextWithLinks({
  text,
  className,
  isPlaceholder,
}: MessageTextWithLinksProps) {
  if (isPlaceholder || !text) return null
  const segments = parsePathSegments(text)
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <Link
            key={i}
            to={seg.value}
            className="underline text-primary-accent hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-accent rounded"
          >
            {seg.value}
          </Link>
        )
      )}
    </span>
  )
}
