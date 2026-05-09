import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    // ── Dev server ────────────────────────────────────────
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },

    // ── Production build optimizations ────────────────────
    build: {
      outDir: 'dist',
      sourcemap: false,          // disable in prod for security
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React runtime — cached longest
            'react-vendor': ['react', 'react-dom'],
            // Router
            'router':       ['react-router-dom'],
            // Animation
            'motion':       ['framer-motion'],
            // Charts (heaviest — isolate for better caching)
            'recharts':     ['recharts'],
            // State management
            'zustand':      ['zustand'],
          },
        },
      },
    },

    // ── Preview server (for `vite preview` in CI/staging) ─
    preview: {
      port: 4173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
  };
});
