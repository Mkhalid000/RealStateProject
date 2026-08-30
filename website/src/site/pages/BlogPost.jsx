import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {apiFetch} from '../../lib/api';
import {useAuth} from '../../context/AuthContext';
import {parseMarkdown, renderInline, slugifyHeading, tableOfContents} from '../../lib/markdown';
import {Reveal} from '../components/Reveal';
import {AdSlot} from '../components/AdSlot';
import {PropertyCard} from '../components/PropertyCard';
import {BlogCard, fmtDate} from '../components/BlogCard';

/** A visit counts as a "read" once the article has been open this long. */
const READ_AFTER_MS = 30000;

const Svg = ({d, size = 16}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  heart: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 5a5 5 0 0 1 9.5 7c-2.5 4.5-9.5 9-9.5 9z" />,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  back: <path d="M19 12H5m0 0 7 7m-7-7 7-7" />,
  pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
};

/** One markdown block → JSX. */
function Block({block}) {
  switch (block.type) {
    case 'h':
      if (block.level <= 2) {
        return (
          <h2 id={slugifyHeading(block.text)} className="mt-12 scroll-mt-28 font-serif text-3xl text-fg md:text-4xl">
            {block.text}
          </h2>
        );
      }
      return (
        <h3 id={slugifyHeading(block.text)} className="mt-9 scroll-mt-28 font-serif text-2xl text-fg">
          {block.text}
        </h3>
      );
    case 'quote':
      return (
        <blockquote className="my-8 border-l-2 border-gold/60 pl-6 font-serif text-2xl leading-relaxed text-fg/90">
          <span dangerouslySetInnerHTML={{__html: renderInline(block.text)}} />
        </blockquote>
      );
    case 'ul':
      return (
        <ul className="mt-5 ml-5 list-disc space-y-2 text-fg/80">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{__html: renderInline(it)}} />
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mt-5 ml-5 list-decimal space-y-2 text-fg/80">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{__html: renderInline(it)}} />
          ))}
        </ol>
      );
    case 'img':
      return (
        <figure className="my-10 overflow-hidden rounded-2xl">
          <img src={block.src} alt={block.alt} loading="lazy" className="w-full object-cover" />
          {block.alt && <figcaption className="mt-2 text-center text-xs text-muted">{block.alt}</figcaption>}
        </figure>
      );
    case 'hr':
      return <hr className="my-10 border-line" />;
    default:
      return (
        <p
          className="mt-5 leading-[1.85] text-fg/80"
          dangerouslySetInnerHTML={{__html: renderInline(block.text)}}
        />
      );
  }
}

