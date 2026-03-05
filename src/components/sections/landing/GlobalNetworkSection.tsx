import { motion } from 'framer-motion'
import { Reveal } from './Reveal'
import { SectionHeading } from './SectionHeading'

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

export function GlobalNetworkSection() {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-card)]/45">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Global Network"
            align="center"
            title="A Growing Academic Network"
            description="A distributed network of students and universities connected through a single transparent infrastructure layer."
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-10 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <svg viewBox="0 0 100 70" className="h-[260px] w-full text-[var(--color-border)] md:h-[320px]">
              {NODES.map((node, index) => (
                <g key={`${node.x}-${node.y}`}>
                  {NODES.slice(index + 1, index + 3).map((target) => (
                    <line
                      key={`${node.x}-${node.y}-${target.x}-${target.y}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="currentColor"
                      strokeOpacity="0.7"
                    />
                  ))}
                </g>
              ))}
              {NODES.map((node, index) => (
                <motion.circle
                  key={index}
                  cx={node.x}
                  cy={node.y}
                  r="1.6"
                  fill="currentColor"
                  className="text-primary-accent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: index * 0.15 }}
                />
              ))}
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
