import { useEffect, useState } from "react";
import type { FloorData } from "../data/types";
import { useMap } from "../store";
import { CubeIcon, HomeIcon, InfoIcon, MinusIcon, PlanIcon, PlusIcon } from "./icons";

const LEVELS = [3, 2, 1];

export function FloorSwitcher({ data }: { data: FloorData }) {
  return (
    <div className="panel floors" role="group" aria-label="Этажи">
      <span className="floors-title">Этаж</span>
      {LEVELS.map((n) => {
        const current = n === data.floor.level;
        return (
          <button
            key={n}
            className={`floor-btn${current ? " is-active" : ""}`}
            aria-pressed={current}
            disabled={!current}
            title={current ? data.floor.name : "Схема этажа ещё не загружена"}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export function ViewControls() {
  const viewMode = useMap((s) => s.viewMode);
  const setViewMode = useMap((s) => s.setViewMode);
  const requestCamera = useMap((s) => s.requestCamera);
  return (
    <div className="panel view-controls" role="toolbar" aria-label="Вид">
      <button className="icon-btn" aria-label="Приблизить" onClick={() => requestCamera({ kind: "zoom", factor: 1.5 })}>
        <PlusIcon />
      </button>
      <button className="icon-btn" aria-label="Отдалить" onClick={() => requestCamera({ kind: "zoom", factor: 0.66 })}>
        <MinusIcon />
      </button>
      <span className="sep" />
      <button
        className="icon-btn"
        aria-label={viewMode === "3d" ? "Вид сверху (2D)" : "Объёмный вид (3D)"}
        title={viewMode === "3d" ? "Вид сверху" : "Объёмный вид"}
        onClick={() => setViewMode(viewMode === "3d" ? "2d" : "3d")}
      >
        {viewMode === "3d" ? <PlanIcon /> : <CubeIcon />}
      </button>
      <button className="icon-btn" aria-label="Весь корпус" title="Весь корпус" onClick={() => requestCamera({ kind: "home" })}>
        <HomeIcon />
      </button>
    </div>
  );
}

export function Hint() {
  const [visible, setVisible] = useState(true);
  const coarse = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  useEffect(() => {
    const hide = () => setVisible(false);
    const t = window.setTimeout(hide, 9000);
    window.addEventListener("wheel", hide, { once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("wheel", hide);
    };
  }, []);
  return (
    <div className={`hint${visible ? "" : " is-gone"}`} role="note">
      {coarse ? "Один палец — сдвиг · два — масштаб и поворот" : "Тяните — сдвиг · правая кнопка — поворот · колесо — масштаб"}
    </div>
  );
}

export function ProtoNote({ data }: { data: FloorData }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="proto">
      <button className="proto-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <InfoIcon size={15} /> Прототип
      </button>
      {open && (
        <div className="panel proto-pop">
          <p>
            <strong>Прототип 1 этажа.</strong> Данные: {data.meta.source}
          </p>
          <ul>
            {data.meta.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Loader({ error, done }: { error: string | null; done: boolean }) {
  return (
    <div className={`loader${done ? " is-done" : ""}`} role="status" aria-hidden={done}>
      {error ? (
        <p>Не удалось загрузить карту: {error}</p>
      ) : (
        <>
          <span className="spinner" />
          <p>Загружаем карту…</p>
        </>
      )}
    </div>
  );
}
