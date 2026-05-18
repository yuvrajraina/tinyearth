import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DynamicDrawUsage,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  NoColorSpace,
  Quaternion,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from "three";

const EARTH_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const EARTH_FRAGMENT = `
  precision mediump float;

  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D normalMap;
  uniform sampler2D specularMap;
  uniform vec3 lightDirection;
  uniform vec3 nightTint;
  uniform float ambientStrength;
  uniform float nightStrength;
  uniform float normalScale;
  uniform float specularStrength;
  uniform float useNightMap;
  uniform float useNormalMap;
  uniform float useSpecularMap;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  vec3 surfaceNormal(vec3 n) {
    if (useNormalMap < 0.5) {
      return n;
    }

    vec3 tangent = normalize(cross(vec3(0.0, 1.0, 0.0), n));
    if (length(tangent) < 0.001) {
      tangent = vec3(1.0, 0.0, 0.0);
    }

    vec3 bitangent = normalize(cross(n, tangent));
    vec3 mapNormal = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    mapNormal.xy *= normalScale;

    return normalize(tangent * mapNormal.x + bitangent * mapNormal.y + n * mapNormal.z);
  }

  void main() {
    vec3 n = surfaceNormal(normalize(vNormalW));
    vec3 l = normalize(lightDirection);
    vec3 v = normalize(cameraPosition - vPositionW);
    float ndl = dot(n, l);
    float daylight = max(ndl, 0.0);

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 color = day * (ambientStrength + daylight * 1.16);

    float nightSide = smoothstep(0.18, -0.18, ndl) * useNightMap;
    float cityLight = texture2D(nightMap, vUv).r;
    color += nightTint * pow(cityLight, 1.18) * nightStrength * nightSide;

    vec3 halfVector = normalize(l + v);
    float ocean = texture2D(specularMap, vUv).r * useSpecularMap;
    float shine = pow(max(dot(n, halfVector), 0.0), 72.0) * ocean * specularStrength * step(0.0, ndl);
    color += vec3(0.48, 0.68, 0.9) * shine;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPosition.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  precision mediump float;

  uniform vec3 glowColor;
  uniform float intensity;

  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 v = normalize(cameraPosition - vPositionW);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.15);
    gl_FragColor = vec4(glowColor * (0.18 + rim), rim * 0.28 * intensity);
    #include <colorspace_fragment>
  }
`;

const QUALITY = {
  low: { segments: [32, 16] },
  medium: { segments: [48, 24] },
  high: { segments: [64, 32] },
};

function packageAsset(name) {
  const assetPath = import.meta.url.includes("/assets/")
    ? "./textures/"
    : "./assets/textures/";

  return new URL(assetPath + name, import.meta.url).href;
}

const DEFAULT_TEXTURES = {
  clouds: packageAsset("earth-clouds.webp"),
  day: packageAsset("earth-day.webp"),
  night: packageAsset("earth-night.webp"),
  normal: packageAsset("earth-normal.webp"),
  specular: packageAsset("earth-specular.webp"),
};

const DEFAULT_LIGHT = [0.25, 0.12, 1];
const DEG = Math.PI / 180;
const UP = new Vector3(0, 1, 0);
const scratchMatrix = new Matrix4();
const scratchQuaternion = new Quaternion();
const scratchScale = new Vector3();
const scratchPosition = new Vector3();
const solidTextures = new Map();

function pickAutoQuality() {
  if (typeof window === "undefined") {
    return "medium";
  }

  const memory = navigator.deviceMemory || 4;
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 760;

  if (memory <= 3 || narrow) {
    return "low";
  }

  return coarsePointer ? "medium" : "high";
}

function useAutoQuality(quality) {
  const [autoQuality, setAutoQuality] = useState(pickAutoQuality);

  useEffect(() => {
    if (quality !== "auto" || typeof window === "undefined") {
      return undefined;
    }

    const update = () => setAutoQuality(pickAutoQuality());
    update();
    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, [quality]);

  return quality === "auto" ? autoQuality : quality;
}

function useReducedMotion(reducedMotion) {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (reducedMotion !== "auto" || typeof window === "undefined") {
      return undefined;
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(query.matches);

    update();
    query.addEventListener?.("change", update);

    return () => query.removeEventListener?.("change", update);
  }, [reducedMotion]);

  return reducedMotion === "auto" ? prefersReduced : Boolean(reducedMotion);
}

