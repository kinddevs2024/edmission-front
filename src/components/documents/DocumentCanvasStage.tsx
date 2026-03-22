import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Line, Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import { getImageUrl } from '@/services/upload'
import type { DocumentScene, DocumentSceneElement } from '@/types/documentModule'
import { clampElementToPage, snapValue } from '@/utils/documentScene'

interface DocumentCanvasStageProps {
  scene: DocumentScene
  selectedElementId?: string | null
  zoom?: number
  editable?: boolean
  onSelectElement?: (id: string | null) => void
  onChangeElement?: (id: string, patch: Partial<DocumentSceneElement>, commit?: boolean) => void
}

export function DocumentCanvasStage({
  scene,
  selectedElementId,
  zoom = 1,
  editable = false,
  onSelectElement,
  onChangeElement,
}: DocumentCanvasStageProps) {
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({})
  const sortedElements = useMemo(
    () => [...scene.elements].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0)),
    [scene.elements]
  )

  useEffect(() => {
    if (!editable || !selectedElementId || !transformerRef.current) return
    const node = nodeRefs.current[selectedElementId]
    if (!node) return
    transformerRef.current.nodes([node])
    transformerRef.current.getLayer()?.batchDraw()
  }, [editable, selectedElementId, scene.elements])

  return (
    <div className="rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-4 overflow-auto">
      <div style={{ width: scene.page.width * zoom, height: scene.page.height * zoom }}>
        <Stage
          width={scene.page.width * zoom}
          height={scene.page.height * zoom}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={(event) => {
            if (!editable || event.target !== event.target.getStage()) return
            onSelectElement?.(null)
          }}
          onTouchStart={(event) => {
            if (!editable || event.target !== event.target.getStage()) return
            onSelectElement?.(null)
          }}
        >
          <Layer>
            <Rect
              x={0}
              y={0}
              width={scene.page.width}
              height={scene.page.height}
              fill={scene.page.backgroundColor ?? '#ffffff'}
              cornerRadius={12}
              stroke="#dbe3f0"
              strokeWidth={1}
            />
            <GridOverlay scene={scene} />
            <SafeMarginOverlay scene={scene} />
            {editable && scene.elements.length === 0 ? (
              <>
                <Rect
                  x={56}
                  y={72}
                  width={scene.page.width - 112}
                  height={120}
                  dash={[12, 10]}
                  stroke="rgba(14,116,144,0.35)"
                  strokeWidth={1}
                  cornerRadius={20}
                  fill="rgba(240,249,255,0.72)"
                  listening={false}
                />
                <Text
                  x={84}
                  y={104}
                  width={scene.page.width - 168}
                  text="Blank page. Start with Add text, Upload image, or Background from the left panel."
                  fontSize={20}
                  lineHeight={1.35}
                  fill="#0f172a"
                  align="center"
                  listening={false}
                />
              </>
            ) : null}
            {sortedElements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                scene={scene}
                selected={selectedElementId === element.id}
                editable={editable}
                setNodeRef={(node) => {
                  nodeRefs.current[element.id] = node
                }}
                onSelect={() => onSelectElement?.(element.id)}
                onChange={(patch, commit = true) => onChangeElement?.(element.id, patch, commit)}
              />
            ))}
            {editable && selectedElementId ? (
              <Transformer
                ref={transformerRef}
                rotateEnabled
                enabledAnchors={[
                  'top-left',
                  'top-center',
                  'top-right',
                  'middle-left',
                  'middle-right',
                  'bottom-left',
                  'bottom-center',
                  'bottom-right',
                ]}
                boundBoxFunc={(_oldBox, newBox) => {
                  if (newBox.width < 24 || newBox.height < 12) return _oldBox
                  return newBox
                }}
              />
            ) : null}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}

function GridOverlay({ scene }: { scene: DocumentScene }) {
  const xLines: number[] = []
  const yLines: number[] = []
  for (let x = 0; x < scene.page.width; x += 32) xLines.push(x)
  for (let y = 0; y < scene.page.height; y += 32) yLines.push(y)

  return (
    <>
      {xLines.map((x) => (
        <Line key={`v-${x}`} points={[x, 0, x, scene.page.height]} stroke="rgba(148,163,184,0.14)" strokeWidth={1} listening={false} />
      ))}
      {yLines.map((y) => (
        <Line key={`h-${y}`} points={[0, y, scene.page.width, y]} stroke="rgba(148,163,184,0.14)" strokeWidth={1} listening={false} />
      ))}
    </>
  )
}

function SafeMarginOverlay({ scene }: { scene: DocumentScene }) {
  const margin = scene.page.safeMargin ?? 32
  return (
    <Rect
      x={margin}
      y={margin}
      width={scene.page.width - margin * 2}
      height={scene.page.height - margin * 2}
      dash={[10, 8]}
      stroke="rgba(14,116,144,0.35)"
      strokeWidth={1}
      listening={false}
    />
  )
}

