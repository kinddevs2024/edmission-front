import { motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TiltCard } from '@/components/ui/TiltCard'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

const VIEWBOX = { w: 100, h: 70 }

const NODES = [
  { x: 10, y: 45 },
  { x: 22, y: 26 },
  { x: 31, y: 58 },
  { x: 44, y: 33 },
  { x: 56, y: 63 },
  { x: 69, y: 22 },
  { x: 77, y: 50 },
  { x: 88, y: 36 },
]

/** Edges as [fromIndex, toIndex] for a connected mesh */
const EDGES: [number, number][] = [
  [0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5], [4, 6], [5, 6], [5, 7], [6, 7], [7, 0],
  [0, 3], [2, 5], [4, 7], [1, 4], [3, 6],
]

/** Drift per node for floating motion (viewBox units) */
const FLOAT_OFFSETS = [
  [0.5, -0.35], [0.45, 0.5], [-0.4, 0.45], [0.55, 0.3], [-0.35, -0.5], [0.4, -0.45], [-0.5, 0.4], [-0.45, -0.35],
]

const NODE_BASE_R = 2
const CURSOR_INFLUENCE = 18
const HOVER_THRESHOLD = 8

function useNetworkCursor(viewBox: { w: number; h: number }) {
  const ref = useRef<SVGSVGElement>(null)
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = ref.current
      if (!svg) return
      // Use SVG API so coordinates are correct even when SVG is inside 3D-tilted container
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const ctm = svg.getScreenCTM()
      const svgP = ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 }
      // User space is already in viewBox units (0..100, 0..70)
      setPoint({ x: svgP.x, y: svgP.y })
    },
    [viewBox.w, viewBox.h]
  )

  const onMouseLeave = useCallback(() => setPoint(null), [])

  return { ref, point, onMouseMove, onMouseLeave }
}

function getHoveredNodeIndex(point: { x: number; y: number } | null): number | null {
  if (!point) return null
  let minDist = Infinity
  let idx: number | null = null
  NODES.forEach((node, i) => {
    const d = Math.hypot(point.x - node.x, point.y - node.y)
    if (d < minDist && d < HOVER_THRESHOLD) {
      minDist = d
      idx = i
    }
  })
  return idx
}

export function GlobalNetworkSection() {
  const { t } = useTranslation('landing')
  const { ref: svgRef, point, onMouseMove, onMouseLeave } = useNetworkCursor(VIEWBOX)
  const hoveredIndex = getHoveredNodeIndex(point)

  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/45">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('network.eyebrow')}
            align="center"
            title={t('network.title')}
            description={t('network.description')}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <TiltCard
            maxTilt={14}
            perspective={600}
            className="mt-10 [transform-style:preserve-3d]"
          >
            <div className="relative overflow-visible p-2 md:p-4">
              <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
                className="block h-[260px] w-full md:h-[320px]"
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
              >
                <defs>
                  <filter id="network-node-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Mesh edges */}
                <g stroke="#3C4048" strokeWidth="0.22" strokeOpacity="0.85">
                  {EDGES.map(([i, j], idx) => {
                    const a = NODES[i]
                    const b = NODES[j]
                    return (
                      <line
                        key={`${i}-${j}`}
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        className="network-edge"
                        style={{ animationDelay: `${idx * 0.8}s` }}
                      />
                    )
                  })}
                </g>

                {/* Nodes with floating motion */}
                {NODES.map((node, index) => {
                  const [dx, dy] = FLOAT_OFFSETS[index]
                  const dist = point
                    ? Math.hypot(point.x - node.x, point.y - node.y)
                    : Infinity
                  const influence = Math.max(0, 1 - dist / CURSOR_INFLUENCE)
                  const r = NODE_BASE_R + influence * 0.8
                  const glow = influence > 0.3
                  const opacity = 0.75 + influence * 0.25

                  return (
                    <motion.g
                      key={index}
                      filter={glow ? 'url(#network-node-glow)' : undefined}
                      initial={false}
                      animate={{
                        x: [0, dx, 0, -dx * 0.6, 0],
                        y: [0, dy * 0.6, dy, 0, 0],
                      }}
                      transition={{
                        duration: 4 + index * 0.4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.2,
                      }}
                    >
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r={r}
                        fill="#9EF01A"
                        style={{ opacity }}
                        animate={{
                          opacity: point ? opacity : [0.5, 1, 0.5],
                        }}
                        transition={
                          point
                            ? { duration: 0.15 }
                            : { duration: 2.6, repeat: Infinity, delay: index * 0.15 }
                        }
                      />
                    </motion.g>
                  )
                })}
                </svg>

                {/* Hover tooltip */}
                {hoveredIndex !== null && (
                  <motion.div
                    className="pointer-events-none absolute z-10 max-w-[200px] rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)] shadow-lg"
                    style={{
                      left: `${(NODES[hoveredIndex].x / VIEWBOX.w) * 100}%`,
                      top: `${(NODES[hoveredIndex].y / VIEWBOX.h) * 100}%`,
                      transform: 'translate(-50%, -120%)',
                    }}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {t(`network.node${hoveredIndex}`)}
                  </motion.div>
                )}
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  )
}
