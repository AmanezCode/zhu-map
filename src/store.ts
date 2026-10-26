import { create } from "zustand";
import type { FloorData, Poi, Space, XY } from "./data/types";
import { categoryById, type CategoryId } from "./theme";

export type CameraRequest =
  | { kind: "home" }
  | { kind: "focus"; id: string }
  | { kind: "fit"; points: XY[] }
  | { kind: "zoom"; factor: number };

export type ViewMode = "3d" | "2d";

interface Index {
  spaces: Map<string, Space>;
  pois: Map<string, Poi>;
}

interface MapState {
  data: FloorData | null;
  /** first 3D frames are on screen (shaders compiled) */
  ready: boolean;
  index: Index;
  hoveredId: string | null;
  selectedId: string | null;
  category: CategoryId | null;
  viewMode: ViewMode;
  camera: { req: CameraRequest; nonce: number } | null;
  setData: (data: FloorData) => void;
  setReady: () => void;
  hover: (id: string | null) => void;
  select: (id: string | null, opts?: { fly?: boolean }) => void;
  setCategory: (id: CategoryId | null) => void;
  setViewMode: (mode: ViewMode) => void;
  requestCamera: (req: CameraRequest) => void;
}

let nonce = 0;

function syncUrl(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("room", id);
  else url.searchParams.delete("room");
  window.history.replaceState(null, "", url);
}

export const useMap = create<MapState>((set, get) => ({
  data: null,
  ready: false,
  index: { spaces: new Map(), pois: new Map() },
  hoveredId: null,
  selectedId: null,
  category: null,
  viewMode: "3d",
  camera: null,

  setData: (data) => {
    const index: Index = {
      spaces: new Map(data.spaces.map((s) => [s.id, s])),
      pois: new Map(data.pois.map((p) => [p.id, p])),
    };
    const initial = new URL(window.location.href).searchParams.get("room");
    const selectedId = initial && (index.spaces.has(initial) || index.pois.has(initial)) ? initial : null;
    set({ data, index, selectedId });
  },

  setReady: () => set({ ready: true }),

  hover: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id });
  },

  select: (id, opts = {}) => {
    const { fly = true } = opts;
    syncUrl(id);
    set({ selectedId: id, category: id ? null : get().category });
    if (id && fly) get().requestCamera({ kind: "focus", id });
  },

  setCategory: (id) => {
    const { data } = get();
    set({ category: id, selectedId: null });
    syncUrl(null);
    if (!data) return;
    if (!id) {
      get().requestCamera({ kind: "home" });
      return;
    }
    const points = categoryPoints(data, id);
    if (points.length) get().requestCamera({ kind: "fit", points });
  },

  setViewMode: (viewMode) => set({ viewMode }),

  requestCamera: (req) => set({ camera: { req, nonce: ++nonce } }),
}));

export function spaceInCategory(space: Space, id: CategoryId | null): boolean {
  const cat = categoryById(id);
  return !!cat && cat.types.includes(space.type);
}

export function poiInCategory(poi: Poi, id: CategoryId | null): boolean {
  const cat = categoryById(id);
  return !!cat && cat.poi === poi.type;
}

export function categoryPoints(data: FloorData, id: CategoryId): XY[] {
  return [
    ...data.spaces.filter((s) => spaceInCategory(s, id)).flatMap((s) => s.polygon[0]),
    ...data.pois.filter((p) => poiInCategory(p, id)).map((p) => p.position),
  ];
}
