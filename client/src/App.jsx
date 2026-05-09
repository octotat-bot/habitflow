import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout (never lazy — always needed)
import AppShell from './components/layout/AppShell';

// Lazy-loaded pages — each becomes its own JS chunk
const Login         = lazy(() => import('./pages/Auth/Login'));
const Signup        = lazy(() => import('./pages/Auth/Signup'));
const Dashboard     = lazy(() => import('./pages/Dashboard/Dashboard'));
const HabitsPage    = lazy(() => import('./pages/Habits/Habits'));
const HabitDetail   = lazy(() => import('./pages/Habits/HabitDetail'));
const Stats         = lazy(() => import('./pages/Stats/Stats'));
const Streaks       = lazy(() => import('./pages/Streaks/Streaks'));
const Journal       = lazy(() => import('./pages/Journal/Journal'));
const Profile       = lazy(() => import('./pages/Profile/Profile'));
const Achievements  = lazy(() => import('./pages/Achievements/Achievements'));
const WeeklyDigest  = lazy(() => import('./pages/Stats/WeeklyDigest'));
const NotFound      = lazy(() => import('./pages/NotFound'));

// Minimal inline fallback — no external dep needed
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border-subtle)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected — wrapped in AppShell */}
          <Route element={<AppShell />}>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/habits"     element={<HabitsPage />} />
            <Route path="/habits/:id" element={<HabitDetail />} />
            <Route path="/analytics"  element={<Stats />} />
            <Route path="/streaks"    element={<Streaks />} />
            <Route path="/journal"    element={<Journal />} />
            <Route path="/profile"    element={<Profile />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/weekly"     element={<WeeklyDigest />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
