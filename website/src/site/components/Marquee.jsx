/** Infinite horizontal marquee of words, separated by a gold mark. */
export function Marquee({items, className = ''}) {
  const row = [...items, ...items];
  return (
    <div className={`relative flex overflow-hidden ${className}`}>
      <div className="flex shrink-0 animate-marquee items-center whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="mx-10 font-serif text-3xl text-fg/70 md:text-5xl">
              {item}
            </span>
            <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
