import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Phase messages tied to real loading stages ─────────────
const PHASES = [
  { text: 'Warming up...',          threshold: 0  },
  { text: 'Fetching your habits...',threshold: 25 },
  { text: 'Crunching streaks...',   threshold: 50 },
  { text: 'Syncing progress...',    threshold: 72 },
  { text: 'Almost ready...',        threshold: 88 },
];

function getPhaseText(progress) {
  let label = PHASES[0].text;
  for (const phase of PHASES) {
    if (progress >= phase.threshold) label = phase.text;
  }
  return label;
}

/**
 * LoadingScreen
 *
 * Props:
 *  - isVisible: boolean  — true while app is authenticating / fetching initial data
 *  - progress?: number   — 0-100 real progress (optional; auto-simulates if omitted)
 */
export default function LoadingScreen({ isVisible, progress: externalProgress }) {
  const [progress, setProgress]   = useState(0);
  const [phase, setPhase]         = useState(PHASES[0].text);
  const [exiting, setExiting]     = useState(false);
  const timerRef                  = useRef(null);

  // Auto-simulate progress if no external value provided
  useEffect(() => {
    if (!isVisible) {
      // Complete the bar before exit
      setProgress(100);
      const t = setTimeout(() => setExiting(true), 400);
      return () => clearTimeout(t);
    }

    setExiting(false);
    setProgress(0);

    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (externalProgress != null) return Math.min(externalProgress, 96);
        // Simulate realistic loading curve (slows near 90%)
        const remaining = 90 - p;
        const increment = Math.max(remaining * 0.12, 1.5);
        return Math.min(p + increment * (0.6 + Math.random() * 0.8), 90);
      });
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [isVisible, externalProgress]);

  // Update phase label whenever progress changes
  useEffect(() => {
    setPhase(getPhaseText(progress));
  }, [progress]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: '#0C0B09',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            userSelect: 'none',
          }}
        >
          {/* Subtle dot grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, #1e1d1a 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
          }} />

          {/* Radial glow behind logo */}
          <div style={{
            position: 'absolute',
            width: 300, height: 300,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(91,154,47,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

            {/* ── Logo mark ─────────────────────────────── */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 28 }}
            >
              <svg width="64" height="64" viewBox="0 0 56 56" fill="none">
                {/* Outer leaf */}
                <motion.path
                  d="M28 6C28 6 13 17 13 31C13 40.4 19.7 48 28 48C36.3 48 43 40.4 43 31C43 17 28 6 28 6Z"
                  fill="#5B9A2F"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
                {/* Inner highlight */}
                <motion.path
                  d="M28 19C28 19 20 25 20 33C20 37.4 23.6 41 28 41C32.4 41 36 37.4 36 33C36 25 28 19 28 19Z"
                  fill="#C3DE94"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ transformOrigin: '28px 30px' }}
                />
                {/* Center dot */}
                <motion.circle
                  cx="28" cy="33" r="3"
                  fill="white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
            </motion.div>

            {/* ── Wordmark ───────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{
                fontFamily: '"Syne", sans-serif',
                fontWeight: 800, fontSize: 30, color: '#F5F4EF',
                letterSpacing: '-0.03em', marginBottom: 6,
                lineHeight: 1,
              }}
            >
              HabitFlow
            </motion.div>

            {/* ── Tagline ────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 9, color: '#3D3C39',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                marginBottom: 52,
              }}
            >
              AI-Powered Habit OS
            </motion.div>

            {/* ── Progress track ─────────────────────────── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
            >
              {/* Track */}
              <div style={{
                width: '100%', height: 2,
                background: '#1A1917',
                borderRadius: 99, overflow: 'hidden',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #3D6B1A, #5B9A2F, #C3DE94)',
                    borderRadius: 99,
                    boxShadow: '0 0 8px rgba(91,154,47,0.6)',
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.4 }}
                />
              </div>

              {/* Phase label */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12, color: '#3A3936',
                    letterSpacing: '0.02em',
                  }}
                >
                  {phase}
                </motion.div>
              </AnimatePresence>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
