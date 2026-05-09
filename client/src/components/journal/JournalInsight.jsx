import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import useAIStore from '../../stores/aiStore';

export default function JournalInsight() {
  const { journalInsight, loadingStates, fetchJournalInsight } = useAIStore();
  const loading = loadingStates['journalInsight'];

  useEffect(() => { fetchJournalInsight(); }, []);

  return (
    <AnimatePresence>
      {(loading || journalInsight?.insight) && (
        <motion.div
          key="ji"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 20,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}
        >
          {/* Magnifying glass icon */}
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              PATTERN DETECTED
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 0.9s infinite' }} />
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Scanning your journal patterns...</span>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 6px' }}>
                  {journalInsight.insight}
                </p>
                {journalInsight.createdAt && (
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    Updated {formatDistanceToNow(new Date(journalInsight.createdAt))} ago
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
