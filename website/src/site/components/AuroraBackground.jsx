/** Soft floating champagne + emerald light blooms behind a section. */
export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-24 h-96 w-96 animate-float rounded-full bg-gold/10 blur-[130px]" />
      <div
        className="absolute right-0 top-1/3 h-[30rem] w-[30rem] animate-float rounded-full bg-emerald/15 blur-[150px]"
        style={{animationDelay: '2s'}}
      />
      <div
        className="absolute bottom-0 left-1/3 h-80 w-80 animate-float rounded-full bg-gold/5 blur-[120px]"
        style={{animationDelay: '4s'}}
      />
    </div>
  );
}
