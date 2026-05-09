import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/axios'
import useUserStore from '../../stores/userStore'
import { tabStorage } from '../../lib/storage'
import { validateSignupForm, mapAuthError } from '../../lib/errorMap'

const HABITS = [
  { id: 'meditate',   icon: '🧘', name: 'Meditate',    cat: 'MIND',     color: '#A78BFA' },
  { id: 'run',        icon: '🏃', name: 'Run',          cat: 'BODY',     color: '#34D399' },
  { id: 'read',       icon: '📖', name: 'Read',         cat: 'MIND',     color: '#A78BFA' },
  { id: 'deepwork',   icon: '💻', name: 'Deep Work',    cat: 'WORK',     color: '#60A5FA' },
  { id: 'coldshower', icon: '🚿', name: 'Cold Shower',  cat: 'BODY',     color: '#34D399' },
  { id: 'journal',    icon: '✏️', name: 'Journal',      cat: 'MIND',     color: '#A78BFA' },
  { id: 'workout',    icon: '💪', name: 'Workout',      cat: 'BODY',     color: '#34D399' },
  { id: 'hydrate',    icon: '💧', name: 'Hydrate',      cat: 'BODY',     color: '#34D399' },
  { id: 'nosugar',    icon: '🥗', name: 'No Sugar',     cat: 'BODY',     color: '#34D399' },
  { id: 'sleep',      icon: '😴', name: 'Sleep 8h',     cat: 'BODY',     color: '#34D399' },
  { id: 'gratitude',  icon: '🙏', name: 'Gratitude',    cat: 'SPIRIT',   color: '#F472B6' },
  { id: 'stretch',    icon: '🤸', name: 'Stretch',      cat: 'BODY',     color: '#34D399' },
]

const ENERGY_MSGS = [
  '', 'Pick at least one', '1 habit — keep going',
  '2 habits — solid start', '3 habits — nice start',
  '4 habits — ambitious', '5 habits — now we\'re talking',
  '6 habits — serious builder', '7 habits — elite mode',
  '8 habits — dedicated', '9 habits — relentless',
  '10 habits — machine mode', '11 habits — absolute beast',
  '12 habits — legendary',
]

