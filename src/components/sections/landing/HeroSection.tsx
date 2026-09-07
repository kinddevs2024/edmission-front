import { useEffect, useId, useRef, useState } from 'react'
import './HeroSection.css'

const BACKGROUND = '/university/поменяй_погоду_на_осень._2K_202609061645.jpeg'
const FOREGROUND = '/university/University_building_on_field_2K_202609061440.png'

export function HeroSection() {
  const filterId = `campus-cutout-${useId().replace(/:/g, '')}`
  const trackRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<SVGGElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const track = trackRef.current
      if (!track || !wordRef.current) return
      const distance = track.offsetHeight - window.innerHeight
      const progress = Math.max(0, Math.min(1, -track.getBoundingClientRect().top / Math.max(1, distance)))
      const scene = track.firstElementChild as HTMLElement | null
      const mobile = window.innerWidth < 768
      const coverScale = scene ? Math.max(scene.clientWidth / 1920, scene.clientHeight / 1080) : 1
      const textScale = mobile && scene ? Math.min(1, scene.clientWidth * 0.9 / (1380 * coverScale)) : 1
      // Keep the complete word inside the cropped mobile viewport. Start at the
      // roofline, then lift it above the tower so the final name stays readable.
      const startBaseline = mobile ? 590 + 215 * textScale : 830
      const endBaseline = mobile ? 240 : 620
      const baseline = startBaseline + (endBaseline - startBaseline) * progress
      const transform = `translate(960px, ${baseline}px) scale(${textScale}) translate(-960px, -620px)`
      wordRef.current.style.transform = transform
      wordRef.current.style.setProperty('--word-rest-transform', `translate(960px, ${endBaseline}px) scale(${textScale}) translate(-960px, -620px)`)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  const [backgroundReady, setBackgroundReady] = useState(false)
  const [foregroundReady, setForegroundReady] = useState(false)
  useEffect(() => {
    let active = true
    const background = new Image()
    const foreground = new Image()
    background.onload = () => { if (active) setBackgroundReady(true) }
    foreground.onload = () => { if (active) setForegroundReady(true) }
    background.src = BACKGROUND
    foreground.src = FOREGROUND
    return () => { active = false }
  }, [])

  return (
    <section className="campus-hero" aria-label="Edmission">
      <div className="campus-hero__track" ref={trackRef}>
      <div className="campus-hero__scene" data-ready={backgroundReady && foregroundReady}>
        <svg className="campus-hero__art" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            {/* The supplied PNG has a real alpha channel; no colour-key filter is needed. */}
            <mask id={`${filterId}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080" style={{ maskType: 'alpha' }}>
              <image href={FOREGROUND} width="1920" height="1080" preserveAspectRatio="none" />
            </mask>
          </defs>
          <image href={BACKGROUND} width="1920" height="1080" preserveAspectRatio="none" onLoad={() => setBackgroundReady(true)} />
          <g className="campus-hero__word" ref={wordRef}>
            <text x="960" y="620" textAnchor="middle" textLength="1380" lengthAdjust="spacingAndGlyphs">EDMISSION</text>
          </g>
          <image href={BACKGROUND} width="1920" height="1080" preserveAspectRatio="none" mask={`url(#${filterId}-mask)`} />
        </svg>
      </div>
      </div>
    </section>
  )
}
