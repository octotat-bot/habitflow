import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';

export default function CoachMessage({ habitId, habitColor = '#5B9A2F', event }) {
  const { coachMessages, loadingStates, fetchCoachMessage, dismissCoachMessage } = useAIStore();
  const message = coachMessages[habitId];
  const loading = loadingStates[`coach_${habitId}`];

  useEffect(() => {
    if (event) fetchCoachMessage(habitId, event);
  }, [habitId, event]);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => dismissCoachMessage(habitId), 8000);
      return () => clearTimeout(t);
    }
  }, [message, habitId]);

  return (
    <AnimatePresence>
      {(loading || message) && (
        <motion.div
          key="coach"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          onClick={() => !loading && dismissCoachMessage(habitId)}
          style={{
            borderLeft: `3px solid ${habitColor}`,
            background: `${habitColor}08`,
            borderRadius: '0 8px 8px 0',
            padding: '10px 14px',
            cursor: 'pointer',
            marginTop: 6,
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: habitColor, display: 'inline-block', animation: 'coachPulse 1s infinite' }} />
              <style>{`@keyframes coachPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Coach is analyzing your data...</span>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
              {message}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
