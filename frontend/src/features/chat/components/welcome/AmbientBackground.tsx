// Fine paper grain: SVG fractal noise, tiled
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Slow drifting brand-colour glows, paper grain and a soft vignette. Purely decorative. */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-1/4 right-[-10%] size-[42rem] rounded-full bg-accent opacity-30 blur-[120px] [animation:drift-a_18s_ease-in-out_infinite] motion-reduce:animate-none dark:opacity-[0.10]" />
      <div className="absolute bottom-[-30%] left-[-15%] size-[38rem] rounded-full bg-primary opacity-[0.08] blur-[120px] [animation:drift-b_22s_ease-in-out_infinite] motion-reduce:animate-none dark:bg-brand-offwhite dark:opacity-[0.05]" />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-multiply dark:opacity-[0.09] dark:mix-blend-screen" style={{ backgroundImage: GRAIN }} />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,color-mix(in_oklab,var(--bg)_70%,transparent))]" />
    </div>
  )
}
