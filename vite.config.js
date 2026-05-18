import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const libraryEntry = fileURLToPath(new URL('./src/index.js', import.meta.url))

export default defineConfig(({ mode }) => ({
  copyPublicDir: mode === 'demo',
  plugins: [react()],
  build:
    mode === 'demo'
      ? undefined
      : {
          assetsInlineLimit: 0,
          emptyOutDir: true,
          lib: {
            entry: libraryEntry,
            fileName: 'react-earth-lite',
            formats: ['es'],
            name: 'ReactEarthLite',
          },
          rollupOptions: {
            external: ['react', 'react/jsx-runtime', 'three', '@react-three/fiber'],
          },
          sourcemap: false,
        },
}))
