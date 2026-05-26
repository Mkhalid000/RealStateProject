import {useTheme} from '../../context/ThemeContext';

export function ThemeToggle({className = ''}) {
  const {theme, toggle} = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`grid h-9 w-9 place-items-center rounded-full border border-line/60 text-sm transition-colors hover:border-gold hover:text-gold ${className}`}>
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
