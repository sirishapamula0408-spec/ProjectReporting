import { Button } from '@progress/kendo-react-buttons';
import { useAuth } from '../../context/AuthContext';
import './TopBar.css';

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11l3 3" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M10 2a6 6 0 016 6v3l2 2H2l2-2V8a6 6 0 016-6z" />
    <path d="M8 17a2 2 0 004 0" />
  </svg>
);

const GearIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="3" />
    <path d="M10 1.5l1.2 2.4 2.6.3-1.9 1.8.5 2.6L10 7.3 7.6 8.6l.5-2.6L6.2 4.2l2.6-.3L10 1.5z" />
    <path d="M16.5 7l-2.1 1.2.2 2.6-2.4-1.1L10 11.5l-2.2-1.8-2.4 1.1.2-2.6L3.5 7l2.1-1.2-.2-2.6" />
  </svg>
);

interface TopBarTab {
  label: string;
  active?: boolean;
}

const TABS: TopBarTab[] = [
  { label: 'Overview', active: true },
  { label: 'Portfolio' },
  { label: 'Resources' },
];

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar__left">
        <div className="topbar__logo">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
            <rect x="8" y="14" width="4" height="10" rx="1" fill="white" />
            <rect x="14" y="10" width="4" height="14" rx="1" fill="white" />
            <rect x="20" y="6" width="4" height="18" rx="1" fill="white" />
          </svg>
          <span className="topbar__logo-text">ProjectReporting</span>
        </div>
        <nav className="topbar__tabs">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              className={`topbar__tab ${tab.active ? 'topbar__tab--active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="topbar__right">
        <div className="topbar__search">
          <SearchIcon />
          <input
            type="text"
            className="topbar__search-input"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
        <Button fillMode="flat" className="topbar__icon-btn" aria-label="Notifications" title="Notifications">
          <BellIcon />
        </Button>
        <Button fillMode="flat" className="topbar__icon-btn" aria-label="Settings" title="Settings">
          <GearIcon />
        </Button>
        {user && (
          <div className="topbar__avatar" title={user.displayName}>
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
