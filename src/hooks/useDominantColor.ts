import { useState, useEffect } from 'react'

/** Saturation 0..1 from RGB (0 for grey, 1 for pure hue). */
function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

/** Sample image on a small canvas and return the dominant *accent* color (prefer saturated) as hex, or null if failed/CORS. */
function getDominantColorFromImageUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url || typeof document === 'undefined') {
      resolve(null)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const size = 32
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        const buckets: Record<string, number> = {}
        const quant = (v: number) => Math.min(255, Math.round(v / 24) * 24)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          if (a < 140) continue
          const lum = 0.299 * r + 0.587 * g + 0.114 * b
          if (lum < 18 || lum > 240) continue
          const key = `${quant(r)},${quant(g)},${quant(b)}`
          buckets[key] = (buckets[key] ?? 0) + 1
        }
        const entries = Object.entries(buckets)
          .map(([key, count]) => {
            const [r, g, b] = key.split(',').map(Number)
            return { key, count, r, g, b, sat: saturation(r, g, b) }
          })
          .filter((e) => e.count >= 2)
        if (entries.length === 0) {
          const anyKey = Object.keys(buckets)[0]
          if (!anyKey) {
            resolve(null)
            return
          }
          const [r, g, b] = anyKey.split(',').map(Number)
          resolve('#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join(''))
          return
        }
        entries.sort((a, b) => {
          const scoreA = a.sat * 2 + Math.log2(a.count + 1)
          const scoreB = b.sat * 2 + Math.log2(b.count + 1)
          return scoreB - scoreA
        })
        const best = entries[0]
        const hex = '#' + [best.r, best.g, best.b].map((x) => x.toString(16).padStart(2, '0')).join('')
        resolve(hex)
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function useDominantColor(imageUrl: string | undefined | null): string | null {
  const [color, setColor] = useState<string | null>(null)
  const url = imageUrl?.trim() || null

  useEffect(() => {
    if (!url) {
      setColor(null)
      return
    }
    let cancelled = false
    getDominantColorFromImageUrl(url).then((c) => {
      if (!cancelled) setColor(c)
    })
    return () => {
      cancelled = true
    }
  }, [url])

  return color
}
