import { Line } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { FloorData, Space } from "../data/types";
import { spaceInCategory, useMap } from "../store";
import { COLORS, HEIGHTS, SPACE_STYLE } from "../theme";
import { extrude, toWorld } from "./extrude";

export function Spaces({ data }: { data: FloorData }) {
  return (
    <group>
      {data.spaces.map((s) => (
        <SpaceTile key={s.id} space={s} />
      ))}
    </group>
  );
}

const WHITE = new THREE.Color("#ffffff");
const SELECTED = new THREE.Color(COLORS.accent).lerp(WHITE, 0.3);

function SpaceTile({ space }: { space: Space }) {
  const style = SPACE_STYLE[space.type];
  const geometry = useMemo(() => extrude([space.polygon], 0, HEIGHTS.tile), [space]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const outline = useMemo(() => {
    const ring = space.polygon[0].map((p) => toWorld(p, HEIGHTS.tile + 0.02));
    return [...ring, ring[0]];
  }, [space]);

  const hovered = useMap((s) => s.hoveredId === space.id);
  const selected = useMap((s) => s.selectedId === space.id);
  const dimmed = useMap((s) => s.category !== null && !spaceInCategory(space, s.category));
  const hover = useMap((s) => s.hover);
  const select = useMap((s) => s.select);

  const target = useMemo(() => {
    const base = new THREE.Color(style.color);
    if (selected) return SELECTED.clone();
    if (dimmed) return base.lerp(new THREE.Color(COLORS.dimmed), 0.82);
    if (hovered) return base.offsetHSL(0, 0.1, -0.07);
    return base;
  }, [style.color, selected, dimmed, hovered]);
  const lift = selected ? HEIGHTS.selectLift : hovered ? HEIGHTS.hoverLift : 0;

  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 12);
    material.current?.color.lerp(target, k);
    if (group.current) group.current.position.y += (lift - group.current.position.y) * k;
  });

  const handlers = style.interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          hover(space.id);
          document.body.style.cursor = "pointer";
        },
        onPointerOut: () => {
          if (useMap.getState().hoveredId === space.id) hover(null);
          document.body.style.cursor = "";
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 6) return; // that was a drag, not a click
          select(space.id);
        },
      }
    : {};

  if (!geometry) return null;
  return (
    <group ref={group}>
      <mesh geometry={geometry} receiveShadow {...handlers}>
        <meshStandardMaterial ref={material} color={style.color} roughness={0.95} />
      </mesh>
      {(selected || hovered) && (
        <Line points={outline} color={selected ? COLORS.accent : "#ffffff"} lineWidth={selected ? 3 : 2} />
      )}
    </group>
  );
}
