// Static SVG fallback for the login artwork, kept apart from particles.ts so
// three.js is only downloaded when the animated version is mounted.
/** Deterministic LCG so the field looks the same on every visit. */
export function random(seed: number) {
  let state = seed;
  return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
}

export interface StaticParticle { cx: number; cy: number; r: number; tone: 'base' | 'cyan' | 'purple'; opacity: number }

/** Static SVG fallback (viewBox 0 0 460 800) used when WebGL is unavailable. */
export function staticParticles(): StaticParticle[] {
  const next = random(871);
  return Array.from({ length: 2100 }, (_, index) => {
    const y = next() * 800;
    const width = 24 + 145 * (Math.abs(y - 400) / 400) ** 1.6;
    const angle = next() * Math.PI * 2;
    const x = 230 + Math.cos(angle) * width * Math.sqrt(next()) + 14 * Math.sin(y / 85);
    const size = 0.55 + next() * 1.1;
    return { cx: x, cy: y, r: size / 2, tone: index % 9 === 0 ? 'cyan' : index % 3 === 0 ? 'purple' : 'base', opacity: 0.18 + next() * 0.38 };
  });
}
