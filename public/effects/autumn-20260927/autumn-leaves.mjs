// Ported from Logic Coin's archived autumn-2026 effect. No framework dependency.
export const leaves = [
  { size: 37, duration: 23, delay: -3, start: -12, end: 54, rotation: 280 },
  { size: 26, duration: 28, delay: -17, start: 8, end: 83, rotation: -250 },
  { size: 42, duration: 31, delay: -25, start: -5, end: 105, rotation: 330 },
  { size: 24, duration: 26, delay: -9, start: 22, end: 92, rotation: -180 },
  { size: 33, duration: 34, delay: -19, start: -18, end: 67, rotation: 390 },
  { size: 30, duration: 29, delay: -2, start: 16, end: 110, rotation: -310 },
  { size: 22, duration: 25, delay: -14, start: -8, end: 71, rotation: 240 },
  { size: 35, duration: 32, delay: -28, start: 28, end: 118, rotation: -360 },
];

export function shouldShowLeaves(pathname, hasLanding, reducedMotion) {
  return pathname === '/' && hasLanding && !reducedMotion;
}

export const css = `
.edmission-autumn-layer {
  position:fixed; inset:0; overflow:hidden; z-index:40;
  contain:layout style paint;
}
.edmission-autumn-layer, .edmission-autumn-layer * {
  pointer-events:none !important; user-select:none;
}
@keyframes edmission-autumn-fall {
  0% { transform:translate3d(var(--leaf-from), -65px, 0); opacity:0; }
  8% { opacity:.68; }
  88% { opacity:.55; }
  100% { transform:translate3d(var(--leaf-to), calc(100vh + 70px), 0); opacity:0; }
}
@keyframes edmission-autumn-tumble {
  0% { transform:translateX(-9px) rotate(-25deg); }
  50% { transform:translateX(13px) rotate(calc(var(--leaf-turn) * .5)) rotateY(25deg); }
  100% { transform:translateX(-6px) rotate(var(--leaf-turn)); }
}
.edmission-autumn-leaf {
  position:absolute; top:0; left:0; will-change:transform;
  animation:edmission-autumn-fall var(--leaf-time) linear var(--leaf-delay) infinite;
}
.edmission-autumn-leaf__turn {
  display:block; width:100%; height:100%; will-change:transform;
  animation:edmission-autumn-tumble 9s ease-in-out var(--leaf-delay) infinite alternate;
}
.edmission-autumn-leaf img { display:block; width:100%; height:100%; object-fit:contain; }
.edmission-autumn-layer[data-paused="true"] .edmission-autumn-leaf,
.edmission-autumn-layer[data-paused="true"] .edmission-autumn-leaf__turn { animation-play-state:paused; }
@media (prefers-reduced-motion:reduce) { .edmission-autumn-layer { display:none; } }
`;

export function startAutumnLeaves({ window: win, document: doc, selector = '.campus-hero, [data-autumn-landing]' }) {
  const motion = win.matchMedia('(prefers-reduced-motion: reduce)');
  const layerId = 'edmission-autumn-leaves-20260927';
  let layer = null;
  let frame = 0;
  let disposed = false;
  const removeLayer = () => { layer?.remove(); layer = null; };
  const reconcile = () => {
    if (disposed) return;
    if (!shouldShowLeaves(win.location.pathname, !!doc.querySelector(selector), motion.matches)) {
      removeLayer();
      return;
    }
    if (!layer && doc.visibilityState === 'visible') {
      // A fixed, body-level layer is independent of the hero's sticky/transformed
      // artwork. It covers the viewport while scrolling through the whole landing.
      layer = doc.createElement('div');
      layer.id = layerId;
      layer.className = 'edmission-autumn-layer';
      layer.setAttribute('aria-hidden', 'true');
      const style = doc.createElement('style');
      style.textContent = css;
      layer.appendChild(style);
      leaves.forEach((leaf, index) => {
        const fall = doc.createElement('div');
        fall.className = 'edmission-autumn-leaf';
        fall.style.width = `${leaf.size}px`;
        fall.style.height = `${leaf.size}px`;
        for (const [property, value] of Object.entries({
          '--leaf-from': `${leaf.start}vw`, '--leaf-to': `${leaf.end}vw`,
          '--leaf-turn': `${leaf.rotation}deg`, '--leaf-time': `${leaf.duration}s`,
          '--leaf-delay': `${leaf.delay}s`,
        })) fall.style.setProperty(property, value);
        const turn = doc.createElement('span');
        turn.className = 'edmission-autumn-leaf__turn';
        const image = doc.createElement('img');
        image.src = new URL(`./list-${index + 1}.svg`, import.meta.url).href;
        image.alt = '';
        image.width = leaf.size;
        image.height = leaf.size;
        image.decoding = 'async';
        image.fetchPriority = 'low';
        image.draggable = false;
        turn.appendChild(image);
        fall.appendChild(turn);
        layer.appendChild(fall);
      });
      doc.body.appendChild(layer);
    }
    if (layer) layer.dataset.paused = String(doc.visibilityState !== 'visible');
  };
  // One coalesced reconciliation after DOM/route changes, not a per-frame loop.
  const schedule = () => {
    if (!disposed && !frame) frame = win.requestAnimationFrame(() => { frame = 0; reconcile(); });
  };
  const visibility = () => { reconcile(); };
  const observer = new win.MutationObserver(schedule);
  observer.observe(doc.getElementById('root') || doc.body, { childList: true, subtree: true });
  motion.addEventListener('change', reconcile);
  doc.addEventListener('visibilitychange', visibility);
  win.addEventListener('popstate', schedule);
  win.addEventListener('pageshow', schedule);
  reconcile();
  return () => {
    disposed = true;
    observer.disconnect();
    win.cancelAnimationFrame(frame);
    motion.removeEventListener('change', reconcile);
    doc.removeEventListener('visibilitychange', visibility);
    win.removeEventListener('popstate', schedule);
    win.removeEventListener('pageshow', schedule);
    removeLayer();
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const key = Symbol.for('edmission.autumn-leaves');
  if (!window[key]) window[key] = startAutumnLeaves({ window, document });
}
