import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

const KEY = 'rr_cookie_notice';
/** Let the intro loader finish its wipe before the bar slides up. */
const DELAY = 3200;

/**
 * First-visit cookie notice, pinned to the bottom of the page.
 *
 * Implied consent (the copy says "by browsing"), so there is a single
 * acknowledgement — the choice is remembered in localStorage and the bar never
 * returns for that browser.
 */
export function CookieNotice() {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false); // drives the slide-up

  useEffect(() => {
    let accepted = false;
    try {
      accepted = localStorage.getItem(KEY) === '1';
    } catch {
      /* private mode — show it, just don't remember */
    }
    if (accepted) return;

    const t = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setShown(true));
    }, DELAY);
    return () => clearTimeout(t);
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
    setShown(false);
    setTimeout(() => setMounted(false), 450);
  }

  if (!mounted) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={`fixed inset-x-0 bottom-0 z-[95] border-t border-line bg-surface/95 backdrop-blur-md transition-transform duration-500 ease-out ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}>
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-4 sm:flex-row">
        <span className="hidden shrink-0 text-gold sm:block">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-4-4 3 3 0 0 1-5-5z" />
            <path d="M9 10h.01M14.5 13.5h.01M9.5 15.5h.01" />
          </svg>
        </span>

        <p className="text-center text-sm leading-relaxed text-muted sm:text-left">
          This site uses cookies to improve your experience. By browsing, you agree to our{' '}
          <Link to="/privacy" className="text-gold underline-offset-4 hover:underline">
            Privacy Policy
          </Link>{' '}
          &amp;{' '}
          <Link to="/privacy#cookies" className="text-gold underline-offset-4 hover:underline">
            Cookie Policy
          </Link>
          .
        </p>

        <button
          onClick={accept}
          className="sheen shrink-0 rounded-full bg-gold px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-gold-dark sm:ml-auto">
          Got it
        </button>
      </div>
    </div>
  );
}
