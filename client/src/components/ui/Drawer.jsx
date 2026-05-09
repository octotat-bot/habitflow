import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const h = (e) => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

export default function Drawer({ isOpen, onClose, children, title, width = 520 }) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── animation variants ── */
  const panelVariants = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  const panelStyle = isMobile
    ? {
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        height: '92dvh',
        width: '100%',
        borderRadius: '20px 20px 0 0',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.14)',
      }
    : {
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: `min(${width}px, 100vw)`,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.10)',
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(26,25,22,0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
            }}
          />

          {/* Panel */}
          <motion.div
            key="drawer"
            {...panelVariants}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={panelStyle}
          >
            {/* Mobile drag handle */}
            {isMobile && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--border-mid)' }} />
              </div>
            )}

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '12px 20px' : '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
              background: 'var(--bg-surface)',
            }}>
              {title && (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 15 : 17, color: 'var(--text-primary)' }}>
                  {title}
                </span>
              )}
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid var(--border-mid)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 17, marginLeft: 'auto',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '20px 16px' : '24px',
              paddingBottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : '24px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
