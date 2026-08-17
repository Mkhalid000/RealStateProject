import {useCallback, useEffect, useState} from 'react';
import {imgSrcSet, imgUrl, lqip} from '../lib/img';
import {BrandMark} from './BrandMark';

/**
 * An <img> that (a) only downloads the resolution it paints, (b) is lazy by
 * default, and (c) shows the Aurevia mark while it loads instead of a blank box.
 *
 * `w` is the width the image occupies in the layout (CSS px). A 1.5x/2x srcSet
 * is derived from it, so pass the *layout* width, not the source width.
 *
 * The wrapper is `relative` and the image fills it, so give the wrapper the
 * size/aspect via `className` (e.g. "aspect-[4/3]" or "h-20 w-28").
 */
export function SmartImage({
  src,
  alt = '',
  w,
  h,
  q,
  sizes,
  fallback,
  eager = false,
  priority = false,
  blurUp = false,
  className = '',
  imgClassName = '',
  markClassName = 'w-[24%] min-w-[14px] max-w-[46px]',
  style,
  imgStyle,
  onLoad,
  onError,
  ...rest
}) {
  const [state, setState] = useState('loading'); // loading | ready | error

  const failed = state === 'error';
  const shown = failed && fallback ? fallback : src;
  const url = imgUrl(shown, {w, h, q});
  const srcSet = imgSrcSet(shown, w, {h, q});
  const preview = blurUp && !failed ? lqip(src) : undefined;

  useEffect(() => setState('loading'), [src]);

  // A cached image can finish decoding before React attaches onLoad, which
  // would leave the placeholder up forever — catch that via the ref.
  const imgRef = useCallback(
    node => {
      if (node?.complete && node.naturalWidth > 0) setState('ready');
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [url],
  );

  const ready = state === 'ready';

  return (
    <span className={`relative block overflow-hidden ${className}`} style={style}>
      {!ready && (
        <span
          className="pointer-events-none absolute inset-0 grid place-items-center bg-surface2/70"
          style={
            preview
              ? {backgroundImage: `url("${preview}")`, backgroundSize: 'cover', backgroundPosition: 'center'}
              : undefined
          }>
          <BrandMark className={`${markClassName} ${failed ? 'opacity-30' : 'animate-pulse'}`} />
          {!failed && (
            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
        </span>
      )}

      <img
        ref={imgRef}
        src={url}
        srcSet={srcSet}
        sizes={srcSet ? sizes || (w ? `${w}px` : undefined) : undefined}
        alt={alt}
        loading={eager || priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchpriority={priority ? 'high' : undefined}
        onLoad={e => {
          setState('ready');
          onLoad?.(e);
        }}
        onError={e => {
          // Only fall back once — a broken fallback must not loop.
          setState(s => (s === 'error' ? s : 'error'));
          onError?.(e);
        }}
        className={`h-full w-full object-cover transition-opacity duration-500 ${ready ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        style={imgStyle}
        {...rest}
      />
    </span>
  );
}
