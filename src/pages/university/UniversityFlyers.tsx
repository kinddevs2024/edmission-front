import { useEffect, useRef, useState } from 'react'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { uploadFile } from '@/services/upload'
import { deleteUniversityFlyer, getUniversityFlyers, createUniversityFlyer } from '@/services/university'
import { toastApiError } from '@/utils/toastError'
import type { UniversityFlyer } from '@/types/university'
import { getImageUrl } from '@/services/upload'
import { UploadCloud } from 'lucide-react'

type FlyerDraft = {
  id: string
  title: string
  mediaUrl?: string
  mediaType: string
  source: 'upload' | 'url' | 'editor'
  previewImageUrl?: string
}

function toDraft(item: UniversityFlyer): FlyerDraft {
  return {
    id: String(item.id),
    title: item.title ?? '',
    mediaUrl: item.mediaUrl,
    mediaType: item.mediaType ?? '',
    source: item.source ?? 'url',
    previewImageUrl: item.previewImageUrl,
  }
}

export function UniversityFlyers() {
  const { t } = useTranslation('university')
  const navigate = useNavigate()
  const [flyers, setFlyers] = useState<FlyerDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getUniversityFlyers()
      .then((data) => setFlyers(data.map(toDraft)))
      .catch((error) => {
        toastApiError(error)
        setFlyers([])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleRemove = (id: string) => {
    deleteUniversityFlyer(id)
      .then(() => setFlyers((prev) => prev.filter((item) => item.id !== id)))
      .catch(toastApiError)
  }

  const handlePublishUpload = async () => {
    if (!selectedFile) return
    setSaving(true)
    try {
      const uploadedUrl = await uploadFile(selectedFile)
      const created = await createUniversityFlyer({
        title: title.trim() || undefined,
        source: 'upload',
        mediaUrl: uploadedUrl,
        mediaType: selectedFile.type || 'application/octet-stream',
        isPublished: true,
      })
      setFlyers((prev) => [toDraft(created), ...prev])
      setTitle('')
      setSelectedFile(null)
      setSelectedPreviewUrl('')
      setShowCreate(false)
    } catch (error) {
      toastApiError(error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('flyers.pageTitle', 'Flyers')} icon="Image" />
      <Card className="border border-[var(--color-border)]">
        <p className="text-sm text-[var(--color-text-muted)]">
          {t('flyers.pageHint', 'Create visual posts for students. Primary option is upload from device; editor mode is optional.')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => setShowCreate((v) => !v)}>{t('flyers.addFlyer', 'Add flyer')}</Button>
        </div>
      </Card>

      {showCreate ? (
        <Card className="space-y-3 border border-[var(--color-border)]">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/university/flyers/new')}>
              {t('flyers.createWithEditor', 'Create with Redactor Editor')}
            </Button>
          </div>
          <Input
            label={t('flyers.optionalTitle', 'Title (optional)')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t('flyers.optionalTitlePlaceholder', 'Optional post title')}
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text)]">
              {t('flyers.uploadFromDevice', 'Upload from device')}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setSelectedFile(file)
                if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl)
                setSelectedPreviewUrl(file ? URL.createObjectURL(file) : '')
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group w-full rounded-card border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)]/70 p-8 text-center transition-colors hover:border-primary-accent hover:bg-primary-accent/5"
            >
              <div className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
                <UploadCloud className="h-8 w-8 text-[var(--color-text-muted)] group-hover:text-primary-accent" />
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {t('flyers.dropzoneTitle', 'Click to choose a file')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {t('flyers.dropzoneHint', 'Images, videos and documents are supported')}
                </p>
              </div>
            </button>
            {selectedFile ? (
              <p className="text-sm text-[var(--color-text-muted)] break-all">{selectedFile.name}</p>
            ) : null}
            {selectedFile && selectedPreviewUrl ? (
              selectedFile.type.startsWith('image/') ? (
                <img src={selectedPreviewUrl} alt="" className="w-full max-h-72 rounded-card object-cover bg-[var(--color-border)]/30" />
              ) : selectedFile.type.startsWith('video/') ? (
                <video src={selectedPreviewUrl} controls className="w-full max-h-72 rounded-card bg-black/80" />
              ) : (
                <div className="rounded-card border border-dashed border-[var(--color-border)] p-3 text-sm text-[var(--color-text-muted)]">
                  {t('flyers.fileSelected', 'File selected and ready to publish')}
                </div>
              )
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePublishUpload} disabled={saving || !selectedFile}>
              {saving ? t('flyers.saving', 'Saving...') : t('flyers.publish', 'Publish flyer')}
            </Button>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              {t('common:cancel', 'Cancel')}
            </Button>
          </div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="border border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-text-muted)]">{t('common:loading', 'Loading...')}</p>
        </Card>
      ) : flyers.length === 0 ? (
        <Card className="border border-dashed border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
          {t('flyers.empty', 'No flyers yet. Click "Add flyer" to publish your first post.')}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {flyers.map((flyer) => (
            <Card key={flyer.id} className="space-y-3 border border-[var(--color-border)]">
              {flyer.title ? <h3 className="text-base font-semibold">{flyer.title}</h3> : null}
              {flyer.source === 'editor' && flyer.previewImageUrl ? (
                <img src={getImageUrl(flyer.previewImageUrl)} alt={flyer.title ?? ''} className="w-full rounded-card object-cover max-h-80 bg-[var(--color-border)]/30" />
              ) : flyer.mediaType?.toLowerCase().startsWith('image/') && flyer.mediaUrl ? (
                <img src={getImageUrl(flyer.mediaUrl)} alt={flyer.title ?? ''} className="w-full rounded-card object-cover max-h-80 bg-[var(--color-border)]/30" />
              ) : flyer.mediaType?.toLowerCase().startsWith('video/') && flyer.mediaUrl ? (
                <video src={getImageUrl(flyer.mediaUrl)} controls className="w-full max-h-80 rounded-card bg-black/80" />
              ) : flyer.mediaUrl ? (
                <a href={flyer.mediaUrl} target="_blank" rel="noreferrer" className="text-primary-accent underline break-all">
                  {flyer.mediaUrl}
                </a>
              ) : (
                <div className="text-sm text-[var(--color-text-muted)]">{t('flyers.editorPost', 'Created with editor')}</div>
              )}
              <div className="flex gap-2">
                <Button variant="danger" onClick={() => handleRemove(flyer.id)}>
                  {t('common:delete', 'Delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
