import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const libraryEntry = fileURLToPath(new URL('./src/index.js', import.meta.url))
const textureUrls = [
  './assets/textures/earth-clouds.webp',
  './assets/textures/earth-day.webp',
  './assets/textures/earth-night.webp',
  './assets/textures/earth-normal.webp',
  './assets/textures/earth-specular.webp',
]

function preserveLibraryTextureUrls() {
  return {
    name: 'preserve-library-texture-urls',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/Earth.jsx') && !id.endsWith('\\src\\Earth.jsx')) {
        return null
      }

      let next = code

      for (const url of textureUrls) {
        next = next.replaceAll(
          `new URL("${url}", import.meta.url).href`,
          `__REACT_EARTH_LITE_ASSET_URL__("${url}")`,
        )
      }

      return next === code ? null : { code: next, map: null }
    },
    renderChunk(code) {
      return code.replace(
        /__REACT_EARTH_LITE_ASSET_URL__\("([^"]+)"\)/g,
        'new URL("$1", import.meta.url).href',
      )
    },
  }
}

export default defineConfig(({ command, mode }) => ({
  copyPublicDir: mode === 'demo',
  plugins: [
    command === 'build' && mode !== 'demo' ? preserveLibraryTextureUrls() : null,
    react(),
  ].filter(Boolean),
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
