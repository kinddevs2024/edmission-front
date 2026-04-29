import { FileText } from 'lucide-react'
import { getImageUrl } from '@/services/upload'

type FlyerMediaPreviewProps = {
  url?: string
  mediaType?: string
  title?: string
  previewImageUrl?: string
  className?: string
}

function resolveMediaUrl(value?: string): string {
  if (!value) return ''
  if (value.startsWith('blob:')) return value
  return getImageUrl(value)
}

function getExtension(url: string): string {
  const clean = url.split('?')[0]?.split('#')[0] ?? ''
  const match = clean.match(/\.([a-z0-9]+)$/i)
  return match?.[1]?.toLowerCase() ?? ''
}

function isImage(mediaType: string, ext: string): boolean {
  return mediaType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'jfif', 'avif'].includes(ext)
}

function isVideo(mediaType: string, ext: string): boolean {
  return mediaType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)
}

function isAudio(mediaType: string, ext: string): boolean {
  return mediaType.startsWith('audio/') || ['mp3', 'm4a', 'webm'].includes(ext)
}

function isPdf(mediaType: string, ext: string): boolean {
  return mediaType === 'application/pdf' || ext === 'pdf'
}

function isText(mediaType: string, ext: string): boolean {
  return mediaType.startsWith('text/') || ['txt', 'csv'].includes(ext)
}

export function FlyerMediaPreview({
  url,
  mediaType,
  title,
  previewImageUrl,
  className = '',
}: FlyerMediaPreviewProps) {
  const previewSrc = resolveMediaUrl(previewImageUrl)
  const mediaSrc = resolveMediaUrl(url)
  const src = previewSrc || mediaSrc
  const normalizedType = (mediaType ?? '').toLowerCase()
  const ext = getExtension(src)
  const label = title || 'Flyer'

  if (!src) {
    return (
      <div className={`flex min-h-60 items-center justify-center rounded-card border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-muted)] ${className}`}>
        {label}
      </div>
    )
  }

  if (previewSrc || isImage(normalizedType, ext)) {
    return (
      <img
        src={src}
        alt={label}
        loading="lazy"
        className={`max-h-[34rem] w-full rounded-card bg-[var(--color-border)]/30 object-contain ${className}`}
      />
    )
  }

  if (isVideo(normalizedType, ext)) {
    return <video src={src} controls className={`max-h-[34rem] w-full rounded-card bg-black/80 ${className}`} />
  }

  if (isAudio(normalizedType, ext)) {
    return (
      <div className={`rounded-card border border-[var(--color-border)] bg-[var(--color-bg)] p-4 ${className}`}>
        <p className="mb-3 text-sm font-medium text-[var(--color-text)]">{label}</p>
        <audio src={src} controls className="w-full" />
      </div>
    )
  }

  if (isPdf(normalizedType, ext) || isText(normalizedType, ext)) {
    return (
      <iframe
        src={isPdf(normalizedType, ext) ? `${src}#toolbar=0&navpanes=0` : src}
        title={label}
        className={`h-[32rem] w-full rounded-card border border-[var(--color-border)] bg-white ${className}`}
      />
    )
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className={`flex min-h-60 flex-col items-center justify-center gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-bg)] p-6 text-center transition-colors hover:border-primary-accent ${className}`}
    >
      <FileText className="h-10 w-10 text-[var(--color-text-muted)]" aria-hidden />
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <span className="max-w-full break-all text-xs text-[var(--color-text-muted)]">{src}</span>
    </a>
  )
}