function configureTexture(texture, kind) {
  texture.wrapS = RepeatWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.colorSpace = kind === "normal" || kind === "specular" ? NoColorSpace : SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function solidTexture(key, r, g, b, a = 255, kind = "day") {
  if (!solidTextures.has(key)) {
    const texture = new DataTexture(new Uint8Array([r, g, b, a]), 1, 1, RGBAFormat);
    solidTextures.set(key, configureTexture(texture, kind));
  }

  return solidTextures.get(key);
}

function fallbackTexture(kind) {
  if (kind === "clouds") return solidTexture("clouds:off", 255, 255, 255, 0, "clouds");
  if (kind === "normal") return solidTexture("normal:off", 128, 128, 255, 255, "normal");
  if (kind === "specular") return solidTexture("specular:off", 0, 0, 0, 255, "specular");
  if (kind === "night") return solidTexture("night:off", 0, 0, 0, 255, "night");
  return solidTexture("day:fallback", 14, 38, 75, 255, "day");
}

function useTexture(path, kind, enabled = true) {
  const fallback = useMemo(() => fallbackTexture(kind), [kind]);
  const [loaded, setLoaded] = useState(null);
  const loadedTexture = useRef(null);

  useEffect(() => {
    if (!enabled || !path) {
      return undefined;
    }

    let active = true;
    const loader = new TextureLoader();

    loader.load(
      path,
      (nextTexture) => {
        configureTexture(nextTexture, kind);
        if (!active) {
          nextTexture.dispose();
          return;
        }

        loadedTexture.current?.dispose();
        loadedTexture.current = nextTexture;
        setLoaded({ path, texture: nextTexture });
      },
      undefined,
      () => undefined,
    );

    return () => {
      active = false;
    };
  }, [enabled, kind, path]);

  useEffect(
    () => () => {
      loadedTexture.current?.dispose();
    },
    [],
  );

  return enabled && path && loaded?.path === path ? loaded.texture : fallback;
}

function texturePath(texturePaths, key, legacyPath) {
  if (legacyPath) {
    return legacyPath;
  }

  if (key === "clouds") {
    return (
      texturePaths?.clouds ??
      texturePaths?.cloud ??
      texturePaths?.cloudsMap ??
      texturePaths?.cloudMap ??
      DEFAULT_TEXTURES.clouds
    );
  }

  return texturePaths?.[key] ?? texturePaths?.[`${key}Map`] ?? DEFAULT_TEXTURES[key];
}

function vectorFromLatLng(lat, lng, radius) {
  const phi = lat * DEG;
  const theta = lng * DEG;
  const cosPhi = Math.cos(phi);

  return new Vector3(
    radius * cosPhi * Math.sin(theta),
    radius * Math.sin(phi),
    radius * cosPhi * Math.cos(theta),
  );
}

function EarthMarkers({ markers, radius, markerColor }) {
  const ref = useRef(null);
  const count = markers.length;

  useLayoutEffect(() => {
    if (!ref.current || count === 0) {
      return;
    }

    ref.current.instanceMatrix.setUsage(DynamicDrawUsage);

    markers.forEach((marker, index) => {
      const size = marker.size ?? radius * 0.045;
      const normal = vectorFromLatLng(marker.lat, marker.lng, 1).normalize();
      scratchPosition.copy(normal).multiplyScalar(radius + size * 0.48);
      scratchQuaternion.setFromUnitVectors(UP, normal);
      scratchScale.set(size * 0.42, size, size * 0.42);
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
      ref.current.setMatrixAt(index, scratchMatrix);
      ref.current.setColorAt(index, new Color(marker.color ?? markerColor));
    });

    ref.current.count = count;
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) {
      ref.current.instanceColor.needsUpdate = true;
    }
  }, [count, markerColor, markers, radius]);

  if (count === 0) {
    return null;
  }

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} renderOrder={3}>
      <coneGeometry args={[1, 1, 10, 1]} />
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

function resolveVector(value) {
  if (Array.isArray(value)) {
    return new Vector3(value[0], value[1], value[2]).normalize();
  }

  return value?.clone?.().normalize?.() ?? new Vector3(...DEFAULT_LIGHT).normalize();
}

