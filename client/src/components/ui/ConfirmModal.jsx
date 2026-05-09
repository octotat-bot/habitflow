import { motion, AnimatePresence } from 'framer-motion';

/**
 * ConfirmModal — reusable destructive action confirmation
 * Usage:
 *   <ConfirmModal
 *     open={showConfirm}
 *     title="Archive habit?"
 *     message="It will be removed from your grid. You can restore it from settings."
 *     confirmLabel="Archive"
 *     danger
 *     onConfirm={doArchive}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 */
export default function ConfirmModal({
  open, title, message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  danger       = false,
  onConfirm,
  onCancel,
  loading      = false,
}) {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="confirm-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(26,25,22,0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 9000,
            }}
          />
          {/* Modal */}
          <motion.div
            key="confirm-modal"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9001,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18, padding: '28px 28px 24px',
              width: 400, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.16)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {danger ? '⚠️' : '❓'}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 20, color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}>{title}</h2>
            {message && (
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px' }}>
                {message}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onCancel} disabled={loading} style={{
                padding: '9px 20px', borderRadius: 10,
                border: '1px solid var(--border-mid)', background: 'transparent',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
              }}>
                {cancelLabel}
              </button>
              <button onClick={onConfirm} disabled={loading} style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: danger ? '#E5534B' : 'var(--accent)',
                color: 'white', fontSize: 13, fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'var(--font-body)',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.1s',
              }}>
                {loading ? 'Working...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
