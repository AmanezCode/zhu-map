import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { poiInCategory, spaceInCategory, useMap } from "../store";
import { HEIGHTS } from "../theme";
import { labelRegistry, type LabelEntry } from "./labels";

const GAP = 3; // px between labels

/** Projects registered labels to the screen, hides small ones and resolves overlaps by priority. */
export function LabelProjector() {
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const st = useMap.getState();
    const focal = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));

    const entries: [LabelEntry, number, boolean][] = [];
    for (const e of labelRegistry.values()) {
      const inCategory = e.space ? spaceInCategory(e.space, st.category) : !!e.poi && poiInCategory(e.poi, st.category);
      const prio =
        e.id === st.selectedId ? 1e7 : e.id === st.hoveredId ? 1e6 : e.priority + (inCategory ? 1e5 : 0);
      entries.push([e, prio, inCategory]);
    }
    entries.sort((a, b) => b[1] - a[1]);

    const placed: number[] = [];
    for (const [e, prio, inCategory] of entries) {
      if (!e.el) continue;
      if (e.w === 0) {
        e.w = e.el.offsetWidth;
        e.h = e.el.offsetHeight;
      }
      v.copy(e.pos);
      if (e.space && e.id === st.selectedId) v.y += HEIGHTS.selectLift;
      v.project(cam);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      const forced = prio >= 1e6;
      let show = v.z < 1 && x > -50 && x < size.width + 50 && y > -50 && y < size.height + 50;

      if (show && !forced) {
        if (st.category !== null && !inCategory) show = false;
        else if (!inCategory) {
          const px = (2 * e.radius * focal) / cam.position.distanceTo(e.pos);
          show = px >= e.minPx;
        }
      }
      const x0 = x - e.w / 2 - GAP;
      const y0 = y - e.h / 2 - GAP;
      const x1 = x + e.w / 2 + GAP;
      const y1 = y + e.h / 2 + GAP;
      if (show && !forced) {
        for (let i = 0; i < placed.length; i += 4) {
          if (x0 < placed[i + 2] && x1 > placed[i] && y0 < placed[i + 3] && y1 > placed[i + 1]) {
            show = false;
            break;
          }
        }
      }
      if (show) placed.push(x0, y0, x1, y1);

      if (show && (Math.abs(x - e.x) > 0.1 || Math.abs(y - e.y) > 0.1 || !e.shown)) {
        e.el.style.transform = `translate3d(${(x - e.w / 2).toFixed(1)}px, ${(y - e.h / 2).toFixed(1)}px, 0)`;
        e.x = x;
        e.y = y;
      }
      // inline styles, not classes: React owns className and re-renders it on selection
      if (show !== e.shown) {
        e.el.style.opacity = show ? "1" : "0";
        e.el.style.pointerEvents = show ? "auto" : "none";
        e.shown = show;
      }
      e.el.style.zIndex = forced ? "3" : inCategory ? "2" : "1";
    }
  });
  return null;
}