function CanvasElement({
  element,
  scene,
  selected,
  editable,
  setNodeRef,
  onSelect,
  onChange,
}: {
  element: DocumentSceneElement
  scene: DocumentScene
  selected: boolean
  editable: boolean
  setNodeRef: (node: Konva.Node | null) => void
  onSelect: () => void
  onChange: (patch: Partial<DocumentSceneElement>, commit?: boolean) => void
}) {
  const commonProps = {
    x: element.x,
    y: element.y,
    rotation: element.rotation ?? 0,
    draggable: editable && !element.locked,
    opacity: element.opacity ?? 1,
    onClick: () => editable && onSelect(),
    onTap: () => editable && onSelect(),
    onDragMove: editable
      ? (event: Konva.KonvaEventObject<DragEvent>) => {
        const next = clampElementToPage(
          {
            ...element,
            x: snapValue(event.target.x()),
            y: snapValue(event.target.y()),
          },
          scene
        )
        onChange({ x: next.x, y: next.y }, false)
      }
      : undefined,
    onDragEnd: editable
      ? (event: Konva.KonvaEventObject<DragEvent>) => {
        const next = clampElementToPage(
          {
            ...element,
            x: snapValue(event.target.x()),
            y: snapValue(event.target.y()),
          },
          scene
        )
        onChange({ x: next.x, y: next.y }, true)
      }
      : undefined,
    onTransformEnd: editable
      ? (event: Konva.KonvaEventObject<Event>) => {
        const node = event.target
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        node.scaleX(1)
        node.scaleY(1)
        const next = clampElementToPage(
          {
            ...element,
            x: snapValue(node.x()),
            y: snapValue(node.y()),
            width: Math.max(24, snapValue(Math.max(24, node.width() * scaleX))),
            height: Math.max(12, snapValue(Math.max(12, node.height() * scaleY))),
            rotation: node.rotation(),
          },
          scene
        )
        onChange({
          x: next.x,
          y: next.y,
          width: next.width,
          height: next.height,
          rotation: next.rotation,
        }, true)
      }
      : undefined,
  }

  if (element.type === 'text') {
    return (
      <Text
        ref={setNodeRef}
        {...commonProps}
        width={element.width}
        height={element.height}
        text={element.content ?? 'Text'}
        fill={element.fill ?? '#0f172a'}
        fontSize={element.fontSize ?? 24}
        fontFamily={element.fontFamily ?? 'Georgia'}
        fontStyle={element.fontWeight === 'bold' ? 'bold' : 'normal'}
        align={element.textAlign ?? 'left'}
        lineHeight={element.lineHeight ?? 1.2}
        padding={4}
        stroke={selected && editable ? '#0ea5e9' : undefined}
        strokeWidth={selected && editable ? 0.3 : 0}
      />
    )
  }

  if (element.type === 'shape') {
    return (
      <Rect
        ref={setNodeRef}
        {...commonProps}
        width={element.width}
        height={element.height}
        fill={element.fill ?? '#0f766e'}
        stroke={element.stroke ?? '#134e4a'}
        strokeWidth={element.strokeWidth ?? 1}
        cornerRadius={element.radius ?? 12}
      />
    )
  }

  if (element.type === 'line') {
    return (
      <Line
        ref={setNodeRef}
        {...commonProps}
        points={element.points ?? [0, 0, element.width, 0]}
        stroke={element.stroke ?? '#0f172a'}
        strokeWidth={element.strokeWidth ?? 2}
      />
    )
  }

  return (
    <CanvasImageElement
      element={element}
      commonProps={commonProps}
      selected={selected}
      editable={editable}
      setNodeRef={setNodeRef}
    />
  )
}

function CanvasImageElement({
  element,
  commonProps,
  selected,
  editable,
  setNodeRef,
}: {
  element: DocumentSceneElement
  commonProps: Record<string, unknown>
  selected: boolean
  editable: boolean
  setNodeRef: (node: Konva.Node | null) => void
}) {
  const image = useCanvasImage(element.src)

  if (!image) {
    return (
      <Rect
        ref={setNodeRef}
        {...commonProps}
        width={element.width}
        height={element.height}
        fill="#e2e8f0"
        stroke={selected && editable ? '#0ea5e9' : '#94a3b8'}
        strokeWidth={selected && editable ? 2 : 1}
        dash={[10, 6]}
      />
    )
  }

  return (
    <KonvaImage
      ref={setNodeRef}
      {...commonProps}
      image={image}
      width={element.width}
      height={element.height}
      stroke={selected && editable ? '#0ea5e9' : undefined}
      strokeWidth={selected && editable ? 1 : 0}
      cornerRadius={element.type === 'logo' ? 18 : 8}
    />
  )
}

function useCanvasImage(src?: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!src) {
      setImage(null)
      return
    }
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = getImageUrl(src)
    img.onload = () => setImage(img)
    img.onerror = () => setImage(null)
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])

  return image
}
