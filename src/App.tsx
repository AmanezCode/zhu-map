import { useEffect, useState } from "react";
import type { FloorData } from "./data/types";
import { MapCanvas } from "./scene/MapCanvas";
import { useMap } from "./store";
import { FloorSwitcher, Hint, Loader, ProtoNote, ViewControls } from "./ui/Controls";
import { LabelLayer } from "./ui/LabelLayer";
import { Sidebar } from "./ui/Sidebar";

const FLOOR_URL = `${import.meta.env.BASE_URL}data/k1/f1.json`;

export default function App() {
  const data = useMap((s) => s.data);
  const ready = useMap((s) => s.ready);
  const setData = useMap((s) => s.setData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(FLOOR_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<FloorData>;
      })
      .then(setData)
      .catch((e: unknown) => setError(String(e)));
  }, [setData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement).tagName === "INPUT") return;
      const st = useMap.getState();
      if (st.selectedId) st.select(null);
      else if (st.category) st.setCategory(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      {data && <MapCanvas data={data} />}
      {data && <LabelLayer data={data} />}
      <Sidebar />
      {data && <FloorSwitcher data={data} />}
      {data && <ViewControls />}
      {data && <Hint />}
      {data && <ProtoNote data={data} />}
      <Loader error={error} done={ready} />
    </div>
  );
}
