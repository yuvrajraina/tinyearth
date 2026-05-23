# React Earth Lite

A tiny open-source Earth object for React Three Fiber. The default globe uses compressed NASA-derived textures for a realistic Blue Marble-style Earth while keeping runtime dependencies limited to React, Three, and React Three Fiber.

## Goals

- JS package size under 10 KB gzipped, excluding peer dependencies
- Default texture payload under 500 KB to 1 MB total
- Default draw calls: 2; 3 with atmosphere; 4 with atmosphere and markers
- Default geometry capped at 64 x 32 sphere segments
- Default GPU texture memory target under 20 MB
- No controls, postprocessing, optional dependencies, 8K assets, or globe framework

## Install

```bash
npm install react-earth-lite three @react-three/fiber
```

Or install a GitHub Release tarball:

```bash
npm install https://github.com/yuvrajraina/tinyearth/releases/download/v0.1.0/react-earth-lite-0.1.0.tgz
```

## Usage

```jsx
import { Canvas } from "@react-three/fiber";
import Earth from "react-earth-lite";

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 3.2], fov: 42 }} dpr={[1, 1.5]}>
      <Earth radius={1} rotationSpeed={0.026} />
    </Canvas>
  );
}
```

Named imports work too:

```jsx
import { Earth } from "react-earth-lite";
```

## Custom Textures

```jsx
<Earth
  texturePaths={{
    day: "/textures/earth-day.webp",
    clouds: "/textures/clouds-alpha.webp",
    night: "/textures/night-lights.webp",
    normal: "/textures/earth-normal.webp",
    specular: "/textures/ocean-specular.webp",
  }}
/>
```

Use equirectangular 2:1 textures. The bundled defaults are `1024x512` for day, clouds, and night maps, with smaller support maps for normal and specular detail.

## Markers

```jsx
<Earth
  markers={[
    { lat: 40.7128, lng: -74.006, color: "#ffd166" },
    { lat: 28.6139, lng: 77.209, color: "#7dd3fc" },
  ]}
/>
```

Markers are rendered with one instanced draw call.

## Core Props

| Prop | Default | Notes |
| --- | --- | --- |
| `radius` | `1` | Globe radius in scene units |
| `rotationSpeed` | `0.026` | Earth radians per second |
| `cloudRotationSpeed` | `0.018` | Cloud layer radians per second |
| `quality` | `"auto"` | `"low"`, `"medium"`, `"high"`, or `"auto"` |
| `segments` | Auto | Clamped to max `64 x 32` |
| `texturePaths` | Bundled maps | Overrides realistic default maps |
| `clouds` | `true` | Transparent rotating cloud layer |
| `atmosphere` | `false` | Optional additive rim shader |
| `nightLights` | `true` | Night-side city lights |
| `normalMap` | `true` | Terrain normal perturbation |
| `specular` | `false` | Optional ocean specular shine |
| `markers` | `[]` | Array of `{ lat, lng, color, size }` |
| `reducedMotion` | `"auto"` | Honors `prefers-reduced-motion` by default |

## Texture Sources

The bundled maps are resized and compressed derivatives of NASA Earth imagery:

- Blue Marble Next Generation base map: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/
- Blue Marble clouds: https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/57750l
- Black Marble night lights: https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
- Blue Marble topography and bathymetry: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/topography-bathymetry-maps/
- NASA media usage guidelines: https://www.nasa.gov/multimedia/guidelines/index.html


The package tarball contains the ESM bundle, TypeScript declarations, NASA-derived WebP texture assets, README, changelog, and MIT license. See `RELEASE.md` for the GitHub tag workflow.

## License

MIT. The bundled texture assets are derived from NASA imagery; see the texture source links above and NASA media usage guidelines.
