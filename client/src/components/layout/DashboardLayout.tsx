import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import './DashboardLayout.css';

/**
 * Main layout for authenticated dashboard pages.
 * Top navigation bar + Sidebar + content area + footer.
 */
export function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <TopBar />
      <div className="dashboard-layout__body">
        <Sidebar />
        <main className="dashboard-layout__content">
          <Outlet />
          <footer className="dashboard-layout__footer">
            <span className="dashboard-layout__footer-copy">
              &copy; 2024 PROJECTREPORTING ENTERPRISE. ALL RIGHTS RESERVED.
            </span>
            <a href="#privacy" className="dashboard-layout__footer-link">
              PRIVACY POLICY
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
