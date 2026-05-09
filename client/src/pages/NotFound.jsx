import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', fontFamily: 'var(--font-body)',
      textAlign: 'center', padding: 32,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🌿</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          404 — Page not found
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: 1.1 }}>
          This page doesn't exist
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
          You may have followed a broken link, or the page was moved. Your habits are still safe.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => navigate(-1)} style={{
            padding: '10px 22px', borderRadius: 10, border: '1px solid var(--border-mid)',
            background: 'transparent', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
          }}>
            ← Go Back
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: 'white',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>
            Dashboard →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
