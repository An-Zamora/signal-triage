/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo>/, so assets need a matching base.
// Locally (dev, preview, tests) the base is '/'.
const base = process.env.GITHUB_PAGES === 'true' ? '/signal-triage/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
