/**
 * The Aurevia "A" monogram, drawn as an inline SVG so it costs no request and
 * inherits crisp edges at any size. Used as the placeholder mark while images
 * load — see SmartImage.
 */
export function BrandMark({className = '', size, title}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id="aurevia-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e3b0" />
          <stop offset="45%" stopColor="#d8a54c" />
          <stop offset="100%" stopColor="#a2742a" />
        </linearGradient>
      </defs>
      <path
        fill="url(#aurevia-mark)"
        fillRule="evenodd"
        d="M24 6.5 39.4 41.5h-5.9l-3.6-8.4H18.1l-3.6 8.4H8.6L24 6.5Zm0 11.6-4.1 11.1h8.2L24 18.1Z"
      />
    </svg>
  );
}
