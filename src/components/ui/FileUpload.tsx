import { useState, useEffect, useRef, type Ref } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { uploadFile, uploadAvatarForRegister, getImageUrl } from '@/services/upload'
import { getApiError } from '@/services/auth'
import { cn } from '@/utils/cn'
import { AvatarCropModal } from '@/components/ui/AvatarCropModal'

interface FileUploadProps {
  value?: string
  onChange: (url: string) => void
  inputRef?: Ref<HTMLInputElement>
  accept?: string
  label?: string
  hint?: string
  className?: string
  /** Show as avatar circle (for profile photo) */
  variant?: 'default' | 'avatar'
  /** Use public upload (no auth) - for registration flow */
  publicUpload?: boolean
  /** Only the file input + crop modal (e.g. trigger from another control via `inputRef`) */
  headless?: boolean
}

export function FileUpload({
  value,
  onChange,
  inputRef,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  label,
  hint,
  className,
  variant = 'default',
  publicUpload = false,
  headless = false,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [imgLoadError, setImgLoadError] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const cropObjectUrlRef = useRef<string | null>(null)
  useEffect(() => setImgLoadError(false), [value])

  const uploadFn = publicUpload ? uploadAvatarForRegister : uploadFile

  const isAvatar = variant === 'avatar'

  const closeCrop = () => {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current)
      cropObjectUrlRef.current = null
    }
    setCropSrc(null)
    setCropOpen(false)
  }

  useEffect(() => {
    return () => {
      if (cropObjectUrlRef.current) URL.revokeObjectURL(cropObjectUrlRef.current)
    }
  }, [])

  const handleCropConfirm = async (blob: Blob) => {
    setError('')
    setUploading(true)
    try {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
      const url = await uploadFn(file)
      onChange(url)
      closeCrop()
    } catch (err: unknown) {
      setError(getApiError(err).message)
    } finally {
      setUploading(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const input = e.target
    if (!file) return
    input.value = ''
    setError('')

    if (isAvatar) {
      if (cropObjectUrlRef.current) URL.revokeObjectURL(cropObjectUrlRef.current)
      const url = URL.createObjectURL(file)
      cropObjectUrlRef.current = url
      setCropSrc(url)
      setCropOpen(true)
      return
    }

    setUploading(true)
    try {
      const url = await uploadFn(file)
      onChange(url)
    } catch (err: unknown) {
      setError(getApiError(err).message)
    } finally {
      setUploading(false)
    }
  }

  const shouldTryImagePreview = (() => {
    if (!value || !accept.includes('image')) return false
    if (value.startsWith('data:')) return true
    const lower = value.toLowerCase()
    // If explicit non-image extension is present, avoid broken image preview.
    if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z)(\?|#|$)/i.test(lower)) return false
    return true
  })()

  if (headless && isAvatar) {
    return (
      <>
        <AvatarCropModal
          open={cropOpen}
          imageSrc={cropSrc}
          onClose={closeCrop}
          onConfirm={handleCropConfirm}
          busy={uploading}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="sr-only"
          disabled={uploading || cropOpen}
          aria-label={label ?? 'Upload avatar'}
        />
        {error ? (
          <p role="alert" className="sr-only">
            {error}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {isAvatar && (
        <AvatarCropModal
          open={cropOpen}
          imageSrc={cropSrc}
          onClose={closeCrop}
          onConfirm={handleCropConfirm}
          busy={uploading}
        />
      )}
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
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="absolute inset-0 cursor-pointer opacity-0 z-10"
          disabled={uploading || cropOpen}
          aria-label={label ?? 'Upload file'}
        />
        {uploading ? (
          <Loader2 className={cn('animate-spin text-[var(--color-text-muted)]', isAvatar ? 'w-10 h-10' : 'w-8 h-8')} aria-hidden />
        ) : value ? (
          <>
            {shouldTryImagePreview && !imgLoadError ? (
              <img
                src={getImageUrl(value)}
                alt=""
                className={cn(isAvatar ? 'object-cover w-full h-full' : 'object-contain max-h-24 max-w-full rounded')}
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
