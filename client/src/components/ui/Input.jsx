import { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({
  label,
  error,
  hint,
  className = '',
  containerStyle,
  ...props
}, ref) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...containerStyle }}>
      {label && (
        <label style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
        }}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`input-base ${className}`}
        {...props}
      />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--red)', fontFamily: 'var(--font-body)' }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
