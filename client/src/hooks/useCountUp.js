import { useState, useEffect, useRef } from 'react';

/**
 * useCountUp - animates a number from 0 to value on mount or when value changes.
 * @param {number} target - The target value
 * @param {number} duration - Animation duration in ms (default 1200)
 * @param {boolean} startOnMount - Whether to start on mount (default true)
 */
export function useCountUp(target, duration = 1200, startOnMount = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!startOnMount || target == null) return;

    const start = 0;
    const end = Number(target);

    if (isNaN(end)) return;

    const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

      setCount(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    startTimeRef.current = null;
    setCount(0);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, startOnMount]);

  return count;
}

export default useCountUp;
