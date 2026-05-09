import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAIStore from '../../stores/aiStore';
import useUIStore from '../../stores/uiStore';
import toast from 'react-hot-toast';

const DIFF_COLORS = { easy: '#34D399', medium: '#FBBF24', hard: '#F87171' };

export default function HabitSuggestions() {
  const { habitSuggestions, suggestionsError, suggestionsFallback, loadingStates, fetchHabitSuggestions, dismissHabitSuggestions } = useAIStore();
  const { openDrawer } = useUIStore();
  const loading = loadingStates['suggestions'];
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => { fetchHabitSuggestions(); }, []);

  const handleRefresh = () => {
    setDismissed(false);
    fetchHabitSuggestions();
  };

  const handleAddSuggestion = (s) => {
    openDrawer('create', {
      name: s.name,
      icon: s.icon || '✨',
      category: s.category || 'Custom',
      timeOfDay: s.timeOfDay || null,
      description: s.reason,
    });
    toast.success(`Opening "${s.name}" form...`);
  };

  const handleDismiss = () => {
    setDismissed(true);
    dismissHabitSuggestions();
  };

  if (dismissed) return null;

  // Nothing to show — no loading, no data, no error
  if (!loading && habitSuggestions.length === 0 && !suggestionsError) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="suggestions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        style={{ marginBottom: 24 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>✨</span>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}>
              AI SUGGESTIONS
            </span>
            {suggestionsFallback && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-tertiary)', background: 'var(--bg-elevated)',
                padding: '2px 8px', borderRadius: 99, border: '1px solid var(--border-subtle)',
              }}>
                Curated · AI resumes at quota reset
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!loading && (
              <button onClick={handleRefresh} style={{
                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                border: '1px solid var(--border-mid)', background: 'transparent',
                cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)',
              }}>
                ↻ Refresh
              </button>
            )}
            <button onClick={handleDismiss} style={{
              fontSize: 16, background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', lineHeight: 1, padding: '0 2px',
            }}>×</button>
          </div>
        </div>

        {/* Daily quota exhausted */}
        {suggestionsError === 'quota' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <span style={{ fontSize: 28 }}>⏳</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Daily AI quota used up
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                Gemini free tier resets daily at midnight Pacific time (1:30 PM IST). Suggestions will appear automatically after the reset.
              </div>
            </div>
          </motion.div>
        )}

        {/* Per-minute rate limit — temporary, just wait */}
        {suggestionsError === 'ratelimit' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
              borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <span style={{ fontSize: 28 }}>⏱️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                AI is cooling down — almost ready
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
                The model hit its per-minute limit. Click Refresh in a few seconds.
              </div>
            </div>
            <button onClick={handleRefresh} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--accent)',
              background: 'transparent', color: 'var(--accent)', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', whiteSpace: 'nowrap',
            }}>
              Try now
            </button>
          </motion.div>
        )}

        {/* Generic error state */}
        {suggestionsError === 'error' && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 14, padding: '16px 20px', fontSize: 13,
            color: 'var(--text-secondary)',
          }}>
            Couldn't load AI suggestions. <button onClick={handleRefresh} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: 0 }}>Try again</button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[0, 1, 2].map(i => <SuggestionSkeleton key={i} delay={i * 0.1} />)}
          </div>
        )}

        {/* Suggestion cards */}
        {!loading && habitSuggestions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {habitSuggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.name}</span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: DIFF_COLORS[s.difficulty] || '#888',
                    background: `${DIFF_COLORS[s.difficulty] || '#888'}18`,
                    padding: '2px 7px', borderRadius: 99,
                  }}>{s.difficulty}</span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {s.category && <Tag>{s.category}</Tag>}
                  {s.timeOfDay && <Tag>{s.timeOfDay}</Tag>}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {s.reason}
                </p>

                <button
                  onClick={() => handleAddSuggestion(s)}
                  onMouseEnter={e => e.target.style.opacity = '0.85'}
                  onMouseLeave={e => e.target.style.opacity = '1'}
                  style={{
                    marginTop: 4, padding: 8, borderRadius: 8, border: 'none',
                    background: 'var(--accent)', color: 'white',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-body)', transition: 'opacity 0.15s',
                  }}
                >
                  + Add this habit
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      color: 'var(--text-tertiary)', background: 'var(--bg-elevated)',
      padding: '2px 7px', borderRadius: 99,
    }}>{children}</span>
  );
}

function SuggestionSkeleton({ delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }}
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 16 }}
    >
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--border-subtle)', animation: 'shimmer 1.4s infinite', flexShrink: 0 }} />
        <div style={{ height: 12, flex: 1, background: 'var(--border-subtle)', borderRadius: 4, animation: 'shimmer 1.4s infinite' }} />
      </div>
      <div style={{ height: 9, width: '80%', background: 'var(--border-subtle)', borderRadius: 4, marginBottom: 6, animation: 'shimmer 1.4s infinite' }} />
      <div style={{ height: 9, width: '60%', background: 'var(--border-subtle)', borderRadius: 4, marginBottom: 16, animation: 'shimmer 1.4s infinite' }} />
      <div style={{ height: 32, borderRadius: 8, background: 'var(--border-subtle)', animation: 'shimmer 1.4s infinite' }} />
    </motion.div>
  );
}
