/**
 * tabStorage — sessionStorage wrapper for auth-related data.
 * sessionStorage is FULLY TAB-ISOLATED: each browser tab gets its
 * own independent storage, so multiple users can be logged in
 * simultaneously in different tabs without interfering.
 *
 * Use this for: auth tokens, session flags (e.g. onboarding per tab)
 * Use localStorage for: user-keyed preferences that should persist across sessions
 */

export const tabStorage = {
  get: (key) => {
    try { return sessionStorage.getItem(key); }
    catch { return null; }
  },
  set: (key, value) => {
    try { sessionStorage.setItem(key, value); }
    catch { /* quota exceeded — ignore */ }
  },
  remove: (key) => {
    try { sessionStorage.removeItem(key); }
    catch { /* ignore */ }
  },
};

/**
 * userStorage — localStorage helper that namespaces all keys by userId.
 * Ensures User A's journal/onboarding/freeze data never touches User B's.
 *
 * Usage: userStorage(userId).get('journal')
 */
export function userStorage(userId) {
  const ns = userId ? `hf_${userId}` : 'hf_anon';
  return {
    get: (key) => {
      try { return localStorage.getItem(`${ns}_${key}`); }
      catch { return null; }
    },
    set: (key, value) => {
      try { localStorage.setItem(`${ns}_${key}`, value); }
      catch { /* ignore */ }
    },
    remove: (key) => {
      try { localStorage.removeItem(`${ns}_${key}`); }
      catch { /* ignore */ }
    },
  };
}
