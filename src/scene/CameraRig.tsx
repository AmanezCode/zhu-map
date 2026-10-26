import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { boundsOf, boxCenter, boxSize, polyBounds, type Box2 } from "../data/geometry";
import type { FloorData, XY } from "../data/types";
import { useMap, type ViewMode } from "../store";
import { toWorld } from "./extrude";

const { ACTION } = CameraControlsImpl;
const FOV = 35;
const HOME_POLAR = 0.86;
const HOME_AZIMUTH = -0.42; // a three-quarter view from the side of the main porch
const MAX_POLAR = 1.2;
const TOP_DOWN = 0.0001;

function setView(c: CameraControlsImpl, target: THREE.Vector3, distance: number, polar: number, azimuth: number, animate: boolean) {
  const pos = new THREE.Vector3().setFromSphericalCoords(distance, polar, azimuth).add(target);
  return c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate);
}

/** Distance at which a box of `size` metres fits the viewport. */
function fitDistance(size: number, aspect: number): number {
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
  return (size / 2) / Math.min(tanV, tanV * aspect);
}

/** Map-style input: dragging slides along the ground, rotation is on the right button / two fingers. */
function configureInput(c: CameraControlsImpl, mode: ViewMode) {
  c.mouseButtons.left = ACTION.SCREEN_PAN;
  c.mouseButtons.middle = ACTION.DOLLY;
  c.mouseButtons.wheel = ACTION.DOLLY;
  c.mouseButtons.right = mode === "3d" ? ACTION.ROTATE : ACTION.NONE;
  c.touches.one = ACTION.TOUCH_SCREEN_PAN;
  // from straight above, trucking already moves along the ground
  c.touches.two = mode === "3d" ? ACTION.TOUCH_DOLLY_ROTATE : ACTION.TOUCH_DOLLY_TRUCK;
  c.touches.three = mode === "3d" ? ACTION.TOUCH_ROTATE : ACTION.NONE;
}

/**
 * Shift the projection centre so the map is centred in the area not covered by the UI:
 * the sidebar on desktop, the search bar and the bottom sheet on phones.
 */
function ViewportShift() {
  const sheetOpen = useMap((s) => s.selectedId !== null);
  const current = useRef<[number, number] | null>(null);
  useFrame(({ camera, size }, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const desktop = size.width > 720;
    const tx = desktop ? -Math.min(194, size.width * 0.18) : 0;
    const ty = desktop ? 0 : sheetOpen ? Math.min(105, size.height * 0.13) : -36;
    const cur = current.current ?? [tx, ty];
    const k = current.current ? 1 - Math.exp(-dt * 8) : 1;
    const nx = cur[0] + (tx - cur[0]) * k;
    const ny = cur[1] + (ty - cur[1]) * k;
    const view = cam.view;
    if (!view || Math.abs(view.offsetX - nx) > 0.05 || Math.abs(view.offsetY - ny) > 0.05 || view.fullWidth !== size.width || view.fullHeight !== size.height) {
      cam.setViewOffset(size.width, size.height, nx, ny, size.width, size.height);
    }
    current.current = [nx, ny];
  });
  return null;
}

export function CameraRig({ data }: { data: FloorData }) {
  const ref = useRef<CameraControlsImpl>(null);
  const aspect = useThree((s) => s.size.width / s.size.height);
  const request = useMap((s) => s.camera);
  const viewMode = useMap((s) => s.viewMode);
  const firstMode = useRef(true);

  const home = useMemo(() => {
    const [minx, miny, maxx, maxy] = data.bounds;
    const box: Box2 = { minX: minx, minY: miny, maxX: maxx, maxY: maxy };
    return { target: toWorld(boxCenter(box)), size: boxSize(box) };
  }, [data]);

  const polar = (c: CameraControlsImpl) =>
    useMap.getState().viewMode === "2d" ? TOP_DOWN : THREE.MathUtils.clamp(c.polarAngle, 0.5, 0.95);

  const focusOn = (c: CameraControlsImpl, center: XY, size: number) =>
    setView(c, toWorld(center), THREE.MathUtils.clamp(size * 2.6 + 26, 36, 110), polar(c), c.azimuthAngle, true);

  const goHome = (c: CameraControlsImpl, animate = true) => {
    const mode = useMap.getState().viewMode;
    setView(
      c,
      home.target,
      fitDistance(home.size, aspect) * (mode === "2d" ? 1.05 : 1.32),
      mode === "2d" ? TOP_DOWN : HOME_POLAR,
      mode === "2d" ? 0 : HOME_AZIMUTH,
      animate,
    );
  };

  const focusId = (c: CameraControlsImpl, id: string) => {
    const { index } = useMap.getState();
    const space = index.spaces.get(id);
    if (space) return focusOn(c, boxCenter(polyBounds(space.polygon)), boxSize(polyBounds(space.polygon)));
    const poi = index.pois.get(id);
    if (poi) return focusOn(c, poi.position, 6);
  };

  // first frame: start high above and settle on the building (or the room from the link)
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    configureInput(c, "3d");
    c.dollyToCursor = true;
    const [minx, miny, maxx, maxy] = data.bounds;
    c.setBoundary(new THREE.Box3(new THREE.Vector3(minx - 12, -2, -maxy - 12), new THREE.Vector3(maxx + 12, 8, -miny + 12)));
    const selected = useMap.getState().selectedId;
    if (selected) {
      // opened from a link: start on the overview and fly to the room
      goHome(c, false);
      focusId(c, selected);
    } else {
      setView(c, home.target, fitDistance(home.size, aspect) * 2.2, 0.3, HOME_AZIMUTH - 0.9, false);
      goHome(c);
    }
  }, [data]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !request) return;
    const { req } = request;
    if (req.kind === "home") goHome(c);
    else if (req.kind === "focus") focusId(c, req.id);
    else if (req.kind === "zoom") c.dolly(req.factor > 1 ? c.distance * 0.35 : -c.distance * 0.5, true);
    else if (req.kind === "fit") {
      const box = boundsOf(req.points);
      setView(c, toWorld(boxCenter(box)), Math.max(fitDistance(boxSize(box) + 8, aspect), 30), polar(c), c.azimuthAngle, true);
    }
  }, [request]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (firstMode.current) {
      firstMode.current = false;
      return;
    }
    configureInput(c, viewMode);
    c.maxPolarAngle = viewMode === "2d" ? TOP_DOWN : MAX_POLAR;
    const selected = useMap.getState().selectedId;
    if (selected) {
      c.rotateTo(viewMode === "2d" ? 0 : HOME_AZIMUTH, viewMode === "2d" ? TOP_DOWN : HOME_POLAR, false);
      focusId(c, selected);
    } else {
      goHome(c);
    }
  }, [viewMode]);

  return (
    <>
      <ViewportShift />
      <CameraControls
        ref={ref}
        makeDefault
        minDistance={10}
        maxDistance={320}
        maxPolarAngle={MAX_POLAR}
        smoothTime={0.32}
        draggingSmoothTime={0.1}
      />
    </>
  );
}

export { FOV };
