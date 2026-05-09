import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserStore from '../../stores/userStore';

const WORKSPACE_ITEMS = [
  { path: '/',        label: 'Dashboard', icon: '◆' },
  { path: '/habits',  label: 'My Habits', icon: '≡' },
  { path: '/streaks', label: 'Streaks',   icon: '⊙' },
];

const INSIGHTS_ITEMS = [
  { path: '/analytics', label: 'Analytics', icon: '~' },
  { path: '/heatmap',   label: 'Heatmap',   icon: '▦' },
  { path: '/journal',   label: 'Journal',   icon: '✦' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const level = user?.level || 1;
  const xp = user?.xp || 0;

  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-dot" />
        <span className="sidebar-logo-text">HabitFlow</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {/* Workspace */}
        <span className="sidebar-section-label">Workspace</span>
        {WORKSPACE_ITEMS.map(item => (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            whileTap={{ scale: 0.97 }}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}

        {/* Insights */}
        <span className="sidebar-section-label" style={{ marginTop: 16 }}>Insights</span>
        {INSIGHTS_ITEMS.map(item => (
          <motion.button
            key={item.path}
            onClick={() => item.path !== '/heatmap' ? navigate(item.path) : navigate('/analytics')}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            whileTap={{ scale: 0.97 }}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            {item.label}
          </motion.button>
        ))}
      </nav>

      {/* User profile */}
      {user && (
        <div
          className="sidebar-user"
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
          title="Go to profile"
        >
          <div className="sidebar-avatar">
            {user.avatarBase64
              ? <img src={user.avatarBase64} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.name?.[0]?.toUpperCase()
            }
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.name?.split(' ')[0] || 'User'}</div>
            <div className="sidebar-user-stats">LVL {level} · {xp.toLocaleString()} XP</div>
          </div>
        </div>
      )}
    </div>
  );
}
