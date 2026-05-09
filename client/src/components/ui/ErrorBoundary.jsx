import { Component } from 'react';

// ── Error type detection ───────────────────────────────────
function classifyError(error) {
  const msg = error?.message?.toLowerCase() || '';
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('econnrefused')) {
    return {
      type: 'network',
      title: 'Connection lost',
      description: 'Unable to reach the server. Check your internet connection and try again.',
      action: 'Retry',
      icon: '⚡',
    };
  }
  if (msg.includes('chunkloaderror') || msg.includes('loading chunk') || msg.includes('importing')) {
    return {
      type: 'chunk',
      title: 'Update available',
      description: 'A new version of HabitFlow was deployed. Reload to get the latest version.',
      action: 'Reload App',
      icon: '↻',
    };
  }
  if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('token')) {
    return {
      type: 'auth',
      title: 'Session expired',
      description: 'Your session has expired. Please sign in again to continue.',
      action: 'Sign In',
      icon: '🔑',
    };
  }
  return {
    type: 'app',
    title: 'Something went wrong',
    description: 'An unexpected error occurred in the app. Your data is safe — this is a UI issue only.',
    action: 'Try Again',
    icon: null,
  };
}

// ── Short fingerprint for error ID ────────────────────────
function errorFingerprint(error) {
  const str = (error?.message || '') + (error?.stack?.slice(0, 80) || '');
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return (Math.abs(h) >>> 0).toString(16).toUpperCase().slice(0, 6);
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to console in all envs (structured)
    console.group('[ErrorBoundary] Unhandled React error');
    console.error('Error:', error.message);
    console.error('Component stack:', errorInfo?.componentStack);
    console.groupEnd();
  }

  handleAction(type) {
    if (type === 'auth') {
      sessionStorage.removeItem('hf_token');
      window.location.href = '/login';
    } else if (type === 'chunk') {
      window.location.reload();
    } else {
      // Reset state — React will re-render children
      this.setState({ error: null, errorInfo: null, showDetails: false });
    }
  }

  render() {
    const { error, errorInfo, showDetails } = this.state;

    if (!error) return this.props.children;

    const { type, title, description, action, icon } = classifyError(error);
    const fingerprint = errorFingerprint(error);
    const isDev = import.meta.env.DEV;

    return (
      <div style={{
        minHeight: '100vh',
        background: '#F7F5F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        padding: '32px 24px',
        textAlign: 'center',
      }}>

        {/* ── Logo ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 56 56" fill="none">
            <path d="M28 6C28 6 13 17 13 31C13 40.4 19.7 48 28 48C36.3 48 43 40.4 43 31C43 17 28 6 28 6Z" fill="#5B9A2F" opacity="0.7"/>
            <path d="M28 19C28 19 20 25 20 33C20 37.4 23.6 41 28 41C32.4 41 36 37.4 36 33C36 25 28 19 28 19Z" fill="#C3DE94" opacity="0.7"/>
          </svg>
          <span style={{ fontFamily: '"Syne", sans-serif', fontWeight: 800, fontSize: 16, color: '#1A1916', letterSpacing: '-0.02em' }}>
            HabitFlow
          </span>
        </div>

        {/* ── Error card ───────────────────────────────── */}
        <div style={{
          background: 'white',
          border: '1px solid #E8E4DC',
          borderRadius: 20,
          padding: '40px 40px 36px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>

          {/* Icon / visual */}
          {icon ? (
            <div style={{
              width: 56, height: 56,
              background: type === 'network' ? '#FFF8E7' : type === 'auth' ? '#F0F7FF' : '#FFF0F0',
              border: `1px solid ${type === 'network' ? '#F5D878' : type === 'auth' ? '#B3D4FF' : '#FFCCCC'}`,
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, margin: '0 auto 20px',
            }}>
              {icon}
            </div>
          ) : (
            <div style={{
              width: 56, height: 56,
              background: '#FFF0F0',
              border: '1px solid #FFCCCC',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
          )}

          <h1 style={{
            fontFamily: '"Syne", sans-serif',
            fontWeight: 800, fontSize: 22,
            color: '#1A1916',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h1>

          <p style={{
            color: '#6A6762', fontSize: 14,
            lineHeight: 1.65,
            margin: '0 0 28px',
          }}>
            {description}
          </p>

          {/* ── Error code ─────────────────────────────── */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#F5F3EE',
            border: '1px solid #E8E4DC',
            borderRadius: 6,
            padding: '4px 10px',
            marginBottom: 24,
          }}>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#A09C96', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Error
            </span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#5A5652', letterSpacing: '0.06em' }}>
              #{fingerprint}
            </span>
          </div>

          {/* ── Primary action ─────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => this.handleAction(type)}
              style={{
                background: '#1A1916',
                color: '#F5F4EF',
                border: 'none',
                borderRadius: 10,
                padding: '13px 24px',
                fontFamily: '"Syne", sans-serif',
                fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
                letterSpacing: '-0.01em',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              {action}
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'transparent',
                color: '#8A8582',
                border: '1px solid #E8E4DC',
                borderRadius: 10,
                padding: '11px 24px',
                fontFamily: '"DM Sans", sans-serif',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>

          {/* ── Dev: expandable error details ──────────── */}
          {isDev && (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <button
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10, color: '#A09C96',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ transition: 'transform 0.15s', display: 'inline-block', transform: showDetails ? 'rotate(90deg)' : 'none' }}>▶</span>
                {showDetails ? 'Hide' : 'Show'} error details
              </button>
              {showDetails && (
                <pre style={{
                  background: '#FFF0F0',
                  border: '1px solid #FFCCCC',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 10,
                  color: '#C0392B',
                  overflowX: 'auto',
                  lineHeight: 1.6,
                  margin: 0,
                  maxHeight: 200,
                  overflowY: 'auto',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {error.toString()}
                  {'\n\n'}
                  {errorInfo?.componentStack?.trim()}
                </pre>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ───────────────────────────────────── */}
        <p style={{
          marginTop: 24,
          fontSize: 12,
          color: '#BDB9B2',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.04em',
        }}>
          Your habit data is safe. This is a UI error only.
        </p>

      </div>
    );
  }
}