export default function Signup() {
  const navigate = useNavigate()
  const { setToken, fetchUser } = useUserStore()

  const [step, setStep]         = useState(1)
  const [selected, setSelected] = useState(new Set(['meditate', 'read', 'journal']))
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading]   = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [globalError, setGlobalError] = useState('')

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleChange = (key, val) => {
    setForm(p => ({ ...p, [key]: val }))
    if (fieldErrors[key]) setFieldErrors(p => ({ ...p, [key]: '' }))
    if (globalError) setGlobalError('')
    // Real-time confirm password check
    if (key === 'confirmPassword' || key === 'password') {
      const pass     = key === 'password'         ? val : form.password
      const confirm  = key === 'confirmPassword'  ? val : form.confirmPassword
      if (confirm && pass !== confirm) {
        setFieldErrors(p => ({ ...p, confirmPassword: "Passwords don't match." }))
      } else if (confirm) {
        setFieldErrors(p => ({ ...p, confirmPassword: '' }))
      }
    }
  }

  const handleBlur = (key) => {
    const errs = validateSignupForm(form)
    if (errs[key]) setFieldErrors(p => ({ ...p, [key]: errs[key] }))
  }

  const handleNext = () => {
    if (selected.size === 0) return
    setStep(2)
  }

  const handleSubmit = async () => {
    const clientErrors = validateSignupForm(form)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      return
    }
    setLoading(true)
    setFieldErrors({})
    setGlobalError('')
    try {
      const starterHabits = [...selected].map(id => {
        const h = HABITS.find(h => h.id === id)
        return {
          name: h.name,
          icon: h.icon,
          category: h.cat[0] + h.cat.slice(1).toLowerCase(),
          color: h.color,
        }
      })
      const { data } = await api.post('/auth/register', { ...form, starterHabits })
      tabStorage.set('hf_token', data.token)
      setToken(data.token)
      await fetchUser()
      navigate('/')
    } catch (e) {
      const { global, fields } = mapAuthError(e, 'register')
      setGlobalError(global)
      setFieldErrors(fields)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>

        {/* ── LEFT PANEL ── */}
        <div style={styles.left}>
          <div style={styles.leftLogo}>
            <div style={styles.logoDot} />
            HabitFlow
          </div>

          <div style={styles.leftCenter}>
            <div style={styles.leftEyebrow}>
              {step === 1 ? 'Step 1 of 2 — Your Rituals' : 'Step 2 of 2 — Your Identity'}
            </div>
            <div style={styles.leftHeadline}>
              {step === 1 ? (
                <>What will<br />you <em style={{ color: '#6BA80A', fontStyle: 'normal' }}>build?</em></>
              ) : (
                <>Almost<br /><em style={{ color: '#6BA80A', fontStyle: 'normal' }}>there.</em></>
              )}
            </div>
            <div style={styles.leftSub}>
              {step === 1
                ? 'Pick the habits you want to track. Your account comes after.'
                : `${selected.size} ritual${selected.size !== 1 ? 's' : ''} locked in. Now let's make it yours.`}
            </div>
          </div>

          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.previewList}
              >
                {[...selected].slice(0, 5).map(id => {
                  const h = HABITS.find(h => h.id === id)
                  return (
                    <div key={id} style={styles.previewRow}>
                      <div style={styles.previewCheck}>
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.5">
                          <polyline points="1.5,5 4,7.5 8.5,2.5" />
                        </svg>
                      </div>
                      <span style={styles.previewName}>{h.icon} {h.name}</span>
                    </div>
                  )
                })}
                {selected.size > 5 && (
                  <div style={styles.previewMore}>+{selected.size - 5} more</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div style={styles.leftFoot}>
            Already have an account?{' '}
            <Link to="/login" style={styles.leftLink}>Sign in</Link>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={styles.right}>
          <AnimatePresence mode="wait">

            {/* STEP 1 — Habit picker */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={styles.stepWrap}
              >
                <div style={styles.stepDots}>
                  <div style={{ ...styles.dot, background: '#6BA80A' }} />
                  <div style={{ ...styles.dot, background: '#E4DFD4' }} />
                </div>

                <div style={styles.habitGrid}>
                  {HABITS.map((h, i) => (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => toggle(h.id)}
                      style={{
                        ...styles.habitCard,
                        ...(selected.has(h.id) ? styles.habitCardOn : {})
                      }}
                    >
                      {selected.has(h.id) && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={styles.habitTick}>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2.5">
                            <polyline points="1.5,5 4,7.5 8.5,2.5" />
                          </svg>
                        </motion.div>
                      )}
                      <div style={styles.habitIcon}>{h.icon}</div>
                      <div style={styles.habitName}>{h.name}</div>
                      <div style={styles.habitCat}>{h.cat}</div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  style={styles.energyMsg}
                  key={selected.size}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {ENERGY_MSGS[Math.min(selected.size, 12)]}
                </motion.div>

                <button
                  onClick={handleNext}
                  disabled={selected.size === 0}
                  style={{
                    ...styles.primaryBtn,
                    opacity: selected.size === 0 ? 0.4 : 1,
                    cursor: selected.size === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Lock in {selected.size > 0 ? `${selected.size} habit${selected.size !== 1 ? 's' : ''}` : 'habits'} →
                </button>
              </motion.div>
            )}

            {/* STEP 2 — Account form */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={styles.stepWrap}
              >
                <div style={styles.stepDots}>
                  <div style={{ ...styles.dot, background: '#6BA80A' }} />
                  <div style={{ ...styles.dot, background: '#6BA80A' }} />
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.label}>Your name</div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.name ? '#E5534B' : '#E0DBD0' }}
                    placeholder="Mukund" value={form.name}
                    onChange={e => handleChange('name', e.target.value)}
                    onFocus={e => e.target.style.borderColor = fieldErrors.name ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('name'); e.target.style.borderColor = fieldErrors.name ? '#E5534B' : '#E0DBD0' }}
                    autoFocus />
                  <AnimatePresence>
                    {fieldErrors.name && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>{fieldErrors.name}</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.label}>Email address</div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.email ? '#E5534B' : '#E0DBD0' }}
                    type="email" placeholder="you@email.com" value={form.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onFocus={e => e.target.style.borderColor = fieldErrors.email ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('email'); e.target.style.borderColor = fieldErrors.email ? '#E5534B' : '#E0DBD0' }} />
                  <AnimatePresence>
                    {fieldErrors.email && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>
                        {fieldErrors.email}
                        {fieldErrors.email.includes('already registered') && (
                          <> <Link to="/login" style={{ color: '#6BA80A', textDecoration: 'underline' }}>Sign in →</Link></>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.label}>Create password</div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.password ? '#E5534B' : '#E0DBD0' }}
                    type="password" placeholder="Min 6 characters" value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    onFocus={e => e.target.style.borderColor = fieldErrors.password ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('password'); e.target.style.borderColor = fieldErrors.password ? '#E5534B' : '#E0DBD0' }} />
                  <AnimatePresence>
                    {fieldErrors.password && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>{fieldErrors.password}</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div style={styles.formGroup}>
                  <div style={styles.label}>Confirm password</div>
                  <input
                    style={{ ...styles.input, borderColor: fieldErrors.confirmPassword ? '#E5534B' : form.confirmPassword && !fieldErrors.confirmPassword ? '#5B9A2F' : '#E0DBD0' }}
                    type="password" placeholder="Re-enter password" value={form.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    onFocus={e => e.target.style.borderColor = fieldErrors.confirmPassword ? '#E5534B' : '#6BA80A'}
                    onBlur={e => { handleBlur('confirmPassword'); }} />
                  <AnimatePresence>
                    {fieldErrors.confirmPassword && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={styles.fieldError}>{fieldErrors.confirmPassword}</motion.div>
                    )}
                    {form.confirmPassword && !fieldErrors.confirmPassword && form.password === form.confirmPassword && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ ...styles.fieldError, color: '#5B9A2F' }}>✓ Passwords match</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {globalError && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={styles.errorMsg}>
                      {globalError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)} style={styles.backBtn}>← Back</button>
                  <motion.button
                    onClick={handleSubmit}
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    style={{ ...styles.primaryBtn, flex: 1, opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Creating ritual...' : 'Begin your ritual →'}
                  </motion.button>
                </div>

                <div style={styles.termsNote}>
                  By signing up you agree to our terms and privacy policy.
                </div>
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
  shell: { width: '100%', maxWidth: 960, minHeight: 620, background: '#FDFCF9', border: '0.5px solid #E4DFD4', borderRadius: 20, display: 'flex', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  left: { width: 320, flexShrink: 0, background: '#1A1714', padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  leftLogo: { fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: '#F5F2EC', display: 'flex', alignItems: 'center', gap: 7 },
  logoDot: { width: 8, height: 8, background: '#6BA80A', borderRadius: '50%' },
  leftCenter: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 32 },
  leftEyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#5A5652', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 },
  leftHeadline: { fontFamily: "'Syne', sans-serif", fontSize: 40, fontWeight: 800, color: '#F5F2EC', lineHeight: 1, letterSpacing: '-1.5px', marginBottom: 14 },
  leftSub: { fontSize: 13, color: '#6A6662', lineHeight: 1.6 },
  previewList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 },
  previewRow: { display: 'flex', alignItems: 'center', gap: 10 },
  previewCheck: { width: 18, height: 18, background: '#6BA80A', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  previewName: { fontSize: 13, color: '#8A8480' },
  previewMore: { fontSize: 11, color: '#5A5652', fontFamily: "'JetBrains Mono', monospace", paddingLeft: 28 },
  leftFoot: { fontSize: 12, color: '#4A4642' },
  leftLink: { color: '#6BA80A', textDecoration: 'none', fontWeight: 500 },
  right: { flex: 1, padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' },
  stepWrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  stepDots: { display: 'flex', gap: 6, marginBottom: 4 },
  dot: { width: 24, height: 4, borderRadius: 2, transition: 'background 0.3s' },
  habitGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  habitCard: { background: '#F2EFE8', border: '0.5px solid #E0DBD0', borderRadius: 10, padding: '12px 6px', textAlign: 'center', cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s, background 0.15s', userSelect: 'none' },
  habitCardOn: { background: '#EAF3DE', borderColor: '#6BA80A' },
  habitTick: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, background: '#6BA80A', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  habitIcon: { fontSize: 20, marginBottom: 4, lineHeight: 1 },
  habitName: { fontSize: 11, fontWeight: 500, color: '#1A1714', marginBottom: 2 },
  habitCat: { fontSize: 9, color: '#A8A29C', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' },
  energyMsg: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6BA80A', textAlign: 'center', minHeight: 18 },
  primaryBtn: { background: '#1A1714', color: '#F5F2EC', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', letterSpacing: '0.01em', transition: 'transform 0.1s' },
  backBtn: { background: 'transparent', border: '0.5px solid #E0DBD0', borderRadius: 9, padding: '13px 18px', fontSize: 13, color: '#8A8480', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A8A29C', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { background: '#F2EFE8', border: '0.5px solid #E0DBD0', borderRadius: 8, padding: '11px 13px', fontSize: 14, color: '#1A1714', fontFamily: "'DM Sans', sans-serif", width: '100%', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' },
  errorMsg: { fontSize: 12, color: '#C0392B', background: '#FDECEA', border: '0.5px solid #F5C6C6', borderRadius: 7, padding: '9px 13px' },
  fieldError: { fontSize: 11, color: '#C0392B', marginTop: -2, paddingLeft: 2, fontFamily: "'DM Sans', sans-serif" },
  termsNote: { fontSize: 11, color: '#C0BAB2', textAlign: 'center' },
}
