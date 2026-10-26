import type { Poly, Space, XY } from "./types";

export interface Box2 {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundsOf(points: XY[]): Box2 {
  const box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [x, y] of points) {
    box.minX = Math.min(box.minX, x);
    box.minY = Math.min(box.minY, y);
    box.maxX = Math.max(box.maxX, x);
    box.maxY = Math.max(box.maxY, y);
  }
  return box;
}

export function polyBounds(poly: Poly): Box2 {
  return boundsOf(poly[0]);
}

export function boxCenter(b: Box2): XY {
  return [(b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2];
}

export function boxSize(b: Box2): number {
  return Math.max(b.maxX - b.minX, b.maxY - b.minY);
}

/** Thin rectangle around a segment, used for stair treads. */
export function segmentPoly(a: XY, b: XY, halfWidth: number): Poly {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * halfWidth;
  const ny = (dx / len) * halfWidth;
  return [
    [
      [a[0] + nx, a[1] + ny],
      [b[0] + nx, b[1] + ny],
      [b[0] - nx, b[1] - ny],
      [a[0] - nx, a[1] - ny],
    ],
  ];
}

/** Radius used to decide when a room is large enough on screen to carry its label. */
export function labelRadius(space: Space): number {
  const b = polyBounds(space.polygon);
  return Math.min(Math.sqrt(space.area) / 2, Math.min(b.maxX - b.minX, b.maxY - b.minY) * 0.75 + 0.5);
}
