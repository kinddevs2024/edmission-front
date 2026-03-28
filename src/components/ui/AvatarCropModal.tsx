import { useState, useCallback, useEffect } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { useTranslation } from 'react-i18next'
import 'react-easy-crop/react-easy-crop.css'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { getCroppedSquareJpegBlob } from '@/utils/cropImage'

interface AvatarCropModalProps {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onConfirm: (blob: Blob) => Promise<void>
  busy?: boolean
}

export function AvatarCropModal({ open, imageSrc, onClose, onConfirm, busy }: AvatarCropModalProps) {
  const { t } = useTranslation('common')
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  useEffect(() => {
    if (open && imageSrc) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
  }, [open, imageSrc])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    const blob = await getCroppedSquareJpegBlob(imageSrc, croppedAreaPixels)
    await onConfirm(blob)
  }

  return (
    <Modal
      open={open && Boolean(imageSrc)}
      onClose={busy ? () => {} : onClose}
      title={t('avatarCropTitle', 'Adjust photo')}
      panelClassName="max-w-md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t('avatarCropCancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !croppedAreaPixels}
            loading={busy}
          >
            {t('avatarCropApply', 'Use photo')}
          </Button>
        </>
      }
    >
      {imageSrc && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">
            {t(
              'avatarCropHint',
              'Drag to reposition and zoom so your face fits nicely in the square — avatars are shown as a circle.'
            )}
          </p>
          <div className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-input bg-[var(--color-bg)]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <label className="flex items-center gap-3 text-sm text-[var(--color-text)]">
            <span className="shrink-0 w-14">{t('avatarCropZoom', 'Zoom')}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[var(--color-primary-accent,#22c55e)]"
              disabled={busy}
            />
          </label>
        </div>
      )}
    </Modal>
  )
}
