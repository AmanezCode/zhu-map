import type * as THREE from "three";
import type { Poi, Space } from "../data/types";

/**
 * Screen-space labels live in the DOM (crisp text, CSS styling) and are positioned
 * every frame by <LabelProjector/>. The registry connects the two without React re-renders.
 */
export interface LabelEntry {
  id: string;
  pos: THREE.Vector3;
  /** world radius; the label shows once the object is at least `minPx` wide on screen */
  radius: number;
  minPx: number;
  priority: number;
  space?: Space;
  poi?: Poi;
  el: HTMLElement | null;
  w: number;
  h: number;
  shown: boolean;
  x: number;
  y: number;
}

export const labelRegistry = new Map<string, LabelEntry>();
