import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';

export default function CascadeInsights() {
  const { cascadeInsights, loadingStates, fetchCascadeInsights } = useAIStore();
  const loading = loadingStates['cascade'];

  useEffect(() => { fetchCascadeInsights(); }, []);

  if (!loading && cascadeInsights.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
        🔗 HABIT CASCADES
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
          Computing habit correlations...
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
        <AnimatePresence>
          {cascadeInsights.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              style={{
                flexShrink: 0, background: 'var(--bg-surface)',
                border: '1px solid #0D9488',
                borderRadius: 14, padding: '14px 16px', minWidth: 240, maxWidth: 280,
              }}
            >
              {/* Two habits connected by arrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 20 }}>{c.habitA.icon || '●'}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.habitA.name}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ height: 2, flex: 1, background: 'linear-gradient(90deg, #0D9488 0%, #14B8A6 100%)', borderRadius: 1 }} />
                  <div style={{ fontSize: 14, color: '#0D9488', fontWeight: 700, margin: '0 4px' }}>→</div>
                  <div style={{ height: 2, flex: 1, background: 'linear-gradient(90deg, #14B8A6 0%, #0D9488 100%)', borderRadius: 1 }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 20 }}>{c.habitB.icon || '●'}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-tertiary)', maxWidth: 60, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.habitB.name}</span>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: '#0D9488', background: '#0D948812', display: 'inline-block', padding: '2px 8px', borderRadius: 99, marginBottom: 8 }}>
                +{c.liftPct}% lift
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                {c.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
