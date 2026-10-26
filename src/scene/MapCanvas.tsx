import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import type { FloorData } from "../data/types";
import { useMap } from "../store";
import { COLORS } from "../theme";
import { Building, Ground } from "./Building";
import { CameraRig, FOV } from "./CameraRig";
import { LabelProjector } from "./LabelProjector";
import { Spaces } from "./Spaces";

function Lights({ data }: { data: FloorData }) {
  const half = useMemo(() => {
    const [minx, miny, maxx, maxy] = data.bounds;
    return Math.max(maxx - minx, maxy - miny) / 2 + 18;
  }, [data]);
  return (
    <>
      <hemisphereLight args={["#ffffff", "#cdc6b6", 1.25]} />
      <directionalLight
        position={[-70, 130, 85]}
        intensity={1.45}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={3}
      >
        <orthographicCamera attach="shadow-camera" args={[-half, half, half, -half, 10, 420]} />
      </directionalLight>
    </>
  );
}

/** Reports readiness once a few frames have rendered, i.e. shaders are compiled and the scene is visible. */
function FirstFrames() {
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 3) useMap.getState().setReady();
  });
  return null;
}

export function MapCanvas({ data }: { data: FloorData }) {
  const select = useMap((s) => s.select);
  const down = useRef<[number, number] | null>(null);

  return (
    <div
      className="canvas-wrap"
      onPointerDown={(e) => {
        down.current = [e.clientX, e.clientY];
      }}
    >
      <Canvas
        shadows="percentage"
        flat
        dpr={[1, 2]}
        camera={{ fov: FOV, near: 1, far: 1500, position: [0, 200, 220] }}
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }}
        onPointerMissed={(e) => {
          const d = down.current;
          if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return; // a drag, keep the selection
          select(null);
        }}
      >
        <color attach="background" args={[COLORS.background]} />
        <fog attach="fog" args={[COLORS.background, 240, 640]} />
        <Lights data={data} />
        <Ground data={data} />
        <Building data={data} />
        <Spaces data={data} />
        <CameraRig data={data} />
        <LabelProjector />
        <FirstFrames />
        <EffectComposer multisampling={4} enableNormalPass={false}>
          <N8AO aoRadius={2.2} distanceFalloff={1.2} intensity={2.6} color="#2f2a20" quality="medium" halfRes />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
