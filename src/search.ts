import type { FloorData, Poi, Space } from "./data/types";
import { POI_STYLE, SPACE_STYLE, WING_NAMES, spaceTitle } from "./theme";

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  kind: "space" | "poi";
  score: number;
}

const SYNONYMS: Record<string, string[]> = {
  toilet: ["туалет", "wc", "уборная", "санузел", "тулет"],
  stairs: ["лестница", "лестницы", "ступени"],
  canteen: ["столовая", "буфет", "еда", "кафе", "поесть"],
  wardrobe: ["гардероб", "раздевалка", "куртка"],
  security: ["охрана", "вахта", "пост"],
  office: ["кабинет", "администрация", "дирекция"],
  entrance: ["вход", "выход", "двери"],
  hall: ["холл", "вестибюль", "фойе"],
  classroom: ["аудитория", "кабинет"],
};

export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е").replace(/№/g, "").replace(/[.\s]+/g, " ").trim();
}

function synonymScore(type: string, q: string): number {
  return (SYNONYMS[type] ?? []).some((w) => w.startsWith(q) || (q.length > 3 && q.startsWith(w))) ? 45 : 0;
}

function scoreSpace(space: Space, q: string): number {
  const num = space.number ? normalize(space.number) : "";
  const name = normalize(space.name);
  let score = 0;
  if (num && num === q) score = 100;
  else if (num && num.startsWith(q)) score = 85 - (num.length - q.length);
  if (name.startsWith(q)) score = Math.max(score, 70);
  else if (name.includes(q)) score = Math.max(score, 55);
  return Math.max(score, synonymScore(space.type, q));
}

export function search(data: FloorData, query: string, limit = 8): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const results: SearchResult[] = [];
  for (const s of data.spaces) {
    if (!SPACE_STYLE[s.type].interactive && s.type !== "hall") continue;
    const score = scoreSpace(s, q);
    if (score > 0) {
      results.push({
        id: s.id,
        title: spaceTitle(s),
        subtitle: `${SPACE_STYLE[s.type].title} · ${data.floor.name} · ${WING_NAMES[s.wing]}`,
        color: SPACE_STYLE[s.type].color,
        kind: "space",
        score,
      });
    }
  }
  const entrances = data.pois.filter((p) => p.type === "entrance");
  const entranceScore = synonymScore("entrance", q);
  if (entranceScore) {
    entrances.forEach((p, i) => results.push(poiResult(data, p, `Вход ${i + 1}`, entranceScore)));
  }
  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ru", { numeric: true })).slice(0, limit);
}

function poiResult(data: FloorData, poi: Poi, title: string, score: number): SearchResult {
  return {
    id: poi.id,
    title,
    subtitle: `${POI_STYLE[poi.type].title} · ${data.floor.name}`,
    color: POI_STYLE[poi.type].color,
    kind: "poi",
    score,
  };
}

export function poiTitle(data: FloorData, poi: Poi): string {
  if (poi.type !== "entrance") return POI_STYLE[poi.type].title;
  const n = data.pois.filter((p) => p.type === "entrance").indexOf(poi) + 1;
  return `Вход ${n}`;
}
