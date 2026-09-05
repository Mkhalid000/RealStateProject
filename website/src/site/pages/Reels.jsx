import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import {parseVideo, embedSrc} from '../../lib/video';
import {Seo} from '../components/Seo';

const LIMIT = 6;

const money = (p, c) =>
  new Intl.NumberFormat('en-US', {style: 'currency', currency: c || 'USD', maximumFractionDigits: 0}).format(Number(p) || 0);

const fmtCount = n => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n ?? 0));

export default function Reels() {
  const {user} = useAuth();
  const navigate = useNavigate();

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState(null);
  const [needLogin, setNeedLogin] = useState(false);

  const {id: startId} = useParams();
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const viewedRef = useRef(new Set());
  const jumpedRef = useRef(false);

  const load = useCallback((p) => {
    setLoading(true);
    apiFetch(`/reels/feed?page=${p}&limit=${LIMIT}`)
      .then(r => {
        setReels(prev => {
          const seen = new Set(prev.map(x => x.id));
          return [...prev, ...(r.items || []).filter(x => !seen.has(x.id))];
        });
        setHasMore(r.hasMore);
        setPage(p);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(1); }, [load]);

  // detect the active (most visible) slide
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(en => {
          if (en.isIntersecting && en.intersectionRatio >= 0.6) {
            setActiveId(en.target.getAttribute('data-reel-id'));
          }
        });
      },
      {root, threshold: [0, 0.6, 1]},
    );
    root.querySelectorAll('[data-reel-id]').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [reels]);

  // play only the active video; pause the rest
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, v]) => {
      if (!v) return;
      if (id === activeId) {
        v.muted = muted;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    // infinite scroll: near the end → fetch next page
    const idx = reels.findIndex(r => r.id === activeId);
    if (idx >= 0 && idx >= reels.length - 2 && hasMore && !loading) {
      load(page + 1);
    }
  }, [activeId, muted, reels, hasMore, loading, page, load]);

  function mutate(id, patch) {
    setReels(prev => prev.map(r => (r.id === id ? {...r, ...patch} : r)));
  }

  // reflect the active reel in the URL (shareable deep link) + count a view once
  useEffect(() => {
    if (!activeId) return;
    window.history.replaceState(null, '', `/reels/${activeId}`);
    if (viewedRef.current.has(activeId)) return;
    viewedRef.current.add(activeId);
    apiFetch(`/reels/${activeId}/view`, {method: 'POST'}).catch(() => {});
    setReels(prev => prev.map(r => (r.id === activeId ? {...r, viewCount: (r.viewCount || 0) + 1} : r)));
  }, [activeId]);

  // deep link: if opened at /reels/:id, jump to that reel once it has loaded
  useEffect(() => {
    if (jumpedRef.current || !startId || reels.length === 0) return;
    jumpedRef.current = true;
    const i = reels.findIndex(r => r.id === startId);
    if (i > 0) requestAnimationFrame(() => goTo(i));
  }, [reels, startId]);

  async function toggleLike(reel) {
    if (!user) return setNeedLogin(true);
    const liked = !reel.likedByMe;
    mutate(reel.id, {likedByMe: liked, likeCount: reel.likeCount + (liked ? 1 : -1)});
    try {
      await apiFetch(`/reels/${reel.id}/like`, {method: liked ? 'POST' : 'DELETE'});
    } catch {
      mutate(reel.id, {likedByMe: !liked, likeCount: reel.likeCount + (liked ? -1 : 1)});
    }
  }

  function togglePlay(reel) {
    const v = videoRefs.current[reel.id];
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function goTo(i) {
    const slides = containerRef.current?.querySelectorAll('[data-reel-id]');
    if (!slides || i < 0 || i >= slides.length) return;
    slides[i].scrollIntoView({behavior: 'smooth'});
  }
  const activeIdx = reels.findIndex(r => r.id === activeId);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <Seo
        title="Property reels — walk-throughs in sixty seconds"
        description="Short video tours of the homes on Aurevia, straight from the agents who list them."
      />
      <h1 className="sr-only">Property reels — short video tours from Aurevia</h1>
      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-5 py-4">
        <Link to="/" className="pointer-events-auto font-serif text-xl tracking-wide text-white">
          AU<span className="text-gold">REVIA</span>
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <button onClick={() => setMuted(m => !m)} aria-label="Toggle sound"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
            {muted ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6"/></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>
            )}
          </button>
          <Link to="/properties" className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25" aria-label="Close reels">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </Link>
        </div>
      </div>

      {/* prev / next jump buttons */}
      {reels.length > 1 && (
        <div className="absolute right-6 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-8">
          <button
            onClick={() => goTo(activeIdx - 1)}
            disabled={activeIdx <= 0}
            aria-label="Previous reel"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button
            onClick={() => goTo(activeIdx + 1)}
            disabled={activeIdx >= reels.length - 1 && !hasMore}
            aria-label="Next reel"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 disabled:opacity-30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
      )}

      {/* feed */}
      <div ref={containerRef} className="h-full snap-y snap-mandatory overflow-y-scroll">
        {reels.map(reel => (
          <section key={reel.id} data-reel-id={reel.id} className="relative flex h-full snap-start items-center justify-center">
            {(() => {
              const v = parseVideo(reel.videoUrl);
              if (v.provider === 'file') {
                return (
                  <video
                    ref={el => (videoRefs.current[reel.id] = el)}
                    src={reel.videoUrl}
                    poster={reel.thumbnailUrl || undefined}
                    loop
                    muted={muted}
                    playsInline
                    onClick={() => togglePlay(reel)}
                    className="h-full w-full max-w-[480px] cursor-pointer object-cover"
                  />
                );
              }
              // YouTube / Vimeo — mount the embed only when this slide is active
              return activeId === reel.id ? (
                <iframe
                  title={reel.id}
                  src={embedSrc(v)}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full max-w-[480px]"
                  style={{border: 0}}
                />
              ) : (
                <img src={reel.thumbnailUrl || v.poster || ''} alt="" className="h-full w-full max-w-[480px] object-cover opacity-80" />
              );
            })()}

            {/* gradient + meta */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-w-[480px] bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pb-10">
              <div className="pointer-events-auto flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-ink">
                  {(reel.agent?.fullName || 'A').charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold text-white drop-shadow">{reel.agent?.fullName || 'Aurevia Agent'}</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  {fmtCount(reel.viewCount)}
                </span>
              </div>
              {reel.caption && <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/90 drop-shadow">{reel.caption}</p>}
              {reel.property && (
                <Link to={`/properties/${reel.property.id}/${reel.property.slug}`}
                  className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/25">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>
                  {reel.property.title} · <span className="text-gold-light">{money(reel.property.price, reel.property.currency)}</span>
                </Link>
              )}
            </div>

            {/* action rail */}
            <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-5 mx-auto" style={{right: 'max(12px, calc(50% - 240px + 12px))'}}>
              <button onClick={() => toggleLike(reel)} className="flex flex-col items-center gap-1 text-white">
                <span className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur transition ${reel.likedByMe ? 'bg-rose-500/90' : 'bg-white/15 hover:bg-white/25'}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={reel.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z"/></svg>
                </span>
                <span className="text-xs font-semibold drop-shadow">{reel.likeCount}</span>
              </button>
              <button onClick={() => setCommentsFor(reel)} className="flex flex-col items-center gap-1 text-white">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/15 backdrop-blur transition hover:bg-white/25">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </span>
                <span className="text-xs font-semibold drop-shadow">{reel.commentCount}</span>
              </button>
              {reel.isBoosted && (
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold text-ink" title="Boosted">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>
                </span>
              )}
            </div>
          </section>
        ))}

        {reels.length === 0 && (
          loading ? <ReelSkeleton /> : (
            <div className="flex h-full items-center justify-center text-white/60">No reels yet.</div>
          )
        )}
      </div>

      {/* comments sheet */}
      {commentsFor && (
        <CommentsSheet
          reel={commentsFor}
          user={user}
          onClose={() => setCommentsFor(null)}
          onNeedLogin={() => { setCommentsFor(null); setNeedLogin(true); }}
          onPosted={() => mutate(commentsFor.id, {commentCount: commentsFor.commentCount + 1})}
        />
      )}

      {/* login prompt */}
      {needLogin && (
        <div className="absolute inset-0 z-[60] grid place-items-center bg-black/60 p-6" onClick={() => setNeedLogin(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-2xl text-ink">Join the conversation</h3>
            <p className="mt-2 text-sm text-neutral-500">Sign in to like reels and leave comments.</p>
            <button onClick={() => navigate('/login')} className="mt-5 w-full rounded-xl bg-gold py-3 font-semibold text-ink transition hover:bg-gold-dark">Sign in</button>
            <button onClick={() => setNeedLogin(false)} className="mt-2 w-full rounded-xl py-2.5 text-sm text-neutral-500">Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReelSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#1a1614] to-black">
      {/* sweeping shimmer */}
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* center brand + spinner */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
        <span className="relative grid h-16 w-16 place-items-center">
          <span className="absolute inset-0 rounded-full border-2 border-white/10" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#f2a65a"><path d="M8 5v14l11-7z" /></svg>
        </span>
        <span className="font-serif text-2xl tracking-wide text-white">AU<span className="text-gold">REVIA</span></span>
        <span className="text-[11px] uppercase tracking-[0.3em] text-white/40">Loading reels…</span>
      </div>

      {/* faux caption block */}
      <div className="absolute bottom-10 left-1/2 w-full max-w-[480px] -translate-x-1/2 px-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-full bg-white/15" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/15" />
        </div>
        <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
      </div>

      {/* faux action rail */}
      <div className="absolute bottom-28 right-8 flex flex-col gap-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-12 w-12 animate-pulse rounded-full bg-white/15" />
        ))}
      </div>
    </div>
  );
}

function CommentsSheet({reel, user, onClose, onNeedLogin, onPosted}) {
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    apiFetch(`/reels/${reel.id}/comments`).then(setList).catch(() => setList([]));
  }, [reel.id]);

  async function post(e) {
    e.preventDefault();
    if (!user) return onNeedLogin();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const c = await apiFetch(`/reels/${reel.id}/comments`, {method: 'POST', body: JSON.stringify({text: text.trim()})});
      setList(prev => [c, ...(prev || [])]);
      setText('');
      onPosted();
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="absolute inset-0 z-[55] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="flex h-[70%] w-full max-w-[480px] flex-col rounded-t-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3.5">
          <span className="font-semibold text-ink">Comments {list ? `· ${list.length}` : ''}</span>
          <button onClick={onClose} className="text-neutral-400 hover:text-ink"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {!list ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : list.length ? (
            list.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500">
                  {(c.user?.fullName || 'U').charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="text-xs font-semibold text-ink">{c.user?.fullName || 'User'}</div>
                  <div className="text-sm text-neutral-700">{c.text}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-400">No comments yet — be the first.</p>
          )}
        </div>
        <form onSubmit={post} className="flex items-center gap-2 border-t border-neutral-200 p-3">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={user ? 'Add a comment…' : 'Sign in to comment…'}
            className="flex-1 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
          />
          <button type="submit" disabled={posting} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gold-dark disabled:opacity-50">Post</button>
        </form>
      </div>
    </div>
  );
}
