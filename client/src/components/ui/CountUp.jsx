import useCountUp from '../../hooks/useCountUp';

export default function CountUp({ value, suffix = '', prefix = '', decimals = 0, duration = 1200, className = '', style = {} }) {
  const count = useCountUp(value, duration);
  const formatted = decimals > 0 ? (count / Math.pow(10, decimals)).toFixed(decimals) : count;

  return (
    <span className={className} style={{ fontFamily: 'var(--font-mono)', ...style }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
