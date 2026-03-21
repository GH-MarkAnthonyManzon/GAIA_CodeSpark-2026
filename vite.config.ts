import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/GAIA_CodeSpark-2026/',
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      'process.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(process.env.VITE_OPENWEATHER_API_KEY || env.VITE_OPENWEATHER_API_KEY || ''),
      'process.env.OPENWEATHER_API_KEY': JSON.stringify(process.env.OPENWEATHER_API_KEY || env.OPENWEATHER_API_KEY || ''),
      'process.env.VITE_OPENWEATHER_': JSON.stringify(process.env.VITE_OPENWEATHER_ || env.VITE_OPENWEATHER_ || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
