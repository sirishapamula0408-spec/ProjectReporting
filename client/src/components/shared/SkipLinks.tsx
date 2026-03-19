import './SkipLinks.css';

/**
 * Accessibility skip links (UX-DR15).
 * Rendered at top of page, visible only on focus.
 */
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#sidebar-nav" className="skip-link">
        Skip to navigation
      </a>
    </div>
  );
}
