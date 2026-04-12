import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          rt: path.resolve(__dirname, 'rt.html'),
          nt: path.resolve(__dirname, 'nt.html'),
          onet: path.resolve(__dirname, 'onet.html'),
        },
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var or in production mode.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: mode !== 'production' && process.env.DISABLE_HMR !== 'true',
    },
  };
});
