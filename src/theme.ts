import type { PoiType, Space, SpaceType, Wing } from "./data/types";

export const COLORS = {
  background: "#eef0ea",
  ground: "#e1e6dc",
  plinth: "#d8d1c2",
  stone: "#e8e2d5",
  stoneDark: "#d4cbb8",
  wall: "#fbfaf6",
  glass: "#a7d3ef",
  column: "#f4f0e7",
  fixture: "#ffffff",
  stairTile: "#f7c693",
  stairTread: "#e29659",
  accent: "#3b5bdb",
  accentSoft: "#c8d3ff",
  dimmed: "#e9ebe5",
};

/** Stylised heights in metres. Walls are cut low so rooms stay visible from above. */
export const HEIGHTS = {
  tile: 0.05,
  wall: 1.6,
  sill: 0.8,
  column: 2.2,
  fixture: 0.42,
  parapet: 0.5,
  tread: 0.04,
  hoverLift: 0.08,
  selectLift: 0.22,
};

export interface SpaceStyle {
  color: string;
  title: string;
  interactive: boolean;
}

export const SPACE_STYLE: Record<SpaceType, SpaceStyle> = {
  classroom: { color: "#bcd5f6", title: "Аудитория", interactive: true },
  office: { color: "#d8cbf3", title: "Кабинет", interactive: true },
  toilet: { color: "#a9e4d8", title: "Туалет", interactive: true },
  stairs: { color: "#f9d2ab", title: "Лестница", interactive: true },
  canteen: { color: "#fbe0a3", title: "Столовая", interactive: true },
  wardrobe: { color: "#f5c6d6", title: "Гардероб", interactive: true },
  security: { color: "#cdd7e3", title: "Охрана", interactive: true },
  technical: { color: "#dedad1", title: "Техническое помещение", interactive: true },
  corridor: { color: "#f6f3ed", title: "Коридор", interactive: false },
  hall: { color: "#f6f3ed", title: "Холл", interactive: false },
  vestibule: { color: "#efebe2", title: "Тамбур", interactive: false },
  room: { color: "#e2e9df", title: "Помещение", interactive: true },
};

export const POI_STYLE: Record<PoiType, { color: string; title: string }> = {
  entrance: { color: "#1f9d55", title: "Вход" },
  stairs: { color: "#e07a2f", title: "Лестница" },
  toilet: { color: "#13a08a", title: "Туалет" },
};

/** Wing names are relative to the drawing until the real orientation is known. */
export const WING_NAMES: Record<Wing, string> = {
  north: "Верхнее крыло",
  south: "Нижнее крыло",
  center: "Центральная часть",
  east: "Правое крыло",
};

export type CategoryId = "classroom" | "toilet" | "stairs" | "entrance" | "canteen" | "wardrobe" | "admin";

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  types: SpaceType[];
  poi?: PoiType;
}

export const CATEGORIES: Category[] = [
  { id: "classroom", label: "Аудитории", color: SPACE_STYLE.classroom.color, types: ["classroom"] },
  { id: "toilet", label: "Туалеты", color: SPACE_STYLE.toilet.color, types: ["toilet"] },
  { id: "stairs", label: "Лестницы", color: SPACE_STYLE.stairs.color, types: ["stairs"], poi: "stairs" },
  { id: "entrance", label: "Входы", color: "#a7dfbd", types: [], poi: "entrance" },
  { id: "canteen", label: "Столовая", color: SPACE_STYLE.canteen.color, types: ["canteen"] },
  { id: "wardrobe", label: "Гардероб", color: SPACE_STYLE.wardrobe.color, types: ["wardrobe"] },
  { id: "admin", label: "Администрация", color: SPACE_STYLE.office.color, types: ["office", "security"] },
];

export function categoryById(id: CategoryId | null): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function spaceTitle(space: Space): string {
  if (space.number && space.type === "classroom") return `Аудитория ${space.number}`;
  return space.name;
}

/** Short text shown on the map; null means the space gets no label. */
export function spaceLabel(space: Space): string | null {
  if (space.type === "toilet") return "WC";
  if (space.number) return space.number;
  if (["corridor", "vestibule", "room", "stairs"].includes(space.type)) return null;
  return space.name;
}
