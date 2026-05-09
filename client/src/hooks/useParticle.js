import { useCallback } from 'react';

/**
 * useParticle - returns a function that bursts particles from a given DOM element or position
 */
export function useParticle() {
  const burst = useCallback((originEl, options = {}) => {
    const {
      count = 10,
      color = '#C8F135',
      size = 5,
      spread = 60,
      duration = 500,
    } = options;

    let originX, originY;

    if (originEl && originEl.getBoundingClientRect) {
      const rect = originEl.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
    } else if (typeof originEl === 'object' && originEl.x != null) {
      originX = originEl.x;
      originY = originEl.y;
    } else {
      originX = window.innerWidth / 2;
      originY = window.innerHeight / 2;
    }

    const particles = [];

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      const angle = (360 / count) * i;
      const velocity = spread * (0.6 + Math.random() * 0.4);

      Object.assign(particle.style, {
        position: 'fixed',
        left: `${originX}px`,
        top: `${originY}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: color,
        pointerEvents: 'none',
        zIndex: '99999',
        transform: 'translate(-50%, -50%)',
        boxShadow: `0 0 6px ${color}`,
      });

      document.body.appendChild(particle);
      particles.push({ el: particle, angle, velocity });

      const rad = (angle * Math.PI) / 180;
      const destX = originX + Math.cos(rad) * velocity;
      const destY = originY + Math.sin(rad) * velocity;

      const start = performance.now();

      const animate = (timestamp) => {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        const currentX = originX + (destX - originX) * eased;
        const currentY = originY + (destY - originY) * eased;
        const opacity = 1 - progress;
        const scale = 1 - progress * 0.5;

        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;
        particle.style.opacity = opacity;
        particle.style.transform = `translate(-50%, -50%) scale(${scale})`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          particle.remove();
        }
      };

      requestAnimationFrame(animate);
    }
  }, []);

  return { burst };
}

export default useParticle;
