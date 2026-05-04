import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HelpTooltip } from '@/components/ui/HelpTooltip'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { MAX_UPLOAD_SIZE_MB, uploadFile } from '@/services/upload'
import { useDocumentEditorStore } from '@/store/documentEditorStore'
import { DocumentCanvasStage } from './DocumentCanvasStage'
import { MERGE_TAG_GROUPS, coerceCanvasString, createSamplePayload, resolveScene, stringifyScene } from '@/utils/documentScene'
import type { DocumentTemplate, EditableSceneDocument, EditorDocumentType } from '@/types/documentModule'
import { toastApiError } from '@/utils/toastError'

type TypeOption = {
  value: EditorDocumentType
  label: string
}

const DEFAULT_TYPE_OPTIONS: TypeOption[] = [
  { value: 'offer', label: 'Offer' },
  { value: 'scholarship', label: 'Scholarship' },
]

export function DocumentEditor({
  mode = 'template',
  saving,
  saveLabel,
  typeOptions = DEFAULT_TYPE_OPTIONS,
  onSave,
}: {
  mode?: 'template' | 'profile'
  saving?: boolean
  saveLabel?: string
  typeOptions?: TypeOption[]
  onSave: (payload: EditableSceneDocument & { type: EditorDocumentType; name: string }) => Promise<void> | void
}) {
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const signatureInputRef = useRef<HTMLInputElement | null>(null)
  const backgroundInputRef = useRef<HTMLInputElement | null>(null)
  const { t } = useTranslation(['documents', 'common'])
  const scene = useDocumentEditorStore((state) => state.scene)
  const selectedElementId = useDocumentEditorStore((state) => state.selectedElementId)
  const stageZoom = useDocumentEditorStore((state) => state.stageZoom)
  const metadata = useDocumentEditorStore((state) => state.metadata)
  const previewData = useDocumentEditorStore((state) => state.previewData)
  const selectElement = useDocumentEditorStore((state) => state.selectElement)
  const setMetadata = useDocumentEditorStore((state) => state.setMetadata)
  const setPreviewData = useDocumentEditorStore((state) => state.setPreviewData)
  const setStageZoom = useDocumentEditorStore((state) => state.setStageZoom)
  const addElement = useDocumentEditorStore((state) => state.addElement)
  const updateElement = useDocumentEditorStore((state) => state.updateElement)
  const removeElement = useDocumentEditorStore((state) => state.removeElement)
  const duplicateElement = useDocumentEditorStore((state) => state.duplicateElement)
  const moveLayer = useDocumentEditorStore((state) => state.moveLayer)
  const toggleLock = useDocumentEditorStore((state) => state.toggleLock)
  const alignElement = useDocumentEditorStore((state) => state.alignElement)
  const undo = useDocumentEditorStore((state) => state.undo)
  const redo = useDocumentEditorStore((state) => state.redo)
  const [showGuide, setShowGuide] = useState(false)
  const [saveAttempted, setSaveAttempted] = useState(false)
  const isTemplateMode = mode === 'template'
  const selectedElement = scene.elements.find((element) => element.id === selectedElementId) ?? null
  const trimmedName = metadata.name.trim()
  const nameError = saveAttempted && !trimmedName
    ? t('documents:editor.nameRequired', 'Enter a document name before saving.')
    : undefined
  const effectivePreviewData = isTemplateMode
    ? mergePreviewData(createSamplePayload(isDocumentTemplateType(metadata.type) ? metadata.type : 'offer'), previewData)
    : {}
  const previewScene = isTemplateMode ? resolveScene(scene, effectivePreviewData) : scene
  const onboardingStorageKey = mode === 'template' ? 'document-editor-guide-template-hidden' : 'document-editor-guide-profile-hidden'

  useEffect(() => {
    if (typeof window === 'undefined') return
    setShowGuide(window.localStorage.getItem(onboardingStorageKey) !== '1')
  }, [onboardingStorageKey])

  const dismissGuide = () => {
    setShowGuide(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, '1')
    }
  }

  const handleAddText = () => {
    addElement({
      id: `text-${Date.now()}`,
      type: 'text',
      x: 56,
      y: 56,
      width: 360,
      height: 120,
      content: isTemplateMode ? 'Congratulations, {{student.fullName}}!' : 'Type your heading here',
      fontSize: 28,
      fontFamily: 'Georgia',
      fill: '#0f172a',
      textAlign: 'left',
      lineHeight: 1.2,
      layer: scene.elements.length,
    })
  }

  const handleAddShape = () => {
    addElement({
      id: `shape-${Date.now()}`,
      type: 'shape',
      x: 72,
      y: 160,
      width: 220,
      height: 80,
      fill: '#0f766e',
      stroke: '#115e59',
      strokeWidth: 1,
      radius: 16,
      layer: scene.elements.length,
    })
  }

  const handleAddLine = () => {
    addElement({
      id: `line-${Date.now()}`,
      type: 'line',
      x: 64,
      y: 280,
      width: 360,
      height: 2,
      stroke: '#94a3b8',
      strokeWidth: 2,
      points: [0, 0, 360, 0],
      layer: scene.elements.length,
    })
  }

  const handleUploadAsset = async (kind: 'image' | 'logo' | 'signature', file: File) => {
    try {
      const fileUrl = await uploadFile(file)
      setMetadata({
        assets: [
          ...metadata.assets,
          {
            type: kind,
            fileUrl,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
          },
        ],
      })
      addElement({
        id: `${kind}-${Date.now()}`,
        type: kind,
        x: 64,
        y: 360,
        width: kind === 'logo' ? 120 : 180,
        height: kind === 'signature' ? 72 : 120,
        src: fileUrl,
        layer: scene.elements.length,
      })
    } catch (error) {
      toastApiError(error)
    }
  }

  const handleUploadBackground = async (file: File) => {
    try {
      const fileUrl = await uploadFile(file)
      const assetType = file.type === 'application/pdf' ? 'pdf_background' : 'background'
      setMetadata({
        assets: [
          ...metadata.assets,
          {
            type: assetType,
            fileUrl,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
          },
        ],
      })
      if (assetType === 'background') {
        addElement({
          id: `background-${Date.now()}`,
          type: 'image',
          x: 0,
          y: 0,
          width: scene.page.width,
          height: scene.page.height,
          src: fileUrl,
          locked: true,
          layer: -1,
        })
      }
    } catch (error) {
      toastApiError(error)
    }
  }

  const handleSave = async () => {
    if (!trimmedName) {
      setSaveAttempted(true)
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      nameInputRef.current?.focus()
      return
    }

    setSaveAttempted(false)
    await onSave({
      id: metadata.id,
      name: trimmedName,
      type: metadata.type,
      status: metadata.status,
      pageFormat: metadata.pageFormat,
      width: scene.page.width,
      height: scene.page.height,
      editorVersion: metadata.editorVersion,
      canvasJson: stringifyScene(scene),
      previewImageUrl: metadata.previewImageUrl,
      assets: metadata.assets,
    })
  }

  const guideSteps = isTemplateMode
    ? [
      t('documents:editor.templateGuideStep1', '1. Start with Add text, Upload image, or Background on the left.'),
      t('documents:editor.templateGuideStep2', '2. Click any block on the page to resize, move, lock, or style it.'),
      t('documents:editor.templateGuideStep3', '3. Use merge tags only inside text blocks when you need student data.'),
    ]
    : [
      t('documents:editor.profileGuideStep1', '1. Add a title or image first so the page is not empty.'),
      t('documents:editor.profileGuideStep2', '2. Click any block to resize, move, duplicate, or delete it.'),
      t('documents:editor.profileGuideStep3', '3. Save the document and it will appear in the student profile.'),
    ]

  return (
    <div className="space-y-4">
      {showGuide ? (
        <Card className="border border-primary-accent/30 bg-primary-accent/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{t('documents:editor.quickStart', 'Quick start')}</p>
              <h3 className="text-lg font-semibold">
                {isTemplateMode
                  ? t('documents:editor.templateGuideTitle', 'How this editor works')
                  : t('documents:editor.profileGuideTitle', 'Build a profile document in 3 steps')}
              </h3>
              <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
                {guideSteps.map((step) => (
                  <p key={step}>{step}</p>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={dismissGuide}>{t('documents:editor.hideGuide', 'Hide guide')}</Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <Card className="space-y-4 border border-[var(--color-border)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Start here</p>
            <h3 className="mt-1 text-lg font-semibold">{isTemplateMode ? 'Build your layout' : 'Build your document'}</h3>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isTemplateMode
                ? 'Use text, images, shapes, and variables. Click blocks on the page to edit them.'
                : 'Use text, images, shapes, and signatures. Click blocks on the page to edit them.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={handleAddText}>Add text</Button>
            <Button variant="secondary" size="sm" onClick={handleAddShape}>Add shape</Button>
            <Button variant="secondary" size="sm" onClick={handleAddLine}>Add line</Button>
            <Button variant="secondary" size="sm" onClick={() => imageInputRef.current?.click()}>{t('documents:editor.uploadImage', 'Upload image')}</Button>
            <Button variant="secondary" size="sm" onClick={() => logoInputRef.current?.click()}>{t('documents:editor.uploadLogo', 'Upload logo')}</Button>
            <Button variant="secondary" size="sm" onClick={() => signatureInputRef.current?.click()}>{t('documents:editor.signature', 'Signature')}</Button>
            <Button variant="secondary" size="sm" onClick={() => backgroundInputRef.current?.click()}>{t('documents:editor.background', 'Background')}</Button>
            <Button variant="secondary" size="sm" onClick={undo}>{t('common:undo', 'Undo')}</Button>
            <Button variant="secondary" size="sm" onClick={redo}>{t('common:redo', 'Redo')}</Button>
            <Button variant="secondary" size="sm" onClick={() => setStageZoom(stageZoom + 0.1)}>{t('common:zoomIn', 'Zoom +')}</Button>
            <Button variant="secondary" size="sm" onClick={() => setStageZoom(stageZoom - 0.1)}>{t('common:zoomOut', 'Zoom -')}</Button>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('common:maxFileSize', 'Maximum file size: {{size}} MB', { size: MAX_UPLOAD_SIZE_MB })}
          </p>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              handleUploadAsset('image', file)
              event.target.value = ''
            }}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              handleUploadAsset('logo', file)
              event.target.value = ''
            }}
          />
          <input
            ref={signatureInputRef}
            type="file"
            accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              handleUploadAsset('signature', file)
              event.target.value = ''
            }}
          />
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/*,image/heic,image/heif,image/heic-sequence,image/heif-sequence,.heic,.heics,.heif,.heifs,.pdf,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              handleUploadBackground(file)
              event.target.value = ''
            }}
          />

          {isTemplateMode ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Insert variable</p>
              {Object.entries(MERGE_TAG_GROUPS).map(([group, tags]) => (
                <div key={group} className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="rounded-full border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-text-muted)] hover:border-primary-accent hover:text-primary-accent"
                        onClick={() => {
                          if (selectedElement?.type !== 'text') return
                          updateElement(selectedElement.id, { content: `${coerceCanvasString(selectedElement.content)}${coerceCanvasString(selectedElement.content) ? ' ' : ''}${tag}` }, true)
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
              Student mode is simpler: no merge tags, only the final layout that will be shown in the profile.
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-3 border border-[var(--color-border)]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Canvas</p>
              <h2 className="mt-1 text-xl font-semibold">{metadata.name || (isTemplateMode ? 'Untitled template' : 'Untitled document')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => selectedElement && alignElement(selectedElement.id, 'left')} disabled={!selectedElement}>Align left</Button>
              <Button variant="secondary" size="sm" onClick={() => selectedElement && alignElement(selectedElement.id, 'center')} disabled={!selectedElement}>Center</Button>
              <Button variant="secondary" size="sm" onClick={() => selectedElement && moveLayer(selectedElement.id, 'up')} disabled={!selectedElement}>Layer +</Button>
              <Button variant="secondary" size="sm" onClick={() => selectedElement && moveLayer(selectedElement.id, 'down')} disabled={!selectedElement}>Layer -</Button>
              <Button size="sm" onClick={handleSave} loading={saving} disabled={saving}>
                {saveLabel ?? (isTemplateMode ? 'Save template' : 'Save document')}
              </Button>
            </div>
            {nameError ? (
              <p className="w-full text-sm text-red-500 md:text-right">
                {t('documents:editor.saveRequiresName', 'Add a document name first, then save again.')}
              </p>
            ) : null}
          </Card>

          <DocumentCanvasStage
            scene={previewScene}
            selectedElementId={selectedElementId}
            editable
            zoom={stageZoom}
            onSelectElement={selectElement}
            onChangeElement={updateElement}
          />
        </div>

        <Card className="space-y-4 border border-[var(--color-border)]">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Inspector</p>
            <h3 className="mt-1 text-lg font-semibold">{selectedElement ? 'Element properties' : isTemplateMode ? 'Template settings' : 'Document settings'}</h3>
          </div>

          <Input
            ref={nameInputRef}
            label={isTemplateMode ? 'Template name' : 'Document name'}
            value={metadata.name}
            error={nameError}
            right={(
              <HelpTooltip
                content={t(
                  isTemplateMode ? 'documents:editor.templateNameHelp' : 'documents:editor.documentNameHelp',
                  isTemplateMode
                    ? 'Name the template so it is easy to find in your documents list and ready to save.'
                    : 'Name the document so it is easy to find later in the profile and documents list.'
                )}
              />
            )}
            onChange={(event) => {
              setMetadata({ name: event.target.value })
              if (saveAttempted && event.target.value.trim()) {
                setSaveAttempted(false)
              }
            }}
          />
          <Select
            label="Document type"
            value={metadata.type}
            onChange={(event) => setMetadata({ type: event.target.value as EditorDocumentType })}
            options={typeOptions}
          />

          {isTemplateMode ? (
            <>
              <Select
                label="Status"
                value={metadata.status}
                onChange={(event) => setMetadata({ status: event.target.value as DocumentTemplate['status'] })}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <Textarea
                label="Preview student name"
                value={String((previewData.student as { fullName?: string } | undefined)?.fullName ?? '')}
                onChange={(event) =>
                  setPreviewData({
                    ...previewData,
                    student: {
                      ...((previewData.student as Record<string, unknown> | undefined) ?? {}),
                      fullName: event.target.value,
                    },
                  })
                }
                rows={2}
              />
            </>
          ) : null}

          {selectedElement ? (
            <div className="space-y-3 rounded-[22px] border border-[var(--color-border)] p-4">
              {selectedElement.type === 'text' ? (
                <Textarea
                  label="Text content"
                  value={coerceCanvasString(selectedElement.content)}
                  onChange={(event) => updateElement(selectedElement.id, { content: event.target.value }, true)}
                  rows={4}
                />
              ) : null}
              {(selectedElement.type === 'text' || selectedElement.type === 'shape') ? (
                <Input
                  label="Fill"
                  value={selectedElement.fill ?? '#0f172a'}
                  onChange={(event) => updateElement(selectedElement.id, { fill: event.target.value }, true)}
                />
              ) : null}
              {selectedElement.type === 'text' ? (
                <Input
                  label="Font size"
                  type="number"
                  value={selectedElement.fontSize ?? 24}
                  onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) || 24 }, true)}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('documents:editor.width', 'Width')} type="number" value={selectedElement.width} onChange={(event) => updateElement(selectedElement.id, { width: Number(event.target.value) || selectedElement.width }, true)} />
                <Input label={t('documents:editor.height', 'Height')} type="number" value={selectedElement.height} onChange={(event) => updateElement(selectedElement.id, { height: Number(event.target.value) || selectedElement.height }, true)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggleLock(selectedElement.id)}>
                  {selectedElement.locked ? t('documents:editor.unlock', 'Unlock') : t('documents:editor.lock', 'Lock')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => duplicateElement(selectedElement.id)}>{t('common:duplicate', 'Duplicate')}</Button>
                <Button size="sm" variant="danger" onClick={() => removeElement(selectedElement.id)}>{t('common:delete', 'Delete')}</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
              {t('documents:editor.noSelectionHint', 'Click any block on the page to edit it. If nothing is selected, start with Add text or Upload image from the left panel.')}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function mergePreviewData(base: Record<string, unknown>, patch: Record<string, unknown>) {
  const output: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && output[key] && typeof output[key] === 'object' && !Array.isArray(output[key])) {
      output[key] = mergePreviewData(output[key] as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      output[key] = value
    }
  }
  return output
}

function isDocumentTemplateType(type: EditorDocumentType): type is 'offer' | 'scholarship' {
  return type === 'offer' || type === 'scholarship'
}
