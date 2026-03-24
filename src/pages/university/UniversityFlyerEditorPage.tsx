import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageTitle } from '@/components/ui/PageTitle'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { DocumentEditor } from '@/components/documents/DocumentEditor'
import { createUniversityFlyer } from '@/services/university'
import { toastApiError } from '@/utils/toastError'
import type { DocumentPageFormat } from '@/types/documentModule'

export function UniversityFlyerEditorPage() {
  const { t } = useTranslation('university')
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-4">
      <PageTitle title={t('flyers.editorTitle', 'Create flyer with editor')} icon="Image" />
      <Card className="border border-[var(--color-border)]">
        <Input
          label={t('flyers.optionalTitle', 'Title (optional)')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('flyers.optionalTitlePlaceholder', 'Optional post title')}
        />
      </Card>
      <DocumentEditor
        saving={saving}
        saveLabel={t('flyers.publish', 'Publish flyer')}
        typeOptions={[{ value: 'offer', label: 'Flyer' }]}
        onSave={async (payload) => {
          setSaving(true)
          try {
            await createUniversityFlyer({
              title: title.trim() || undefined,
              source: 'editor',
              canvasJson: payload.canvasJson,
              pageFormat: payload.pageFormat as DocumentPageFormat,
              width: payload.width,
              height: payload.height,
              editorVersion: payload.editorVersion,
              previewImageUrl: payload.previewImageUrl,
              isPublished: true,
            })
            navigate('/university/flyers')
          } catch (error) {
            toastApiError(error)
          } finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
