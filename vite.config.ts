import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Puerto fijo, también en preview, para que el origen siga siendo
// http://localhost:5173 y no se pierdan los datos guardados en localStorage.
const puerto = { port: 5173, strictPort: true };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: puerto,
  preview: puerto,
  test: {
    // Fuera de America/Bogota, para que las pruebas de fechas no pasen
    // solo porque el equipo ya está en esa zona.
    env: { TZ: 'Asia/Tokyo' },
    // Node 25 trae su propio localStorage y avisa si no tiene archivo; sin él, las pruebas usan el de jsdom.
    execArgv: ['--no-experimental-webstorage'],
  },
});
