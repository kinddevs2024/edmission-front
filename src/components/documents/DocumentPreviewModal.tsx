import { Modal } from '@/components/ui/Modal'
import { DocumentCanvasStage } from './DocumentCanvasStage'
import { parseScene } from '@/utils/documentScene'
import { getImageUrl } from '@/services/upload'
import type { DocumentPageFormat } from '@/types/documentModule'

interface DocumentPreviewModalProps {
  open: boolean
  onClose: () => void
  title: string
  document: {
    fileUrl?: string
    canvasJson?: string
    pageFormat?: DocumentPageFormat
    width?: number
    height?: number
  } | null
}

export function DocumentPreviewModal({ open, onClose, title, document }: DocumentPreviewModalProps) {
  const fileUrl = document?.fileUrl ? getImageUrl(document.fileUrl) : ''
  const isPdf = fileUrl ? fileUrl.toLowerCase().includes('.pdf') || fileUrl.includes('application/pdf') : false
  const isImage = fileUrl ? /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i.test(fileUrl) || fileUrl.startsWith('data:image/') : false
  const scene = document?.canvasJson
    ? parseScene(document.canvasJson, document.pageFormat ?? 'A4_PORTRAIT', document.width, document.height)
    : null

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {!document ? null : fileUrl ? (
        <div className="min-h-[200px] max-h-[70vh] overflow-auto">
          {isPdf ? (
            <iframe src={fileUrl} title={title} className="w-full h-[60vh] rounded border border-[var(--color-border)]" />
          ) : isImage ? (
            <img src={fileUrl} alt={title} className="max-w-full h-auto rounded border border-[var(--color-border)]" />
          ) : (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-accent hover:underline">
              Open / Download
            </a>
          )}
        </div>
      ) : scene ? (
        <div className="max-h-[70vh] overflow-auto">
          <DocumentCanvasStage scene={scene} zoom={0.36} />
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">Preview is not available.</p>
      )}
    </Modal>
  )
}
