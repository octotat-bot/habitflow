import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';
import confetti from 'canvas-confetti';

export default function AutopsyModal() {
  const { autopsyModal, dismissAutopsy, loadingStates } = useAIStore();
  const loading = loadingStates['autopsy'];

  const handleStartAgain = () => {
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 }, colors: ['#5B9A2F', '#C3DE94', '#fff'] });
    dismissAutopsy();
  };

  return (
    <AnimatePresence>
      {(autopsyModal || loading) && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,25,22,0.6)', backdropFilter: 'blur(8px)', zIndex: 9500 }}
            onClick={dismissAutopsy}
          />
          <motion.div key="modal"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              zIndex: 9501, background: '#0F0E0C', border: '1px solid #2A2A28',
              borderRadius: 18, padding: '32px 32px 28px', width: 440, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: '#E5534B', textTransform: 'uppercase', marginBottom: 16 }}>
              ◆ STREAK AUTOPSY
            </div>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#E5534B', display: 'inline-block', animation: 'coachPulse 0.8s infinite' }} />
                <style>{`@keyframes coachPulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
                <span style={{ color: '#555', fontFamily: 'monospace', fontSize: 13 }}>Analyzing the pattern...</span>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#F5F4EF', lineHeight: 1.2, marginBottom: 4 }}>
                    {autopsyModal?.habitName}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#E5534B' }}>
                    {autopsyModal?.brokenStreak}-day streak broken
                  </div>
                </div>

                <p style={{ fontSize: 14, color: '#A8A5A0', lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
                  {autopsyModal?.message}
                </p>
              </>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={dismissAutopsy} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #2A2A28', background: 'transparent', color: '#666', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Got it
              </button>
              <button onClick={handleStartAgain} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#5B9A2F', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                Start Again 🌱
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
