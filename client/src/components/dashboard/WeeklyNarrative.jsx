import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import useAIStore from '../../stores/aiStore';

export default function WeeklyNarrative() {
  const { weeklyNarrative, loadingStates, fetchWeeklyNarrative } = useAIStore();
  const loading = loadingStates['weeklyNarrative'];
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('wn_dismissed') === new Date().toISOString().slice(0, 10));

  useEffect(() => { fetchWeeklyNarrative(); }, []);

  if (dismissed) return null;
  if (!loading && !weeklyNarrative?.narrative) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '22px 24px', marginBottom: 20, position: 'relative' }}
      >
        {/* Dismiss */}
        <button onClick={() => { setDismissed(true); localStorage.setItem('wn_dismissed', new Date().toISOString().slice(0, 10)); }}
          style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, lineHeight: 1 }}>×</button>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'flex-start' }}>
          {/* Quote mark */}
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 64, color: 'var(--border-bright)', lineHeight: 0.8, marginTop: 8, userSelect: 'none' }}>"</div>

          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
              AI WEEKLY RECAP
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, animation: 'cursorBlink 0.8s infinite', color: 'var(--text-primary)' }}>|</span>
                <style>{`@keyframes cursorBlink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
                <span style={{ fontSize: 13, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Writing your weekly recap...</span>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                {weeklyNarrative.narrative}
              </p>
            )}

            {weeklyNarrative?.weekStart && (
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 10 }}>
                Week of {weeklyNarrative.weekStart} – {weeklyNarrative.weekEnd}
                {weeklyNarrative.createdAt && ` · ${formatDistanceToNow(new Date(weeklyNarrative.createdAt))} ago`}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
