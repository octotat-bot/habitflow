import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline  = () => {
      setOffline(false);
      setJustCameBack(true);
      setTimeout(() => setJustCameBack(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(offline || justCameBack) && (
        <motion.div
          key={offline ? 'offline' : 'online'}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed', top: 58, left: '50%', transform: 'translateX(-50%)',
            zIndex: 10000,
            background: offline ? '#1A1916' : '#5B9A2F',
            color: 'white',
            padding: '8px 20px',
            borderRadius: 99,
            fontSize: 12, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          <span>{offline ? '🔴' : '🟢'}</span>
          {offline ? 'No internet connection — changes will be saved when you reconnect'
                   : 'Back online ✓'}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
