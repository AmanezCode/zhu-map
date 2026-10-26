import { useLayoutEffect, useMemo, useRef } from "react";
import { labelRadius } from "../data/geometry";
import type { FloorData, Poi, Space } from "../data/types";
import { toWorld } from "../scene/extrude";
import { labelRegistry } from "../scene/labels";
import { useMap } from "../store";
import { HEIGHTS, POI_STYLE, SPACE_STYLE, spaceLabel } from "../theme";
import { EntranceIcon, StairsIcon } from "./icons";

interface Item {
  id: string;
  text: string | null;
  sub?: string;
  variant: "room" | "name" | "muted" | "wc" | "entrance" | "stairs";
  color: string;
  space?: Space;
  poi?: Poi;
  title: string;
}

function buildItems(data: FloorData): Item[] {
  const items: Item[] = [];
  for (const s of data.spaces) {
    const text = spaceLabel(s);
    if (!text) continue;
    const named = !s.number && s.type !== "toilet";
    items.push({
      id: s.id,
      text: s.number && s.type !== "classroom" && s.type !== "toilet" ? s.name : text,
      sub: s.number && s.type !== "classroom" && s.type !== "toilet" ? s.number : undefined,
      variant: s.type === "toilet" ? "wc" : s.type === "hall" ? "muted" : named || s.type !== "classroom" ? "name" : "room",
      color: SPACE_STYLE[s.type].color,
      space: s,
      title: s.name,
    });
  }
  for (const p of data.pois) {
    if (p.type === "toilet") continue; // toilets carry their own WC label
    items.push({ id: p.id, text: null, variant: p.type, color: POI_STYLE[p.type].color, poi: p, title: POI_STYLE[p.type].title });
  }
  return items;
}

export function LabelLayer({ data }: { data: FloorData }) {
  const items = useMemo(() => buildItems(data), [data]);
  return (
    <div className="label-layer" aria-hidden="false">
      {items.map((it) => (
        <Label key={it.id} item={it} />
      ))}
    </div>
  );
}

function Label({ item }: { item: Item }) {
  const el = useRef<HTMLButtonElement>(null);
  const selected = useMap((s) => s.selectedId === item.id);
  const hovered = useMap((s) => s.hoveredId === item.id);
  const select = useMap((s) => s.select);
  const hover = useMap((s) => s.hover);

  useLayoutEffect(() => {
    const s = item.space;
    const p = item.poi;
    labelRegistry.set(item.id, {
      id: item.id,
      pos: s ? toWorld(s.anchor, HEIGHTS.tile + 0.3) : toWorld(p!.position, 0.8),
      radius: s ? labelRadius(s) : p!.type === "entrance" ? 9 : 4,
      minPx: s ? (item.variant === "room" ? 30 : 46) : 34,
      priority: s ? (s.type === "hall" ? 5 : 100 + Math.min(s.area, 400)) : p!.type === "entrance" ? 900 : 300,
      space: s,
      poi: p,
      el: el.current,
      w: 0,
      h: 0,
      shown: false,
      x: 0,
      y: 0,
    });
    return () => {
      labelRegistry.delete(item.id);
    };
  }, [item]);

  // size changes with the state: measure again on the next frame
  useLayoutEffect(() => {
    const entry = labelRegistry.get(item.id);
    if (entry) entry.w = 0;
  }, [selected, hovered, item.id]);

  const isPin = item.variant === "entrance" || item.variant === "stairs";
  return (
    <button
      ref={el}
      type="button"
      className={`lbl lbl-${item.variant}${selected ? " is-selected" : ""}${hovered ? " is-hovered" : ""}`}
      style={{ ["--c" as string]: item.color }}
      title={item.title}
      aria-label={item.title}
      onClick={() => select(item.id)}
      onPointerEnter={() => hover(item.id)}
      onPointerLeave={() => useMap.getState().hoveredId === item.id && hover(null)}
    >
      {isPin ? (
        item.variant === "entrance" ? <EntranceIcon size={15} strokeWidth={2.3} /> : <StairsIcon size={14} strokeWidth={2.4} />
      ) : (
        <>
          <span className="lbl-text">{item.text}</span>
          {item.sub && <span className="lbl-sub">{item.sub}</span>}
        </>
      )}
    </button>
  );
}
