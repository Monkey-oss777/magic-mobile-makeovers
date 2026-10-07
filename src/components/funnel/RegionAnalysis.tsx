import { useEffect, useState } from "react";

type Geo = { region: string; lat: number; lon: number } | null;

export default function RegionAnalysis({ active, onDone }: { active: boolean; onDone: () => void }) {
  const [geo, setGeo] = useState<Geo>(null);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!active) return;
    const ctrl = new AbortController();
    const to = window.setTimeout(() => ctrl.abort(), 2500);
    fetch("https://ipapi.co/json/", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.region && typeof d.latitude === "number")
          setGeo({ region: d.region, lat: d.latitude, lon: d.longitude });
      })
      .catch(() => {})
      .finally(() => window.clearTimeout(to));

    const timers: number[] = [];
    const total = 4;
    const stepMs = 3500;
    for (let i = 1; i <= total; i++) {
      timers.push(
        window.setTimeout(() => {
          setStep(i);
          setPct((i / total) * 100);
        }, i * stepMs),
      );
    }
    timers.push(window.setTimeout(onDone, total * stepMs + 1000));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      ctrl.abort();
    };
  }, [active, onDone]);

  const place = geo?.region ?? "sua região";
  const steps = [
    "Localizando sua região",
    `Analisando prêmios disponíveis em ${place}`,
    `Conferindo entrega para ${place}`,
    "Verificando se você está qualificado...",
  ];
  const d = 1.6;
  const mapSrc = geo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${geo.lon - d},${geo.lat - d},${geo.lon + d},${geo.lat + d}&layer=mapnik&marker=${geo.lat},${geo.lon}`
    : null;

  return (
    <div className="mst-ra">
      <div className="mst-kicker">Análise regional</div>
      <h2 className="mst-h1">
        Verificando
        <br />
        <span className="mst-lime">{place}</span>
      </h2>
      <div className="mst-ra-map">
        {mapSrc ? (
          <iframe title="Mapa da região" src={mapSrc} loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <div className="mst-ra-radar" aria-hidden="true">
            <span />
          </div>
        )}
        <div className="mst-ra-scan" aria-hidden="true" />
      </div>
      <div className="mst-load">
        <span style={{ width: `${pct}%` }} />
      </div>
      <ul className="mst-ra-steps">
        {steps.map((s, i) => {
          const state = step > i ? "is-done" : step === i ? "is-run" : "";
          return (
            <li key={i} className={state}>
              <i aria-hidden="true" />
              <span>{s}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
