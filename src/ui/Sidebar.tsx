import { useEffect, useMemo, useRef, useState } from "react";
import { search, poiTitle } from "../search";
import { useMap } from "../store";
import { CATEGORIES, POI_STYLE, SPACE_STYLE, WING_NAMES, spaceTitle } from "../theme";
import { CloseIcon, LinkIcon, RouteIcon, SearchIcon, TargetIcon } from "./icons";

export function Sidebar() {
  const data = useMap((s) => s.data);
  return (
    <aside className="panel sidebar">
      <header className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="20" height="20">
            <path d="M6 22 16 8l10 14z" fill="currentColor" />
          </svg>
        </div>
        <div className="brand-text">
          <h1>Карта корпуса</h1>
          <p>{data ? `${data.building.name} · ${data.floor.name}` : "Загрузка…"}</p>
        </div>
      </header>
      <SearchBox />
      <CategoryChips />
      <RoomCard />
    </aside>
  );
}

function SearchBox() {
  const data = useMap((s) => s.data);
  const select = useMap((s) => s.select);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => (data ? search(data, query) : []), [data, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== input.current) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const pick = (i: number) => {
    const r = results[i];
    if (!r) return;
    select(r.id);
    setQuery(r.title);
    setOpen(false);
    input.current?.blur();
  };

  return (
    <div className="search">
      <div className="search-field">
        <SearchIcon size={18} className="search-icon" />
        <input
          ref={input}
          value={query}
          placeholder="Аудитория, туалет, столовая…"
          aria-label="Поиск по карте"
          role="combobox"
          aria-expanded={open && query.length > 0}
          aria-controls="search-results"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
            else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            else if (e.key === "Enter") pick(active);
            else if (e.key === "Escape") {
              setQuery("");
              input.current?.blur();
            } else return;
            e.preventDefault();
          }}
        />
        {query ? (
          <button className="icon-btn ghost" aria-label="Очистить" onClick={() => setQuery("")}>
            <CloseIcon size={16} />
          </button>
        ) : (
          <kbd className="kbd">/</kbd>
        )}
      </div>
      {open && query && (
        <ul className="results" id="search-results" role="listbox">
          {results.length === 0 && <li className="results-empty">Ничего не найдено</li>}
          {results.map((r, i) => (
            <li
              key={r.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(i);
              }}
            >
              <span className="swatch" style={{ background: r.color }} />
              <span className="result-text">
                <span className="result-title">{r.title}</span>
                <span className="result-sub">{r.subtitle}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryChips() {
  const data = useMap((s) => s.data);
  const category = useMap((s) => s.category);
  const setCategory = useMap((s) => s.setCategory);
  if (!data) return null;
  return (
    <div className="chips" role="toolbar" aria-label="Категории">
      {CATEGORIES.map((c) => {
        const count = c.poi
          ? data.pois.filter((p) => p.type === c.poi).length
          : data.spaces.filter((s) => c.types.includes(s.type)).length;
        if (!count) return null;
        const active = category === c.id;
        return (
          <button
            key={c.id}
            className={`chip${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => setCategory(active ? null : c.id)}
          >
            <span className="dot" style={{ background: c.color }} />
            {c.label}
            <span className="chip-count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function RoomCard() {
  const data = useMap((s) => s.data);
  const index = useMap((s) => s.index);
  const selectedId = useMap((s) => s.selectedId);
  const select = useMap((s) => s.select);
  const requestCamera = useMap((s) => s.requestCamera);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [selectedId]);
  if (!data || !selectedId) return null;
  const space = index.spaces.get(selectedId);
  const poi = index.pois.get(selectedId);
  if (!space && !poi) return null;

  const style = space ? SPACE_STYLE[space.type] : POI_STYLE[poi!.type];
  const title = space ? spaceTitle(space) : poiTitle(data, poi!);
  const kind = space ? (space.number && space.type !== "classroom" ? `${style.title} · № ${space.number}` : style.title) : style.title;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="card" aria-live="polite">
      <div className="card-head">
        <span className="card-swatch" style={{ background: style.color }} />
        <div className="card-titles">
          <span className="card-kind">{kind}</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-btn ghost" aria-label="Закрыть" onClick={() => select(null)}>
          <CloseIcon size={18} />
        </button>
      </div>
      <dl className="facts">
        <div>
          <dt>Корпус</dt>
          <dd>{data.building.name.replace("Корпус ", "")}</dd>
        </div>
        <div>
          <dt>Этаж</dt>
          <dd>{data.floor.level}</dd>
        </div>
        {space && (
          <div className="wide">
            <dt>Часть здания</dt>
            <dd>{WING_NAMES[space.wing]}</dd>
          </div>
        )}
      </dl>
      <div className="card-actions">
        <button className="btn primary" onClick={() => requestCamera({ kind: "focus", id: selectedId })}>
          <TargetIcon size={16} /> Показать
        </button>
        <button className="btn" onClick={copyLink}>
          <LinkIcon size={16} /> {copied ? "Скопировано" : "Ссылка"}
        </button>
        <button className="btn" disabled title="Маршруты появятся в следующей версии">
          <RouteIcon size={16} /> Маршрут
        </button>
      </div>
    </section>
  );
}
