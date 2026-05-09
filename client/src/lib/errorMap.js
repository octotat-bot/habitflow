/**
 * errorMap.js — Converts raw Axios errors into specific, human-readable messages.
 * Import this anywhere a form calls an API.
 */

// ── Map server field-path to a friendly label ─────────────
const FIELD_LABELS = {
  email:    'email',
  password: 'password',
  name:     'name',
};

/**
 * mapAuthError(err, context)
 * Returns { global, fields } where:
 *  - global: string (banner-level error)
 *  - fields: { email?, password?, name?, confirmPassword? }
 */
export function mapAuthError(err, context = 'login') {
  const status  = err.response?.status;
  const message = err.response?.data?.error || '';
  const errors  = err.response?.data?.errors; // express-validator array

  // ── No response = network / server down ───────────────
  if (!err.response) {
    return {
      global: "Can't reach the server. Check your internet connection.",
      fields: {},
    };
  }

  // ── Rate limited ──────────────────────────────────────
  if (status === 429) {
    return {
      global: 'Too many attempts. Please wait 15 minutes before trying again.',
      fields: {},
    };
  }

  // ── Express-validator field errors (array) ────────────
  if (Array.isArray(errors) && errors.length > 0) {
    const fields = {};
    for (const e of errors) {
      const path = e.path || e.param;
      if (path === 'email')    fields.email    = e.msg;
      if (path === 'password') fields.password = e.msg;
      if (path === 'name')     fields.name     = e.msg;
    }
    return { global: '', fields };
  }

  // ── Single server message → map to specific field ─────
  const lower = message.toLowerCase();

  if (context === 'login') {
    if (status === 401) {
      return {
        global: '',
        fields: {
          password: 'Incorrect email or password. Please try again.',
        },
      };
    }
    if (lower.includes('email')) {
      return { global: '', fields: { email: message } };
    }
  }

  if (context === 'register') {
    if (status === 409 || lower.includes('already registered') || lower.includes('already exist')) {
      return {
        global: '',
        fields: {
          email: 'This email is already registered. Sign in instead?',
        },
      };
    }
  }

  if (lower.includes('password')) {
    return { global: '', fields: { password: message } };
  }
  if (lower.includes('email')) {
    return { global: '', fields: { email: message } };
  }
  if (lower.includes('name')) {
    return { global: '', fields: { name: message } };
  }

  // ── Fallback ──────────────────────────────────────────
  return {
    global: message || (context === 'login' ? 'Sign in failed. Please try again.' : 'Sign up failed. Please try again.'),
    fields: {},
  };
}

/**
 * mapHabitError(err)
 * Returns a human-readable string for habit create/update errors.
 */
export function mapHabitError(err) {
  if (!err.response) return "Can't reach the server. Check your connection.";
  const status  = err.response?.status;
  const message = err.response?.data?.error || '';
  if (status === 429) return 'Too many requests. Please slow down.';
  if (status === 401) return 'Your session expired. Please sign in again.';
  if (message) return message;
  return 'Failed to save habit. Please try again.';
}

/**
 * Client-side validators — call before hitting the API.
 * Returns an errors object (empty = valid).
 */
export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "That doesn't look like a valid email.";
  }
  if (!password) {
    errors.password = 'Please enter your password.';
  }
  return errors;
}

export function validateSignupForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!name.trim()) {
    errors.name = 'Please enter your name.';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "That doesn't look like a valid email.";
  }
  if (!password) {
    errors.password = 'Please create a password.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  if (confirmPassword !== undefined) {
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }
  }
  return errors;
}

export function validateHabitForm(form) {
  const errors = {};
  if (!form.name?.trim()) {
    errors.name = 'Give your habit a name.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Habit name must be at least 2 characters.';
  } else if (form.name.trim().length > 100) {
    errors.name = 'Habit name is too long (max 100 characters).';
  }
  if (form.habitType === 'duration') {
    const d = Number(form.targetDuration);
    if (!d || d < 1)   errors.targetDuration = 'Set a duration of at least 1 minute.';
    if (d > 480)       errors.targetDuration = 'Maximum duration is 480 minutes (8 hours).';
  }
  if (form.habitType === 'quantity') {
    const q = Number(form.targetQuantity);
    if (!q || q < 1)  errors.targetQuantity = 'Set a target of at least 1.';
    if (q > 999)      errors.targetQuantity = 'Maximum target is 999.';
  }
  if (form.reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.reminderTime)) {
    errors.reminderTime = 'Use HH:MM format, e.g. "07:30".';
  }
  if (form.frequency === 'custom' && (!form.targetDaysOfWeek || form.targetDaysOfWeek.length === 0)) {
    errors.targetDaysOfWeek = 'Pick at least one day.';
  }
  if (form.frequency === 'x_per_week') {
    const t = Number(form.timesPerWeek);
    if (!t || t < 1) errors.timesPerWeek = 'Set a weekly target of at least 1.';
    if (t > 7)       errors.timesPerWeek = 'Maximum is 7 times per week.';
  }
  return errors;
}
