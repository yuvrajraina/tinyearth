import type { GroupProps } from "@react-three/fiber";
import type { ReactElement } from "react";
import type { Vector3 } from "three";

export type EarthQuality = "auto" | "low" | "medium" | "high";

export interface EarthMarker {
  lat: number;
  lng: number;
  color?: string;
  size?: number;
}

export interface EarthTexturePaths {
  day?: string;
  dayMap?: string;
  clouds?: string;
  cloud?: string;
  cloudsMap?: string;
  cloudMap?: string;
  night?: string;
  nightMap?: string;
  normal?: string;
  normalMap?: string;
  specular?: string;
  specularMap?: string;
}

export interface EarthProps extends Omit<GroupProps, "children"> {
  atmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  axialTilt?: number;
  cloudRotationSpeed?: number;
  cloudTexturePath?: string;
  clouds?: boolean;
  cloudsOpacity?: number;
  cloudsTexturePath?: string;
  dayTexturePath?: string;
  initialRotation?: number;
  lightDirection?: [number, number, number] | Vector3;
  markerColor?: string;
  markers?: EarthMarker[];
  nightLights?: boolean;
  nightTexturePath?: string;
  normalMap?: boolean;
  normalScale?: number;
  normalTexturePath?: string;
  quality?: EarthQuality;
  radius?: number;
  reducedMotion?: "auto" | boolean;
  rotationSpeed?: number;
  segments?: [number, number];
  specular?: boolean;
  specularStrength?: number;
  specularTexturePath?: string;
  texturePaths?: EarthTexturePaths;
}

export declare function Earth(props: EarthProps): ReactElement;

export default Earth;
