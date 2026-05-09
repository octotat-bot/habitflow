import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../../stores/userStore';

const navItems = [
  { path: '/', label: 'Today', icon: SunIcon },
  { path: '/habits', label: 'Habits', icon: GridIcon },
  { path: '/analytics', label: 'Stats', icon: ChartIcon },
  { path: '/streaks', label: 'Streaks', icon: FlameIcon },
  { path: '/journal', label: 'Journal', icon: BookIcon },
  { path: '/profile', label: 'Profile', icon: UserIcon },
];

export default function BottomDock() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUserStore(s => s.user);

  const activeIndex = navItems.findIndex(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  });

  return (
    <div className="bottom-dock">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
        className="frosted"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '8px 12px',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        {navItems.map((item, index) => {
          const isActive = index === activeIndex;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '8px 12px',
                borderRadius: 'var(--radius-lg)',
                background: isActive ? 'var(--accent-glow)' : 'transparent',
                position: 'relative',
                transition: 'background 0.2s ease',
                minWidth: 52,
                cursor: 'none',
              }}
            >
              {/* Active dot indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    style={{
                      position: 'absolute',
                      top: 5,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      boxShadow: '0 0 6px var(--accent)',
                    }}
                  />
                )}
              </AnimatePresence>

              <Icon
                size={20}
                color={isActive ? 'var(--accent)' : 'var(--text-tertiary)'}
                style={{ transition: 'color 0.2s ease' }}
              />

              <span style={{
                fontSize: 10,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                letterSpacing: '0.02em',
                transition: 'color 0.2s ease',
              }}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

// Icon components
function SunIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}
function GridIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function ChartIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}
function FlameIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}
function BookIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}
function UserIcon({ size = 20, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}
