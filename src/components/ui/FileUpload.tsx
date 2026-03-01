import { useState, useEffect } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadFile, getImageUrl } from '@/services/upload'
import { getApiError } from '@/services/auth'
import { cn } from '@/utils/cn'

interface FileUploadProps {
  value?: string
  onChange: (url: string) => void
  accept?: string
  label?: string
  hint?: string
  className?: string
  /** Show as avatar circle (for profile photo) */
  variant?: 'default' | 'avatar'
}

export function FileUpload({
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  label,
  hint,
  className,
  variant = 'default',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imgLoadError, setImgLoadError] = useState(false)
  useEffect(() => setImgLoadError(false), [value])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onChange(url)
    } catch (err: unknown) {
      setError(getApiError(err).message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const isAvatar = variant === 'avatar'

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-input border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] transition-colors',
          isAvatar ? 'w-28 h-28 rounded-full overflow-hidden' : 'min-h-[120px] p-4'
        )}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFile}
          className="absolute inset-0 cursor-pointer opacity-0 z-10"
          disabled={uploading}
          aria-label={label ?? 'Upload file'}
        />
        {uploading ? (
          <Loader2 className={cn('animate-spin text-[var(--color-text-muted)]', isAvatar ? 'w-10 h-10' : 'w-8 h-8')} aria-hidden />
        ) : value ? (
          <>
            {(accept.includes('image') && (/\.(jpe?g|png|gif|webp)$/i.test(value) || /\/uploads\//.test(value) || value.includes('uploads') || value.startsWith('data:'))) && !imgLoadError ? (
              <img
                src={getImageUrl(value)}
                alt=""
                className={cn('object-cover', isAvatar ? 'w-full h-full' : 'max-h-24 max-w-full rounded')}
                onError={() => setImgLoadError(true)}
              />
            ) : value && (accept.includes('image') && imgLoadError) ? (
              <span className="text-sm text-[var(--color-text-muted)]">Preview unavailable</span>
            ) : (
              <span className="text-sm text-[var(--color-text-muted)] truncate max-w-full px-2">
                {value.split('/').pop() ?? 'File'}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onChange('')
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 z-20"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-center text-[var(--color-text-muted)]">
            <Upload className={isAvatar ? 'w-8 h-8' : 'w-10 h-10'} aria-hidden />
            <span className="text-xs">
              {isAvatar ? 'Add photo' : 'Click or drag to upload'}
            </span>
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
