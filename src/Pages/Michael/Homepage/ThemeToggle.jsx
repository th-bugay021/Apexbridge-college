import './ThemeToggle.css';

export default function ThemeToggle({ theme, onChange }) {
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle-wrap">
      <button
        className="theme-toggle"
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark mode"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={() => onChange(isDark ? 'light' : 'dark')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect className="theme-toggle-track" x="2.4" y="6.4" width="19.2" height="11.2" rx="5.6" />
          <circle className="theme-toggle-knob" cx="8" cy="12" r="3.2" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <span className="theme-toggle-mobile-label" aria-hidden="true">Dark mode</span>
    </div>
  );
}