export function Earth({
  atmosphere = false,
  atmosphereColor = "#65b8ff",
  atmosphereIntensity = 0.52,
  axialTilt = 23.4,
  cloudRotationSpeed = 0.018,
  cloudTexturePath,
  clouds = true,
  cloudsOpacity = 0.34,
  cloudsTexturePath,
  dayTexturePath,
  initialRotation = -0.35,
  lightDirection = DEFAULT_LIGHT,
  markerColor = "#ffd166",
  markers = [],
  nightLights = true,
  nightTexturePath,
  normalMap = true,
  normalScale = 0.38,
  normalTexturePath,
  quality = "auto",
  radius = 1,
  reducedMotion = "auto",
  rotationSpeed = 0.026,
  segments,
  specular = false,
  specularStrength = 0.34,
  specularTexturePath,
  texturePaths,
  ...groupProps
}) {
  const surfaceRef = useRef(null);
  const cloudsRef = useRef(null);
  const isReducedMotion = useReducedMotion(reducedMotion);
  const qualityMode = useAutoQuality(quality);
  const profile = QUALITY[qualityMode] ?? QUALITY.medium;
  const widthSegments = Math.min(64, Math.max(16, segments?.[0] ?? profile.segments[0]));
  const heightSegments = Math.min(32, Math.max(8, segments?.[1] ?? profile.segments[1]));

  const dayMap = useTexture(texturePath(texturePaths, "day", dayTexturePath), "day");
  const cloudMap = useTexture(
    texturePath(texturePaths, "clouds", cloudsTexturePath ?? cloudTexturePath),
    "clouds",
    clouds,
  );
  const nightMap = useTexture(
    texturePath(texturePaths, "night", nightTexturePath),
    "night",
    nightLights,
  );
  const generatedNormalMap = useTexture(
    texturePath(texturePaths, "normal", normalTexturePath),
    "normal",
    normalMap,
  );
  const oceanSpecularMap = useTexture(
    texturePath(texturePaths, "specular", specularTexturePath),
    "specular",
    specular,
  );

  const light = useMemo(() => resolveVector(lightDirection), [lightDirection]);
  const atmosphereGlow = useMemo(() => new Color(atmosphereColor), [atmosphereColor]);
  const nightGlow = useMemo(() => new Color("#ffd18a"), []);
  const earthUniforms = useMemo(
    () => ({
      ambientStrength: { value: 0.16 },
      dayMap: { value: dayMap },
      lightDirection: { value: light },
      nightMap: { value: nightMap },
      nightStrength: { value: nightLights ? 1.35 : 0 },
      nightTint: { value: nightGlow },
      normalMap: { value: generatedNormalMap },
      normalScale: { value: normalScale },
      specularMap: { value: oceanSpecularMap },
      specularStrength: { value: specular ? specularStrength : 0 },
      useNightMap: { value: nightLights ? 1 : 0 },
      useNormalMap: { value: normalMap ? 1 : 0 },
      useSpecularMap: { value: specular ? 1 : 0 },
    }),
    [
      dayMap,
      generatedNormalMap,
      light,
      nightGlow,
      nightLights,
      nightMap,
      normalMap,
      normalScale,
      oceanSpecularMap,
      specular,
      specularStrength,
    ],
  );
  const atmosphereUniforms = useMemo(
    () => ({
      glowColor: { value: atmosphereGlow },
      intensity: { value: atmosphereIntensity },
    }),
    [atmosphereGlow, atmosphereIntensity],
  );

  useFrame((_, delta) => {
    if (isReducedMotion) {
      return;
    }

    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += rotationSpeed * delta;
    }

    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += cloudRotationSpeed * delta;
    }
  });

  return (
    <group {...groupProps} rotation={[0, 0, axialTilt * DEG]}>
      <group ref={surfaceRef} rotation-y={initialRotation}>
        <mesh>
          <sphereGeometry args={[radius, widthSegments, heightSegments]} />
          <shaderMaterial
            fragmentShader={EARTH_FRAGMENT}
            uniforms={earthUniforms}
            vertexShader={EARTH_VERTEX}
          />
        </mesh>
        <EarthMarkers markers={markers} markerColor={markerColor} radius={radius} />
      </group>

      {clouds ? (
        <mesh ref={cloudsRef} rotation-y={initialRotation} renderOrder={2}>
          <sphereGeometry args={[radius * 1.013, widthSegments, heightSegments]} />
          <meshBasicMaterial
            alphaTest={0.02}
            depthWrite={false}
            map={cloudMap}
            opacity={cloudsOpacity}
            transparent
            toneMapped={false}
          />
        </mesh>
      ) : null}

      {atmosphere ? (
        <mesh renderOrder={1} scale={1.035}>
          <sphereGeometry args={[radius, widthSegments, heightSegments]} />
          <shaderMaterial
            blending={AdditiveBlending}
            depthWrite={false}
            fragmentShader={ATMOSPHERE_FRAGMENT}
            side={BackSide}
            transparent
            uniforms={atmosphereUniforms}
            vertexShader={ATMOSPHERE_VERTEX}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export default Earth;
