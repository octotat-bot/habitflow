import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function RescheduleSuggestions() {
  const { rescheduleSuggestions, loadingStates, fetchRescheduleSuggestions, dismissRescheduleSuggestion } = useAIStore();
  const loading = loadingStates['reschedule'];

  useEffect(() => { fetchRescheduleSuggestions(); }, []);

  const applyReschedule = async (habitId, suggestedTimeOfDay, habitName) => {
    try {
      await api.put(`/habits/${habitId}`, { timeOfDay: suggestedTimeOfDay });
      dismissRescheduleSuggestion(habitId);
      toast.success(`${habitName} moved to ${suggestedTimeOfDay} ✓`);
    } catch {
      toast.error('Failed to update habit time');
    }
  };

  if (!loading && rescheduleSuggestions.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
        ⏰ AI RESCHEDULING SUGGESTIONS
      </div>
      <AnimatePresence>
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '8px 0' }}>
            Analyzing your completion patterns...
          </motion.div>
        )}
        {rescheduleSuggestions.map((s) => (
          <motion.div key={String(s.habitId)}
            layout
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 22, flexShrink: 0 }}>{s.habitIcon || '📌'}</span>
            <p style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
              {s.suggestion}
            </p>
            <button
              onClick={() => applyReschedule(s.habitId, s.suggestedTimeOfDay, s.habitName)}
              style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-body)' }}
            >
              Move to {s.suggestedTimeOfDay}
            </button>
            <button onClick={() => dismissRescheduleSuggestion(s.habitId)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, flexShrink: 0 }}>×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
