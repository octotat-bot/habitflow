import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';
import toast from 'react-hot-toast';

function DNAHelix() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
      <svg width="48" height="80" viewBox="0 0 48 80">
        <style>{`
          .dna-strand { animation: dnaRotate 1.8s ease-in-out infinite; transform-origin: 24px 40px; }
          @keyframes dnaRotate { 0%,100%{d:path('M8 10 Q40 20 8 30 Q40 40 8 50 Q40 60 8 70')} 50%{d:path('M40 10 Q8 20 40 30 Q8 40 40 50 Q8 60 40 70')} }
        `}</style>
        {[0,1,2,3,4,5,6].map(i => (
          <ellipse key={i} cx="24" cy={10 + i * 10} rx={12} ry={3}
            fill="none" stroke="#5B9A2F" strokeWidth="2.5" opacity={0.4 + i * 0.08}
            style={{ animation: `dnaRotate ${1.4 + i * 0.1}s ease-in-out ${i * 0.06}s infinite alternate` }}
          />
        ))}
        <line x1="8" y1="10" x2="8" y2="70" stroke="#5B9A2F" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
        <line x1="40" y1="10" x2="40" y2="70" stroke="#C3DE94" strokeWidth="2" strokeDasharray="4 3" opacity="0.5" />
      </svg>
    </div>
  );
}

export default function RitualDNACard() {
  const { ritualDNA, loadingStates, fetchRitualDNA, generateRitualDNA } = useAIStore();
  const [generating, setGenerating] = useState(false);
  const loadingFetch = loadingStates['ritualDNA'];

  useEffect(() => { fetchRitualDNA(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateRitualDNA();
      toast.success('Ritual DNA generated!');
    } catch (err) {
      const msg = err?.response?.data?.error || 'AI unavailable';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = () => {
    if (!ritualDNA) return;
    const text = `My HabitFlow Ritual DNA:\n\n"${ritualDNA.archetype}"\n${ritualDNA.tagline}\n\nInsights:\n${ritualDNA.insights?.map(i => `• ${i}`).join('\n')}\n\nHabit Health Score: ${ritualDNA.score}/100\n\n#HabitFlow`;
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'));
  };

  if (loadingFetch) {
    return (
      <div style={{ background: '#1A1916', borderRadius: 18, padding: 28, marginBottom: 24 }}>
        <DNAHelix />
        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, fontStyle: 'italic' }}>Loading your Ritual DNA...</p>
      </div>
    );
  }

  if (!ritualDNA?.archetype) {
    return (
      <div style={{ background: '#1A1916', border: '1px solid #2A2A28', borderRadius: 18, padding: 28, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#5B9A2F', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>RITUAL DNA</div>
        <p style={{ color: '#666', fontSize: 13, lineHeight: 1.6, marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
          After 30+ days of tracking, your habit personality profile is ready to generate. This will reveal your archetype, patterns, and a habit health score.
        </p>
        {generating ? <DNAHelix /> : (
          <button onClick={handleGenerate}
            style={{ padding: '11px 28px', borderRadius: 99, border: '1.5px solid #5B9A2F', background: 'transparent', color: '#C3DE94', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', letterSpacing: '0.04em' }}>
            Generate My DNA →
          </button>
        )}
      </div>
    );
  }

  const daysSinceGen = ritualDNA.generatedAt
    ? Math.floor((Date.now() - new Date(ritualDNA.generatedAt)) / 86400000)
    : 99;
  const canRegenerate = daysSinceGen >= 7;

  return (
    <AnimatePresence>
      <motion.div
        key="dna"
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: '#1A1916', border: '1px solid #2A2A28', borderRadius: 18, padding: 28, marginBottom: 24, position: 'relative', overflow: 'hidden' }}
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, #5B9A2F15 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: '#5B9A2F', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
          ◆ RITUAL DNA
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, var(--font-display)', fontWeight: 800, fontSize: 30, color: '#F5F4EF', margin: '0 0 6px', lineHeight: 1.1 }}>
              {ritualDNA.archetype}
            </h2>
            <p style={{ fontStyle: 'italic', color: '#7A7772', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
              {ritualDNA.tagline}
            </p>

            {/* Insights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {(ritualDNA.insights || []).map((insight, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5B9A2F', flexShrink: 0, marginTop: 6 }} />
                  <p style={{ margin: 0, fontSize: 13, color: '#A8A5A0', lineHeight: 1.6 }}>{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Score */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 44, fontWeight: 700, color: '#C3DE94', lineHeight: 1 }}>
              {ritualDNA.score}
            </div>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>/ 100</div>
            <div style={{ fontSize: 9, color: '#444', marginTop: 4, fontFamily: 'monospace' }}>HABIT SCORE</div>
          </div>
        </div>

        {/* Category badge */}
        {ritualDNA.dominantCategory && (
          <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: '#5B9A2F18', border: '1px solid #5B9A2F30', fontSize: 10, color: '#5B9A2F', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 }}>
            {ritualDNA.dominantCategory} dominant
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button onClick={handleShare} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #2A2A28', background: 'transparent', color: '#7A7772', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            ↗ Share
          </button>
          {canRegenerate ? (
            <button onClick={handleGenerate} disabled={generating} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #5B9A2F', background: 'transparent', color: '#C3DE94', fontSize: 12, cursor: generating ? 'wait' : 'pointer', fontFamily: 'var(--font-body)' }}>
              {generating ? '...' : '↻ Regenerate'}
            </button>
          ) : (
            <span style={{ fontSize: 11, color: '#444', alignSelf: 'center', fontFamily: 'monospace' }}>
              Regenerate in {7 - daysSinceGen}d
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
