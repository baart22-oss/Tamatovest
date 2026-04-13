import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/packages', icon: '📦', label: 'Invest Now' },
  { path: '/investments', icon: '📈', label: 'My Investments' },
  { path: '/referrals', icon: '🤝', label: 'Referrals' },
  { path: '/transactions', icon: '💳', label: 'Transactions' },
  { path: '/withdraw', icon: '💸', label: 'Withdraw' },
];

const ADMIN_NAV = [
  { path: '/admin', icon: '📊', label: 'Overview' },
  { path: '/admin/investments', icon: '✅', label: 'Manage POPs' },
  { path: '/admin/withdrawals', icon: '💰', label: 'Withdrawals' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path) => {
    navigate(path);
    onClose && onClose();
  };

  const navItems = user?.role === 'admin' ? ADMIN_NAV : NAV_ITEMS;

  return (
    <>
      <div className={`overlay ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍅</div>
          <div>
            <div className="sidebar-logo-text">Tamatovest</div>
            <div className="sidebar-logo-sub">Smart Tomato Investing</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {user?.role === 'admin' ? 'Admin Panel' : 'Main Menu'}
          </div>
          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-block btn-sm" onClick={logout} style={{ color: 'rgba(255,255,255,0.6)' }}>
            🚪 Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <div className="topbar">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            ☰ <span className="text-sm">Menu</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-xs text-gray">Balance: R{parseFloat(user?.balance || 0).toFixed(2)}</div>
            </div>
            <div className="avatar" style={{ background: 'var(--tomato-red)' }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </div>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
