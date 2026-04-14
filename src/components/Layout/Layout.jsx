import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LuLayoutDashboard, LuPackage, LuReceipt, LuTicket,
  LuWallet, LuSettings, LuUsers, LuLogOut, LuMenu, LuX,
  LuSun, LuMoon, LuChevronLeft
} from 'react-icons/lu';
import './Layout.css';

const adminLinks = [
  { to: '/dashboard', icon: <LuLayoutDashboard />, label: 'Dashboard' },
  { to: '/billing', icon: <LuReceipt />, label: 'POS Billing' },
  { to: '/inventory', icon: <LuPackage />, label: 'Inventory' },
  { to: '/tokens', icon: <LuTicket />, label: 'Tokens' },
  { to: '/expenses', icon: <LuWallet />, label: 'Expenses' },
  { to: '/customers', icon: <LuUsers />, label: 'Customers' },
  { to: '/settings', icon: <LuSettings />, label: 'Settings' },
];

const billingLinks = [
  { to: '/billing', icon: <LuReceipt />, label: 'POS Billing' },
  { to: '/inventory', icon: <LuPackage />, label: 'Inventory' },
  { to: '/tokens', icon: <LuTicket />, label: 'Tokens' },
  { to: '/expenses', icon: <LuWallet />, label: 'Expenses' },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const links = isAdmin() ? adminLinks : billingLinks;


  return (
    <div className={`layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <img src="/silambu_logo.png" alt="Silambu" className="brand-logo" />
            {!collapsed && <span className="brand-text">Sri Silambu Karupatti Coffee</span>}
          </div>
          <button className="collapse-btn desktop-only" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand' : 'Collapse'}>
            <LuChevronLeft className={collapsed ? 'rotated' : ''} />
          </button>
          <button className="close-btn mobile-only" onClick={() => setSidebarOpen(false)}>
            <LuX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={link.label}
            >
              <span className="nav-icon">{link.icon}</span>
              {!collapsed && <span className="nav-label">{link.label}</span>}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <div className="main-wrapper">
        <header className="topbar">
          <button className="menu-btn mobile-only" onClick={() => setSidebarOpen(true)}>
            <LuMenu />
          </button>
          <div className="topbar-spacer" />
          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <LuMoon /> : <LuSun />}
            </button>
          </div>
        </header>
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
