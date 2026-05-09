import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import useUserStore from '../../stores/userStore';
import { notificationService } from '../../lib/NotificationService';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/',          label: 'Today',   icon: '◈' },
  { path: '/habits',    label: 'Habits',  icon: '≋' },
  { path: '/analytics', label: 'Stats',   icon: '⌇' },
  { path: '/streaks',   label: 'Streaks', icon: '◎' },
  { path: '/journal',   label: 'Journal', icon: '◻' },
];

const MENU_ITEMS = [
  { path: '/profile',      label: 'My Profile',   emoji: '👤' },
  { path: '/achievements', label: 'Achievements', emoji: '🏆' },
  { path: '/weekly',       label: 'Weekly Review', emoji: '📅' },
];

export default function FloatingNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useUserStore();
  const [hovering, setHovering]     = useState(null);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications.');
      return;
    }
    if (Notification.permission === 'denied') {
      toast.error('Notifications are blocked. Allow them in your browser Site Settings.');
      return;
    }
    toast.loading('Requesting permission...', { id: 'notif-req', duration: 3000 });
    const granted = await notificationService.requestPermission();
    const status  = Notification.permission;
    setNotifStatus(status);
    if (granted) {
      toast.success('Notifications enabled! 🔔', { id: 'notif-req' });
      setTimeout(() => notificationService.test(), 500);
    } else {
      toast.error('Permission denied. Check browser & macOS notification settings.', { id: 'notif-req' });
    }
  };

  const profileActive = ['/profile', '/achievements', '/weekly'].some(p =>
    location.pathname.startsWith(p)
  );

  return (
    <div
      className="floating-nav-bar"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 24px',
        background: 'rgba(245,244,239,0.88)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
      >
        <motion.div
          whileHover={{ scale: 1.2 }}
          style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}
        />
        <span
          className="floating-nav-logo-text"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}
        >
          HabitFlow
        </span>
      </button>

      {/* Nav Pills — hidden on mobile via CSS, replaced by BottomDock */}
      <nav className="floating-nav-pills" style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 99, padding: '5px 6px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}>
        {NAV_ITEMS.map((item) => {
          const active  = isActive(item.path);
          const hovered = hovering === item.path;
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              onHoverStart={() => setHovering(item.path)}
              onHoverEnd={() => setHovering(null)}
              whileTap={{ scale: 0.93 }}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 99, border: 'none', background: 'transparent',
                color: active ? 'var(--accent-dim)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: active ? 700 : 500, overflow: 'hidden', whiteSpace: 'nowrap',
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-active-pill"
                  style={{ position: 'absolute', inset: 0, background: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 99, zIndex: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1, fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: active || hovered ? 'auto' : 0, opacity: active || hovered ? 1 : 0 }}
                style={{ position: 'relative', zIndex: 1, fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', display: 'inline-block' }}
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

        {/* WK Score pill — hidden on mobile via CSS */}
        {user && (
          <button
            className="floating-nav-wk-pill"
            onClick={() => navigate('/weekly')}
            style={{
              background: 'var(--accent-light)', border: '1.5px solid var(--accent)',
              borderRadius: 99, padding: '4px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--accent-dim)', textTransform: 'uppercase' }}>WK SCORE</span>
            <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
              {(user.weeklyScore || 0).toLocaleString()}
            </span>
          </button>
        )}

        {/* Avatar + dropdown */}
        {user && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <motion.button
              onClick={() => setMenuOpen(o => !o)}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'var(--accent)',
                color: 'white', border: menuOpen ? '2px solid var(--accent-dim)' : '2px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                overflow: 'hidden', boxShadow: '0 2px 8px rgba(91,154,47,0.3)',
                transition: 'border 0.15s', flexShrink: 0,
              }}
            >
              {user.avatarBase64
                ? <img src={user.avatarBase64} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.name?.[0]?.toUpperCase()
              }
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: -6 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute', top: 42, right: 0,
                    width: 220,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 14, padding: '6px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
                    zIndex: 9999,
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Level {user.level || 1} · {user.xp || 0} XP</div>
                  </div>

                  {MENU_ITEMS.map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', textAlign: 'left', padding: '9px 12px',
                        borderRadius: 9, border: 'none',
                        background: location.pathname === item.path ? 'var(--accent-light)' : 'transparent',
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                        color: location.pathname === item.path ? 'var(--accent-dim)' : 'var(--text-primary)',
                        fontSize: 13, fontWeight: location.pathname === item.path ? 700 : 400,
                      }}
                      onMouseEnter={e => { if (location.pathname !== item.path) e.currentTarget.style.background = 'var(--bg-base)'; }}
                      onMouseLeave={e => { if (location.pathname !== item.path) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: 16 }}>{item.emoji}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '6px 4px' }} />

                  {/* Notifications */}
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                      🔔 Notifications
                    </div>
                    {notifStatus === 'granted' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B9A2F', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: 'var(--accent-dim)', fontWeight: 600 }}>Active</span>
                        <button
                          onClick={() => notificationService.test()}
                          style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 8px', borderRadius: 6, border: '1px solid var(--accent)', background: 'var(--accent-light)', color: 'var(--accent-dim)', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Test
                        </button>
                      </div>
                    ) : notifStatus === 'denied' ? (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                        Blocked by browser. Allow "Notifications" in site settings.
                      </div>
                    ) : notifStatus === 'unsupported' ? (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Not supported in this browser.</div>
                    ) : (
                      <button
                        onClick={handleEnableNotifications}
                        style={{
                          width: '100%', padding: '8px', borderRadius: 8,
                          border: '1.5px solid var(--accent)', background: 'var(--accent-light)',
                          color: 'var(--accent-dim)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        Enable Habit Reminders
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile Bottom Dock ────────────────────────────────────────────────────────
export function BottomDock() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-dock" aria-label="Mobile navigation">
      {NAV_ITEMS.map(item => {
        const active = isActive(item.path);
        return (
          <motion.button
            key={item.path}
            className={`bottom-dock-btn${active ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.85 }}
          >
            <span className="bottom-dock-icon">{item.icon}</span>
            <span className="bottom-dock-label">{item.label}</span>
          </motion.button>
        );
      })}
    </nav>
  );
}
