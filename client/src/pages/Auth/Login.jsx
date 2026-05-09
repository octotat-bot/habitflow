import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/axios'
import useUserStore from '../../stores/userStore'
import { tabStorage } from '../../lib/storage'
import { validateLoginForm, mapAuthError } from '../../lib/errorMap'

const STATS = [
  { num: '78%',  label: '30-day completion rate', pct: 78  },
  { num: '21d',  label: 'longest streak',          pct: 55  },
  { num: '847',  label: 'weekly score record',      pct: 70  },
  { num: '12k+', label: 'builders in the ritual',   pct: 100 },
]

const QUOTES = [
  { text: 'Your habits.', accent: false },
  { text: 'Your data.',   accent: false },
  { text: 'Your proof.',  accent: true  },
]

export default function Login() {
  const navigate = useNavigate()
  const { setToken, fetchUser } = useUserStore()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [loading, setLoading]     = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent]   = useState(false)

  // Clear field error as user types
  const handleChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (fieldErrors[key]) setFieldErrors(p => ({ ...p, [key]: '' }))
    if (globalError) setGlobalError('')
  }

  // Validate individual field on blur
  const handleBlur = (key) => {
    const errs = validateLoginForm(form)
    if (errs[key]) setFieldErrors(p => ({ ...p, [key]: errs[key] }))
  }

  const handleLogin = async () => {
    // Client-side validation first
    const clientErrors = validateLoginForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setLoading(true)
    setFieldErrors({})
    setGlobalError('')
    try {
      const { data } = await api.post('/auth/login', form)
      tabStorage.set('hf_token', data.token)
      setToken(data.token)
      await fetchUser()
      navigate('/')
    } catch (e) {
      const { global, fields } = mapAuthError(e, 'login')
      setGlobalError(global)
      setFieldErrors(fields)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>

        {/* ── LEFT PANEL — dark stats ── */}
        <div style={styles.left}>
          <div style={styles.logo}>
            <div style={styles.logoDot} />
            HabitFlow
          </div>

          <div style={styles.statsBlock}>
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={styles.statRow}
              >
                <div style={styles.statNum}>{s.num}</div>
                <div style={styles.statLabel}>{s.label}</div>
                <div style={styles.barTrack}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ delay: i * 0.08 + 0.3, duration: 0.6, ease: 'easeOut' }}
                    style={styles.barFill}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div style={styles.tagline}>
            {QUOTES.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.12 }}
                style={{ color: q.accent ? '#6BA80A' : '#F5F2EC' }}
              >
                {q.text}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — form ── */}
        <div style={styles.right}>
          <AnimatePresence mode="wait">

            {/* LOGIN FORM */}
            {!showReset && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                style={styles.formWrap}
              >
                <div style={styles.formHead}>
                  <div style={styles.formTitle}>Welcome back.</div>
                  <div style={styles.formSub}>Your ritual is waiting.</div>
                </div>

                <div style={styles.fieldGroup}>
                  <div style={styles.label}>Email address</div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.email ? '#E5534B' : '#E0DBD0' }}
                    type="email"
                    placeholder="you@email.com"
                    value={form.email}
                    autoFocus
                    onChange={e => handleChange('email', e.target.value)}
                    onFocus={e => e.target.style.borderColor = fieldErrors.email ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('email'); e.target.style.borderColor = fieldErrors.email ? '#E5534B' : '#E0DBD0' }}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  />
                  <AnimatePresence>
                    {fieldErrors.email && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>
                        {fieldErrors.email}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={styles.fieldGroup}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={styles.label}>Password</div>
                    <button onClick={() => setShowReset(true)} style={styles.forgotBtn}>Forgot?</button>
                  </div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.password ? '#E5534B' : '#E0DBD0' }}
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    onFocus={e => e.target.style.borderColor = fieldErrors.password ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('password'); e.target.style.borderColor = fieldErrors.password ? '#E5534B' : '#E0DBD0' }}
                  />
                  <AnimatePresence>
                    {fieldErrors.password && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>
                        {fieldErrors.password}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {globalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={styles.errorBox}
                    >
                      {globalError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleLogin}
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  style={{ ...styles.primaryBtn, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Entering ritual...' : 'Enter your ritual →'}
                </motion.button>

                <div style={styles.divider}>
                  <div style={styles.dividerLine} />
                  <span style={styles.dividerText}>or</span>
                  <div style={styles.dividerLine} />
                </div>

                <button style={styles.googleBtn} disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                <div style={styles.footNote}>
                  No account?{' '}
                  <Link to="/signup" style={styles.footLink}>Start your ritual free</Link>
                </div>
              </motion.div>
            )}

            {/* RESET FORM */}
            {showReset && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                style={styles.formWrap}
              >
                <div style={styles.formHead}>
                  <div style={styles.formTitle}>Reset password.</div>
                  <div style={styles.formSub}>We'll send a reset link to your email.</div>
                </div>

                {!resetSent ? (
                  <>
                    <div style={styles.fieldGroup}>
                      <div style={styles.label}>Email address</div>
                      <input
                        style={styles.input}
                        type="email"
                        placeholder="you@email.com"
                        value={resetEmail}
                        autoFocus
                        onChange={e => setResetEmail(e.target.value)}
                        onFocus={e => e.target.style.borderColor = '#6BA80A'}
                        onBlur={e => e.target.style.borderColor = '#E0DBD0'}
                      />
                    </div>
                    <button onClick={() => setResetSent(true)} style={styles.primaryBtn}>
                      Send reset link →
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.resetSuccess}
                  >
                    <div style={styles.resetSuccessIcon}>✓</div>
                    <div style={styles.resetSuccessText}>
                      Reset link sent to <strong>{resetEmail}</strong>.<br />Check your inbox.
                    </div>
                  </motion.div>
                )}

                <button onClick={() => { setShowReset(false); setResetSent(false) }} style={styles.backBtn}>
                  ← Back to sign in
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" },
  shell: { width: '100%', maxWidth: 860, minHeight: 560, background: '#FDFCF9', border: '0.5px solid #E4DFD4', borderRadius: 20, display: 'flex', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  left: { width: 340, flexShrink: 0, background: '#1A1714', padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  logo: { fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#F5F2EC', display: 'flex', alignItems: 'center', gap: 7 },
  logoDot: { width: 8, height: 8, background: '#6BA80A', borderRadius: '50%' },
  statsBlock: { display: 'flex', flexDirection: 'column', gap: 18 },
  statRow: { display: 'flex', flexDirection: 'column', gap: 3 },
  statNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 500, color: '#6BA80A', lineHeight: 1 },
  statLabel: { fontSize: 11, color: '#5A5652', marginTop: 1 },
  barTrack: { height: 2, background: '#2A2724', borderRadius: 1, overflow: 'hidden', marginTop: 6 },
  barFill: { height: '100%', background: '#6BA80A', borderRadius: 1 },
  tagline: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1.3 },
  right: { flex: 1, padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  formWrap: { display: 'flex', flexDirection: 'column', gap: 18 },
  formHead: { marginBottom: 4 },
  formTitle: { fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: '#1A1714', letterSpacing: '-0.5px', lineHeight: 1 },
  formSub: { fontSize: 13, color: '#8A8480', marginTop: 6 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A8A29C', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { background: '#F2EFE8', border: '0.5px solid #E0DBD0', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#1A1714', fontFamily: "'DM Sans', sans-serif", width: '100%', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' },
  forgotBtn: { background: 'none', border: 'none', fontSize: 11, color: '#6BA80A', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", padding: 0, fontWeight: 500 },
  errorBox: { fontSize: 12, color: '#C0392B', background: '#FDECEA', border: '0.5px solid #F5C6C6', borderRadius: 7, padding: '9px 13px' },
  fieldError: { fontSize: 11, color: '#C0392B', marginTop: -2, paddingLeft: 2, fontFamily: "'DM Sans', sans-serif" },
  primaryBtn: { background: '#1A1714', color: '#F5F2EC', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', transition: 'transform 0.1s', width: '100%' },
  divider: { display: 'flex', alignItems: 'center', gap: 10, margin: '-4px 0' },
  dividerLine: { flex: 1, height: '0.5px', background: '#E4DFD4' },
  dividerText: { fontSize: 11, color: '#C0BAB2', fontFamily: "'JetBrains Mono', monospace" },
  googleBtn: { background: 'transparent', border: '0.5px solid #E0DBD0', borderRadius: 9, padding: '11px 16px', fontSize: 13, color: '#5A5652', cursor: 'not-allowed', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', opacity: 0.6 },
  footNote: { fontSize: 12, color: '#A8A29C', textAlign: 'center', marginTop: -4 },
  footLink: { color: '#6BA80A', textDecoration: 'none', fontWeight: 500 },
  backBtn: { background: 'none', border: 'none', fontSize: 12, color: '#A8A29C', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", padding: 0, textAlign: 'left' },
  resetSuccess: { background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 },
  resetSuccessIcon: { width: 24, height: 24, background: '#6BA80A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  resetSuccessText: { fontSize: 13, color: '#27500A', lineHeight: 1.6 },
}
