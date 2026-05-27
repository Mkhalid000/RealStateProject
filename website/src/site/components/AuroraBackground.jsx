/**
 * Global ambient background — slowly drifting amber & sage glows behind all
 * content (viewport-fixed, visible while scrolling). Pure CSS, reduced-motion safe.
 */
export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-[12%] top-[2%] h-[44vw] w-[44vw] rounded-full bg-gold/15 blur-[130px] motion-reduce:!animate-none"
        style={{animation: 'auroraA 22s ease-in-out infinite'}}
      />
      <div
        className="absolute -right-[10%] top-[34%] h-[40vw] w-[40vw] rounded-full bg-sage/15 blur-[130px] motion-reduce:!animate-none"
        style={{animation: 'auroraB 28s ease-in-out infinite'}}
      />
      <div
        className="absolute bottom-[-12%] left-[28%] h-[42vw] w-[42vw] rounded-full bg-gold/10 blur-[150px] motion-reduce:!animate-none"
        style={{animation: 'auroraC 32s ease-in-out infinite'}}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35))]" />
    </div>
  );
}
