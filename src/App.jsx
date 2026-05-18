import { Canvas } from "@react-three/fiber";
import Earth from "./Earth";
import "./App.css";

export default function App() {
  return (
    <main className="page">
      <section className="stage" aria-label="React Earth Lite preview">
        <Canvas
          camera={{ position: [0, 0, 3.25], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={0.65} />
          <directionalLight intensity={3.2} position={[4, 1.5, 3]} />
          <Earth position={[0.55, 0, 0]} radius={1} />
        </Canvas>
        <div className="panel">
          <p className="eyebrow">React Earth Lite</p>
          <h1>Open-source Earth object</h1>
          <p>
            A tiny React Three Fiber globe with NASA-derived default maps,
            night lights, transparent clouds, auto quality, and reduced-motion
            support.
          </p>

          <h3>Install using npm</h3>
          <code>npm install https://github.com/yuvrajraina/tinyearth/releases/download/v0.1.0/react-earth-lite-0.1.0.tgz</code>

          <h3>Usage</h3>
          <code>{'import Earth from "react-earth-lite";'}</code>
          <code>{"<Earth radius={1} rotationSpeed={0.026} />"}</code>
        </div>
      </section>
    </main>
  );
}
