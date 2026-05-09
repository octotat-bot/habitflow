import { useEffect, useRef } from 'react';

/**
 * Premium custom cursor — always visible, no disappearing.
 * Uses direct DOM manipulation + rAF for zero-lag tracking.
 * CSS sets cursor:none globally, so this is the only cursor.
 */
export default function CustomCursor() {
  const dotRef   = useRef(null);
  const ringRef  = useRef(null);
  const pos      = useRef({ x: -200, y: -200 });
  const ring     = useRef({ x: -200, y: -200 });
  const hovering = useRef(false);
  const visible  = useRef(false);
  const rafId    = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ringEl = ringRef.current;
    if (!dot || !ringEl) return;

    // ─── mouse tracking ──────────────────────────────────────
    const onMove = (e) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        dot.style.opacity   = '1';
        ringEl.style.opacity = '1';
      }
    };

    const onLeave = () => {
      visible.current = false;
      dot.style.opacity   = '0';
      ringEl.style.opacity = '0';
    };

    const onEnter = () => {
      visible.current = true;
      dot.style.opacity   = '1';
      ringEl.style.opacity = '1';
    };

    // ─── interactive element detection ────────────────────────
    const onOver = (e) => {
      hovering.current = !!e.target.closest(
        'button, a, input, textarea, select, label, [role="button"], [data-interactive]'
      );
    };

    const onDown = () => { dot.classList.add('clicking');   ringEl.classList.add('clicking');   };
    const onUp   = () => { dot.classList.remove('clicking'); ringEl.classList.remove('clicking'); };

    window.addEventListener('mousemove',  onMove,  { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('mouseenter', onEnter);
    window.addEventListener('mouseover',  onOver,  { passive: true });
    window.addEventListener('mousedown',  onDown);
    window.addEventListener('mouseup',    onUp);

    // ─── animation loop ───────────────────────────────────────
    const lerp = (a, b, t) => a + (b - a) * t;
    const RING_SPEED = 0.12;

    const animate = () => {
      // Dot snaps instantly
      dot.style.transform = `translate(${pos.current.x - 4}px, ${pos.current.y - 4}px)`;

      // Ring lags behind
      ring.current.x = lerp(ring.current.x, pos.current.x, RING_SPEED);
      ring.current.y = lerp(ring.current.y, pos.current.y, RING_SPEED);
      ringEl.style.transform = `translate(${ring.current.x - 18}px, ${ring.current.y - 18}px) ${hovering.current ? 'scale(1.5)' : 'scale(1)'}`;

      // Toggle hover class
      if (hovering.current) {
        dot.classList.add('hovering');
        ringEl.classList.add('hovering');
      } else {
        dot.classList.remove('hovering');
        ringEl.classList.remove('hovering');
      }

      rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mouseenter', onEnter);
      window.removeEventListener('mouseover',  onOver);
      window.removeEventListener('mousedown',  onDown);
      window.removeEventListener('mouseup',    onUp);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      {/* Inner dot — snaps */}
      <div ref={dotRef} style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99999,
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--accent)',
        pointerEvents: 'none',
        willChange: 'transform',
        transition: 'opacity 0.2s, background 0.15s',
        opacity: 0,
        mixBlendMode: 'normal',
      }} />
      {/* Outer ring — with lag */}
      <div ref={ringRef} style={{
        position: 'fixed', top: 0, left: 0, zIndex: 99998,
        width: 36, height: 36, borderRadius: '50%',
        border: '1.5px solid var(--accent)',
        pointerEvents: 'none',
        willChange: 'transform',
        transition: 'opacity 0.2s, border-color 0.15s, border-width 0.15s',
        opacity: 0,
      }} />
      <style>{`
        * { cursor: none !important; }
        .custom-cursor-dot.hovering   { background: #fff !important; }
        .custom-cursor-ring.hovering  { border-color: #fff !important; border-width: 2px !important; }
        .custom-cursor-dot.clicking   { transform: scale(0.7) !important; }
        .custom-cursor-ring.clicking  { border-width: 3px !important; }
      `}</style>
    </>
  );
}
