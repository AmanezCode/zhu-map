import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Poly, XY } from "../data/types";

/** Plan (x, y) → world (x, height, -y): the drawing's "up" points away from the default camera. */
export function toWorld([x, y]: XY, height = 0): THREE.Vector3 {
  return new THREE.Vector3(x, height, -y);
}

export function toShape(poly: Poly): THREE.Shape {
  const [outer, ...holes] = poly;
  const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
  shape.holes = holes.map((h) => new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  return shape;
}

/** Extrude plan polygons between two heights and merge them into one geometry. */
export function extrude(polys: Poly[], bottom: number, top: number): THREE.BufferGeometry | null {
  const parts = polys
    .filter((p) => p[0] && p[0].length >= 3)
    .map((p) => {
      const g = new THREE.ExtrudeGeometry(toShape(p), { depth: top - bottom, bevelEnabled: false, curveSegments: 1 });
      g.rotateX(-Math.PI / 2);
      g.translate(0, bottom, 0);
      return g;
    });
  return merge(parts);
}

export function merge(parts: (THREE.BufferGeometry | null)[]): THREE.BufferGeometry | null {
  const valid = parts.filter((g): g is THREE.BufferGeometry => g !== null);
  if (!valid.length) return null;
  const merged = mergeGeometries(valid, false);
  valid.forEach((g) => g.dispose());
  return merged;
}
