import {Link} from 'react-router-dom';

export const fmtDate = d =>
  d
    ? new Date(d).toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'})
    : '';

const Svg = ({d, size = 14}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export const ICON = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  tag: <><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></>,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
};

/** Small "Sponsored" / "Promoted" flag shown on paid articles. */
export function PostFlag({post, className = ''}) {
  if (post.isSponsored) {
    return (
      <span className={`rounded-full bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ink ${className}`}>
        Sponsored
      </span>
    );
  }
  if (post.isPromoted) {
    return (
      <span className={`rounded-full border border-gold/50 bg-ink/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold-light backdrop-blur-md ${className}`}>
        Promoted
      </span>
    );
  }
  return null;
}

export function BlogCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="aspect-[16/10] bg-surface2/60" />
      <div className="p-5">
        <div className="h-3 w-24 rounded-full bg-surface2" />
        <div className="mt-4 h-4 w-4/5 rounded-full bg-surface2" />
        <div className="mt-2.5 h-4 w-3/5 rounded-full bg-surface2/70" />
        <div className="mt-5 h-3 w-32 rounded-full bg-surface2/70" />
      </div>
      <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-fg/[0.07] to-transparent" />
    </div>
  );
}

/**
 * Article card for the index grid.
 * `variant="wide"` is the lead story; "row" is the compact sidebar item.
 */
export function BlogCard({post, variant = 'grid'}) {
  const to = `/blog/${post.slug}`;
  const meta = (
    <>
      <span className="inline-flex items-center gap-1.5">
        <Svg d={ICON.clock} />
        {post.readingMinutes} min read
      </span>
      {post.city && (
        <span className="inline-flex items-center gap-1.5">
          <Svg d={ICON.pin} />
          {post.city}
        </span>
      )}
    </>
  );

  if (variant === 'row') {
    return (
      <Link to={to} className="group flex gap-3.5">
        <div className="relative h-[68px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-surface2">
          {post.coverImageUrl && (
            <img src={post.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium text-fg transition-colors group-hover:text-gold">{post.title}</p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-muted">
            {fmtDate(post.publishedAt)} · {post.readingMinutes} min
          </p>
        </div>
      </Link>
    );
  }

  const wide = variant === 'wide';

  return (
    <Link
      to={to}
      className={`group flex overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-colors hover:border-gold/50 ${
        wide ? 'flex-col md:flex-row' : 'flex-col'
      }`}>
      <div className={`relative overflow-hidden ${wide ? 'aspect-[16/10] md:aspect-auto md:w-1/2' : 'aspect-[16/10]'}`}>
        {post.coverImageUrl ? (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-surface2" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {post.category && (
            <span className="rounded-full border border-white/15 bg-ink/55 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-gold-light backdrop-blur-md">
              {post.category.name}
            </span>
          )}
          <PostFlag post={post} />
        </div>
      </div>

      <div className={`flex flex-1 flex-col p-5 ${wide ? 'md:justify-center md:p-8' : ''}`}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{fmtDate(post.publishedAt)}</p>
        <h3 className={`mt-2 font-serif text-fg transition-colors group-hover:text-gold ${wide ? 'text-3xl md:text-4xl' : 'line-clamp-2 text-xl'}`}>
          {post.title}
        </h3>
        {post.excerpt && (
          <p className={`mt-3 text-sm leading-relaxed text-muted ${wide ? 'line-clamp-4' : 'line-clamp-2'}`}>
            {post.excerpt}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[12px] text-muted">
          {meta}
          <span className="ml-auto inline-flex items-center gap-1.5 text-gold opacity-0 transition-opacity group-hover:opacity-100">
            Read
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
