import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://yeyo.games',
  vite: { plugins: [tailwindcss()] },
});
