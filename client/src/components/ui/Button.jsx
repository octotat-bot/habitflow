import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const Button = forwardRef(({
  children,
  variant = 'accent',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const variants = {
    accent: 'btn btn-accent',
    ghost: 'btn btn-ghost',
    danger: 'btn btn-danger',
  };

  const sizes = {
    sm: { padding: '6px 14px', fontSize: '12px' },
    md: { padding: '10px 20px', fontSize: '14px' },
    lg: { padding: '14px 28px', fontSize: '16px' },
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      className={`${variants[variant]} ${className}`}
      style={sizes[size]}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SpinnerIcon />
          {children}
        </span>
      ) : children}
    </motion.button>
  );
});

Button.displayName = 'Button';

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

export default Button;