function Comment({comment, onReply, canReply}) {
  const name = comment.user?.fullName || 'Reader';
  return (
    <div className="border-b border-line/70 py-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-ink">
          {name.charAt(0).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-medium text-fg">{name}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{fmtDate(comment.createdAt)}</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg/80">{comment.text}</p>

      {canReply && (
        <button
          onClick={() => onReply(comment)}
          className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-gold">
          Reply
        </button>
      )}

      {comment.replies?.length > 0 && (
        <div className="mt-4 space-y-4 border-l-2 border-line pl-5">
          {comment.replies.map(r => (
            <div key={r.id}>
              <p className="text-sm font-medium text-fg">{r.user?.fullName || 'Reader'}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-fg/75">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BlogPost() {
  const {slug} = useParams();
  const navigate = useNavigate();
  const {user} = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState('');

  const articleRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch(`/blog/${slug}`)
      .then(p => {
        setPost(p);
        setLiked(Boolean(p.likedByMe));
        setLikeCount(p.likeCount || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    apiFetch(`/blog/${slug}/related?limit=3`)
      .then(r => setRelated(r.items || []))
      .catch(() => setRelated([]));
    apiFetch(`/blog/${slug}/comments`)
      .then(r => setComments(r.items || []))
      .catch(() => setComments([]));
  }, [slug]);

  // view now, "read" if they're still here half a minute later
  useEffect(() => {
    if (!post) return;
    apiFetch(`/blog/${post.slug}/view`, {method: 'POST'}).catch(() => {});
    const t = setTimeout(() => {
      apiFetch(`/blog/${post.slug}/view?read=true`, {method: 'POST'}).catch(() => {});
    }, READ_AFTER_MS);
    return () => clearTimeout(t);
  }, [post?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocks = useMemo(() => parseMarkdown(post?.content || ''), [post?.content]);
  const toc = useMemo(() => tableOfContents(blocks), [blocks]);

  /* Inline ads sit between paragraphs — never inside a list or right after a
     heading, which would read as part of the article. */
  const adAfter = useMemo(() => {
    if (!post?.adsEnabled || !post?.maxInlineAds) return new Set();
    const spots = new Set();
    let paragraphs = 0;
    for (let i = 0; i < blocks.length && spots.size < post.maxInlineAds; i++) {
      if (blocks[i].type !== 'p') continue;
      paragraphs++;
      const due = paragraphs >= post.inlineAdAfterParagraph;
      const gap = paragraphs % Math.max(3, post.inlineAdAfterParagraph) === 0;
      if (due && (spots.size === 0 || gap) && blocks[i + 1]) spots.add(i);
    }
    return spots;
  }, [blocks, post?.adsEnabled, post?.maxInlineAds, post?.inlineAdAfterParagraph]);

  const toggleLike = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    await apiFetch(`/blog/${post.id}/like`, {method: next ? 'POST' : 'DELETE'}).catch(() => {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    });
  }, [liked, navigate, post, user]);

  async function share() {
    const url = window.location.href;
    apiFetch(`/blog/${post.id}/share`, {method: 'POST'}).catch(() => {});
    if (navigator.share) {
      navigator.share({title: post.title, url}).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!text.trim()) return;
    setPosting(true);
    setNotice('');
    try {
      const saved = await apiFetch(`/blog/${post.slug}/comments`, {
        method: 'POST',
        body: JSON.stringify({text: text.trim(), parentId: replyTo?.id}),
      });
      setText('');
      setReplyTo(null);
      if (saved.pending) {
        setNotice('Thanks — your comment is with our editors and appears once approved.');
      } else {
        const r = await apiFetch(`/blog/${post.slug}/comments`);
        setComments(r.items || []);
      }
    } catch (err) {
      setNotice(err.message);
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <div className="flex flex-col items-center gap-5">
          <span className="relative grid h-11 w-11 place-items-center">
            <span className="absolute inset-0 rounded-full border-2 border-line" />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-gold" />
          </span>
          <div className="animate-pulse text-[11px] uppercase tracking-[0.3em] text-muted">Loading article…</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-serif text-4xl">Article not found</h1>
        <p className="mt-3 text-muted">{error || 'This story may have been moved or unpublished.'}</p>
        <Link
          to="/blog"
          className="mt-8 inline-flex rounded-full border border-gold/60 bg-gold/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
          Back to the journal
        </Link>
      </div>
    );
  }

  const author = post.guestAuthorName || post.author?.fullName || 'Aurevia Editorial';

  return (
    <div className="relative">
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-28">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold">
          <Svg d={I.back} size={15} />
          Back to the journal
        </Link>

        {/* ── header ── */}
        <Reveal>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {post.category && (
              <Link
                to={`/blog?category=${post.category.slug}`}
                className="rounded-full border border-gold/50 bg-gold/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
                {post.category.name}
              </Link>
            )}
            {post.isSponsored && (
              <span className="rounded-full bg-gold px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
                Sponsored
              </span>
            )}
            {post.city && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-muted">
                <Svg d={I.pin} size={13} />
                {post.city}
              </span>
            )}
          </div>

          <h1 className="mt-6 max-w-4xl font-serif text-4xl leading-[1.1] md:text-6xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{post.excerpt}</p>}

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-line py-4 text-sm text-muted">
            <span className="inline-flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-sm font-bold text-ink">
                {author.charAt(0).toUpperCase()}
              </span>
              <span className="text-fg">{author}</span>
            </span>
            <span>{fmtDate(post.publishedAt)}</span>
            <span className="inline-flex items-center gap-1.5"><Svg d={I.clock} size={14} />{post.readingMinutes} min read</span>
            <span className="inline-flex items-center gap-1.5"><Svg d={I.eye} size={14} />{post.viewCount.toLocaleString()}</span>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={toggleLike}
                aria-label={liked ? 'Unlike' : 'Like'}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                  liked ? 'border-gold bg-gold/15 text-gold' : 'border-line text-muted hover:border-gold/50 hover:text-gold'
                }`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7">{I.heart}</svg>
                {likeCount}
              </button>
              <button
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold">
                <Svg d={I.share} size={13} />
                {copied ? 'Link copied' : 'Share'}
              </button>
            </div>
          </div>
        </Reveal>

        {/* ── cover ── */}
        {post.coverImageUrl && (
          <Reveal y={30}>
            <div className="mt-8 overflow-hidden rounded-2xl">
              <img src={post.coverImageUrl} alt={post.title} className="h-[clamp(240px,46vh,560px)] w-full object-cover" />
            </div>
          </Reveal>
        )}

        {/* ── sponsor disclosure ── */}
        {post.isSponsored && (
          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gold/40 bg-gold/[0.07] px-5 py-4">
            {post.sponsorLogoUrl && (
              <img src={post.sponsorLogoUrl} alt={post.sponsorName || ''} className="h-10 w-10 rounded-lg object-cover" />
            )}
            <p className="flex-1 text-sm text-muted">
              {post.sponsorDisclosure ||
                `Produced in partnership with ${post.sponsorName || 'our sponsor'}.`}
            </p>
            {post.sponsorUrl && (
              <a
                href={post.sponsorUrl}
                target="_blank"
                rel="noreferrer noopener sponsored"
                className="rounded-full border border-gold/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink">
                Visit {post.sponsorName || 'sponsor'}
              </a>
            )}
          </div>
        )}

        <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_320px]">
          {/* ── article body ── */}
          <article ref={articleRef} className="max-w-3xl">
            {blocks.map((block, i) => (
              <div key={i}>
                <Block block={block} />
                {adAfter.has(i) && (
                  <AdSlot
                    slot="blog_post_inline"
                    variant="strip"
                    className="my-9"
                    city={post.city || undefined}
                    blogCategory={post.category?.slug}
                    tags={post.tags?.join(',')}
                  />
                )}
              </div>
            ))}

            {/* end-of-article CTA */}
            {post.ctaLabel && post.ctaUrl && (
              <div className="mt-12 rounded-2xl border border-gold/40 bg-gold/[0.07] p-8 text-center">
                <p className="font-serif text-2xl text-fg">Ready for the next step?</p>
                {post.ctaUrl.startsWith('/') ? (
                  <Link
                    to={post.ctaUrl}
                    className="mt-5 inline-flex rounded-full bg-gold px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-dark">
                    {post.ctaLabel}
                  </Link>
                ) : (
                  <a
                    href={post.ctaUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-5 inline-flex rounded-full bg-gold px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-dark">
                    {post.ctaLabel}
                  </a>
                )}
              </div>
            )}

            {/* tags */}
            {post.tags?.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.map(t => (
                  <Link
                    key={t}
                    to={`/blog?tag=${encodeURIComponent(t)}`}
                    className="rounded-full border border-line px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/50 hover:text-gold">
                    #{t}
                  </Link>
                ))}
              </div>
            )}

            {/* properties in this story */}
            {post.relatedProperties?.length > 0 && (
              <div className="mt-14">
                <h3 className="font-serif text-3xl text-fg">Properties in this story</h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {post.relatedProperties.map(p => <PropertyCard key={p.id} property={p} />)}
                </div>
              </div>
            )}

            <AdSlot
              slot="blog_post_bottom"
              variant="strip"
              className="mt-14"
              city={post.city || undefined}
              blogCategory={post.category?.slug}
              tags={post.tags?.join(',')}
            />

            {/* comments */}
            <div className="mt-16">
              <h3 className="font-serif text-3xl text-fg">
                Comments {post.commentCount > 0 && <span className="text-muted">({post.commentCount})</span>}
              </h3>

              {post.allowComments ? (
                <>
                  <form onSubmit={submitComment} className="mt-6 rounded-2xl border border-line bg-surface p-5">
                    {replyTo && (
                      <p className="mb-3 flex items-center gap-2 text-xs text-muted">
                        Replying to {replyTo.user?.fullName || 'a reader'}
                        <button type="button" onClick={() => setReplyTo(null)} className="text-gold">cancel</button>
                      </p>
                    )}
                    <textarea
                      value={text}
                      onChange={e => setText(e.target.value)}
                      rows={4}
                      placeholder={user ? 'Share your thoughts…' : 'Sign in to join the conversation'}
                      className="w-full resize-none rounded-xl border border-line bg-transparent px-4 py-3 text-sm text-fg outline-none transition-colors focus:border-gold/60 placeholder:text-muted"
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted">Comments appear once an editor approves them.</p>
                      <button
                        disabled={posting || !text.trim()}
                        className="rounded-full bg-gold px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-gold-dark disabled:opacity-50">
                        {posting ? 'Posting…' : 'Post comment'}
                      </button>
                    </div>
                    {notice && <p className="mt-3 text-sm text-gold">{notice}</p>}
                  </form>

                  <div className="mt-6">
                    {comments.length === 0 ? (
                      <p className="py-6 text-sm text-muted">No comments yet — be the first.</p>
                    ) : (
                      comments.map(c => (
                        <Comment key={c.id} comment={c} canReply={Boolean(user)} onReply={setReplyTo} />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm text-muted">Comments are closed on this article.</p>
              )}
            </div>
          </article>

          {/* ── sidebar ── */}
          <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
            {toc.length > 1 && (
              <div>
                <h4 className="mb-4 text-xs uppercase tracking-luxe text-muted">In this article</h4>
                <nav className="space-y-2 border-l border-line pl-4">
                  {toc.map(t => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className="block text-sm text-fg/75 transition-colors hover:text-gold">
                      {t.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            <AdSlot
              slot="blog_post_sidebar"
              variant="rail"
              city={post.city || undefined}
              blogCategory={post.category?.slug}
              tags={post.tags?.join(',')}
            />

            {related.length > 0 && (
              <div>
                <h4 className="mb-5 text-xs uppercase tracking-luxe text-muted">Keep reading</h4>
                <div className="space-y-4">
                  {related.map(p => <BlogCard key={p.id} post={p} variant="row" />)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
