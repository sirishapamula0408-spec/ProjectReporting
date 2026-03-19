import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './DashboardLayout.css';

/**
 * Main layout for authenticated dashboard pages.
 * Sidebar + content area.
 */
export function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
