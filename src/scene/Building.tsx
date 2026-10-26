import { useEffect, useMemo } from "react";
import type * as THREE from "three";
import type { FloorData } from "../data/types";
import { segmentPoly } from "../data/geometry";
import { COLORS, HEIGHTS } from "../theme";
import { extrude, merge } from "./extrude";

interface SolidProps {
  geometry: THREE.BufferGeometry | null;
  color: string;
  roughness?: number;
  castShadow?: boolean;
}

function Solid({ geometry, color, roughness = 0.92, castShadow = true }: SolidProps) {
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} castShadow={castShadow} receiveShadow>
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}

/** Static parts of the floor: plinth, walls, windows, columns, stairs, porches. */
export function Building({ data }: { data: FloorData }) {
  const ground = data.floor.groundLevel;
  const g = useMemo(() => {
    const interior = data.stairs.filter((s) => !s.exterior);
    const stairTop = HEIGHTS.tile + 0.012;
    const treads = interior.flatMap((s) =>
      s.treads.filter((t) => t.length >= 2).map((t) => segmentPoly(t[0], t[t.length - 1], 0.05)),
    );
    const steps = data.stairs.flatMap((s) => s.steps ?? []).map((st) => extrude([st.polygon], ground, st.top));
    return {
      plinth: extrude(data.footprint, ground, 0),
      walls: extrude(data.walls, 0, HEIGHTS.wall),
      sills: extrude(data.windows, 0, HEIGHTS.sill),
      glass: extrude(data.windows, HEIGHTS.sill, HEIGHTS.wall - 0.08),
      lintels: extrude(data.windows, HEIGHTS.wall - 0.08, HEIGHTS.wall),
      columns: extrude(data.columns, 0, HEIGHTS.column),
      fixtures: extrude(data.fixtures, 0, HEIGHTS.fixture),
      platforms: extrude(data.porches.map((p) => p.platform), ground, 0),
      blocks: extrude(data.porches.flatMap((p) => p.blocks), ground, HEIGHTS.parapet),
      steps: merge(steps),
      stairTiles: extrude(interior.map((s) => s.outline), 0, stairTop),
      treads: extrude(treads, stairTop, stairTop + HEIGHTS.tread),
    };
  }, [data, ground]);

  useEffect(() => () => Object.values(g).forEach((geom) => geom?.dispose()), [g]);

  return (
    <group>
      <Solid geometry={g.plinth} color={COLORS.plinth} castShadow={false} />
      <Solid geometry={g.platforms} color={COLORS.stone} />
      <Solid geometry={g.blocks} color={COLORS.stoneDark} />
      <Solid geometry={g.steps} color={COLORS.stone} />
      <Solid geometry={g.walls} color={COLORS.wall} />
      <Solid geometry={g.sills} color={COLORS.wall} />
      <Solid geometry={g.lintels} color={COLORS.wall} />
      <Solid geometry={g.columns} color={COLORS.column} />
      <Solid geometry={g.fixtures} color={COLORS.fixture} roughness={0.4} />
      <Solid geometry={g.stairTiles} color={COLORS.stairTile} castShadow={false} />
      <Solid geometry={g.treads} color={COLORS.stairTread} castShadow={false} />
      {g.glass && (
        <mesh geometry={g.glass} renderOrder={2}>
          <meshStandardMaterial color={COLORS.glass} transparent opacity={0.5} roughness={0.12} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

export function Ground({ data }: { data: FloorData }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={data.floor.groundLevel - 0.005} receiveShadow>
      <planeGeometry args={[900, 900]} />
      <meshStandardMaterial color={COLORS.ground} roughness={1} />
    </mesh>
  );
}
