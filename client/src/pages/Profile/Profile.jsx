import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserStore from '../../stores/userStore';
import useHabitStore from '../../stores/habitStore';
import XPBar from '../../components/ui/XPBar';
import Modal from '../../components/ui/Modal';
import PageTransition from '../../components/layout/PageTransition';
import RitualDNACard from '../../components/profile/RitualDNACard';
import { ProfileSkeleton } from '../../components/ui/Skeletons';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDaysSince } from '../../lib/dateUtils';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = { Mind: '#A78BFA', Body: '#2DD4BF', Work: '#F5A623', Social: '#F472B6', Creative: '#FB923C', Finance: '#34D399', Spirit: '#A5B4FC', Custom: '#7A7772' };

export default function Profile() {
  const { user, updateProfile, logout, fetchUser } = useUserStore();
  const navigate = useNavigate();
  const { habits } = useHabitStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [theme, setTheme] = useState(user?.theme || 'obsidian');
  const avatarRef = useRef(null);

  if (!user) return (
    <PageTransition>
      <div className="page-content"><ProfileSkeleton /></div>
    </PageTransition>
  );

  const activeHabits = habits.filter(h => !h.isArchived);
  const daysSinceJoined = getDaysSince(user.createdAt);

  // Category donut
  const categoryData = Object.entries(
    activeHabits.reduce((acc, h) => { acc[h.category] = (acc[h.category] || 0) + 1; return acc; }, {})
  ).map(([cat, count]) => ({ name: cat, value: count }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await updateProfile({ avatarBase64: ev.target.result });
        toast.success('Avatar updated');
      } catch { toast.error('Failed to update avatar'); }
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await updateProfile({ name });
      setEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
    setLoading(false);
  };

  const toggleTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t === 'ivory' ? 'ivory' : '');
    updateProfile({ theme: t });
  };

  const handleExport = async () => {
    try {
      const { data } = await api.get('/profile/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'habitflow-export.json';
      a.click();
      toast.success('Data exported!');
    } catch { toast.error('Export failed'); }
  };

  const handleDelete = async () => {
    try {
      await api.delete('/profile');
      logout();
      navigate('/login');
    } catch { toast.error('Failed to delete account'); }
  };

  return (
    <PageTransition>
      <div className="page-content">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 6 }}>YOUR PROFILE</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>Profile</h1>
        </div>

        {/* Ritual DNA Card */}
        <RitualDNACard />

        {/* Profile Card */}
        <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div style={{ padding: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
              <div
                onClick={() => avatarRef.current?.click()}
                style={{ position: 'relative', cursor: 'none' }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  border: '3px solid var(--accent)',
                  overflow: 'hidden', background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)',
                  boxShadow: 'var(--shadow-accent)',
                }}>
                  {user.avatarBase64
                    ? <img src={user.avatarBase64} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : user.name?.[0]?.toUpperCase()
                  }
                </div>
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />

              <div>
                {editing ? (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      className="input-base"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700 }}
                    />
                    <button onClick={saveProfile} disabled={loading} style={{ padding: '6px 14px', background: 'var(--accent)', color: 'var(--bg-base)', border: 'none', borderRadius: 6, cursor: 'none', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13 }}>
                      {loading ? '...' : 'Save'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-primary)' }}>{user.name}</span>
                    <button onClick={() => { setEditing(true); setName(user.name); }} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'none', fontSize: 14 }}>✏️</button>
                  </div>
                )}
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user.email}</div>
              </div>
            </div>

            {/* XP Bar */}
            <XPBar />

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20 }}>
              {[
                { label: 'Total Completions', value: (user.totalHabitsCompleted || habits.reduce((s, h) => s + (h.totalCompletions || 0), 0)).toLocaleString() },
                { label: 'Longest Streak', value: `${user.longestStreakEver || 0}d` },
                { label: 'Days Active', value: `${daysSinceJoined}d` },
                { label: 'Habits Created', value: habits.length },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Donut */}
          <div style={{ padding: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 16 }}>HABIT CATEGORIES</div>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[entry.name] || '#444'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categoryData.map(entry => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[entry.name] || '#444' }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No habits yet.</div>
            )}
          </div>
        </div>

        {/* Settings */}
        <div style={{ padding: 28, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '0.1em', marginBottom: 20 }}>SETTINGS</div>

          {/* Theme */}
          <SettingRow label="App Theme">
            <div style={{ display: 'flex', gap: 10 }}>
              {[{ key: 'obsidian', label: '◼ Obsidian', dark: true }, { key: 'ivory', label: '◻ Ivory', dark: false }].map(t => (
                <button
                  key={t.key}
                  onClick={() => toggleTheme(t.key)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${theme === t.key ? 'var(--accent)' : 'var(--border-subtle)'}`, background: theme === t.key ? 'var(--accent-glow)' : 'transparent', color: theme === t.key ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'none' }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />

          <SettingRow label="Export Data">
            <button onClick={handleExport} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'none' }}>
              ↓ Download JSON
            </button>
          </SettingRow>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />

          <SettingRow label="Sign Out">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </SettingRow>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />

          <SettingRow label="Delete Account">
            <button onClick={() => setDeleteModal(true)} style={{ padding: '8px 16px', background: 'rgba(255,76,76,0.1)', border: '1px solid rgba(255,76,76,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--red)', fontSize: 13, fontFamily: 'var(--font-body)', cursor: 'none' }}>
              Delete Account
            </button>
          </SettingRow>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
          This will permanently delete your account, all habits, and all completion history. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setDeleteModal(false)} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'none', fontFamily: 'var(--font-body)' }}>Cancel</button>
          <button onClick={handleDelete} style={{ flex: 1, padding: 12, background: 'var(--red)', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'none', fontFamily: 'var(--font-body)', fontWeight: 600 }}>Delete Forever</button>
        </div>
      </Modal>
    </PageTransition>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="setting-row-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
      {children}
    </div>
  );
}
