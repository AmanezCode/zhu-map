/** Floor JSON produced by tools/dxf_to_json.py. Plan coordinates are metres, y points "up" on the drawing. */
export type XY = [number, number];
export type Ring = XY[];
/** Outer ring followed by holes. */
export type Poly = Ring[];

export type SpaceType =
  | "classroom"
  | "office"
  | "toilet"
  | "stairs"
  | "canteen"
  | "wardrobe"
  | "security"
  | "technical"
  | "corridor"
  | "hall"
  | "vestibule"
  | "room";

export type Wing = "north" | "south" | "center" | "east";

export interface Space {
  id: string;
  type: SpaceType;
  name: string;
  number?: string;
  wing: Wing;
  area: number;
  anchor: XY;
  polygon: Poly;
  review?: string[];
}

export interface Door {
  id: string;
  hinge: XY;
  end: XY;
  swing: XY;
  spaces: (string | null)[];
}

export interface Step {
  polygon: Poly;
  top: number;
}

export interface Stair {
  id: string;
  exterior: boolean;
  outline: Poly;
  treads: XY[][];
  steps?: Step[];
}

export interface Porch {
  id: string;
  name: string;
  top: number;
  platform: Poly;
  blocks: Poly[];
}

export type PoiType = "entrance" | "stairs" | "toilet";

export interface Poi {
  id: string;
  type: PoiType;
  position: XY;
  ref?: string;
  doors?: string[];
}

export interface FloorData {
  version: number;
  meta: {
    source: string;
    generatedAt: string;
    metersPerUnit: number;
    scaleIsAssumed: boolean;
    notes: string[];
  };
  building: { id: string; name: string };
  floor: { id: string; level: number; name: string; groundLevel: number };
  bounds: [number, number, number, number];
  footprint: Poly[];
  walls: Poly[];
  windows: Poly[];
  columns: Poly[];
  fixtures: Poly[];
  porches: Porch[];
  stairs: Stair[];
  spaces: Space[];
  doors: Door[];
  pois: Poi[];
}
