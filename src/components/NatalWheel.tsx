import { useMemo } from "react";
import {
  SIGNS_AZ,
  SIGN_SYMBOLS,
  BODY_SYMBOLS,
  toLongitude,
  computeAspects,
  formatDegree,
  type WheelChart,
} from "../lib/natal-wheel";

// destiny-reads-app-ın components/NatalWheel.tsx-indən köçürülüb (geniş, ağ
// fonlu SVG natal təkəri — dərəcə tikləri, bürc sektorları, ev xətləri,
// aspekt xətləri, planet klaster-yayılması). AstroBackend-in NatalChartResponse-u
// (planets/houses/ascendant/midheaven) birbaşa uyğun gəldiyi üçün astronomik
// hesablama məntiqi dəyişməyib, yalnız məlumat mənbəyi dəyişib.
const CX = 220;
const CY = 220;
const R_OUTER = 205;
const R_TICK_MINOR = 199;
const R_TICK_MID = 194;
const R_SIGN_IN = 170;
const R_HOUSE_LINE = 170;
const R_HOUSE_NUM = 156;
const R_CUSP_DEGREE = 140;
const R_PLANET = 112;
const R_DEGREE = 90;
const R_ASPECT = 55;

const CLUSTER_GAP = 8;
const CLUSTER_ANGLE_STEP = 16;
const CLUSTER_MAX_SPREAD = 54;

function toXY(longitude: number, ascLongitude: number, radius: number, angleOffset = 0) {
  const theta = ((180 - (longitude - ascLongitude + angleOffset)) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(theta),
    y: CY - radius * Math.sin(theta),
  };
}

export function NatalWheel({ chart }: { chart: WheelChart }) {
  const ascLongitude = toLongitude(chart.ascendant.sign, chart.ascendant.degree + (chart.ascendant.minute ?? 0) / 60);
  const mcLongitude = toLongitude(chart.midheaven.sign, chart.midheaven.degree + (chart.midheaven.minute ?? 0) / 60);

  const aspects = useMemo(() => computeAspects(chart), [chart]);

  const planetPoints = useMemo(() => {
    const withLon = [...chart.planets].map((p) => ({
      ...p,
      minute: p.minute ?? 0,
      lon: toLongitude(p.sign, p.degree + (p.minute ?? 0) / 60),
    }));
    const sorted = [...withLon].sort((a, b) => a.lon - b.lon);
    const n = sorted.length;

    let cutIndex = 0;
    let maxGap = -1;
    for (let i = 0; i < n; i++) {
      const next = sorted[(i + 1) % n]!;
      const gap = i + 1 < n ? next.lon - sorted[i]!.lon : next.lon + 360 - sorted[i]!.lon;
      if (gap > maxGap) {
        maxGap = gap;
        cutIndex = (i + 1) % n;
      }
    }
    const rotated = [...sorted.slice(cutIndex), ...sorted.slice(0, cutIndex)];

    const clusters: (typeof rotated)[] = [];
    let current: typeof rotated = [];
    for (let i = 0; i < rotated.length; i++) {
      const p = rotated[i]!;
      if (current.length === 0) {
        current = [p];
      } else {
        const prev = current[current.length - 1]!;
        const gap = p.lon - prev.lon;
        if (gap < CLUSTER_GAP) {
          current.push(p);
        } else {
          clusters.push(current);
          current = [p];
        }
      }
    }
    if (current.length > 0) clusters.push(current);

    const angleOffsetByKey = new Map<string, number>();
    const radiusOffsetByKey = new Map<string, number>();
    for (const cluster of clusters) {
      const size = cluster.length;
      if (size <= 1) continue;
      const step = Math.min(CLUSTER_ANGLE_STEP, CLUSTER_MAX_SPREAD / (size - 1));
      const centerIdx = (size - 1) / 2;
      cluster.forEach((p, i) => {
        angleOffsetByKey.set(p.name, (i - centerIdx) * step);
        if (size >= 4) radiusOffsetByKey.set(p.name, i % 2 === 0 ? 7 : -7);
      });
    }

    return sorted.map((p) => {
      const angleOffset = angleOffsetByKey.get(p.name) ?? 0;
      const radiusOffset = radiusOffsetByKey.get(p.name) ?? 0;
      const truePos = toXY(p.lon, ascLongitude, R_SIGN_IN);
      return {
        ...p,
        displaced: angleOffset !== 0,
        true: truePos,
        ...toXY(p.lon, ascLongitude, R_PLANET + radiusOffset, angleOffset),
        deg: toXY(p.lon, ascLongitude, R_DEGREE + radiusOffset, angleOffset),
      };
    });
  }, [chart, ascLongitude]);

  const planetLonByName = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of chart.planets) m.set(p.name, toLongitude(p.sign, p.degree + (p.minute ?? 0) / 60));
    return m;
  }, [chart]);

  const degreeTicks = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let d = 0; d < 360; d += 5) {
      const major = d % 10 === 0;
      const outer = toXY(d, ascLongitude, R_OUTER);
      const inner = toXY(d, ascLongitude, major ? R_TICK_MID : R_TICK_MINOR);
      ticks.push({ x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y, major });
    }
    return ticks;
  }, [ascLongitude]);

  return (
    <div className="bg-white rounded-2xl p-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
      <svg viewBox="0 0 440 440" className="w-full h-full" role="img" aria-label="Natal xəritə təkəri">
        {SIGNS_AZ.map((sign, idx) => {
          if (idx % 2 !== 0) return null;
          const a1 = idx * 30;
          const steps = 6;
          const arcPts = Array.from({ length: steps + 1 }, (_, i) => toXY(a1 + i * 5, ascLongitude, R_OUTER));
          const d = `M ${CX} ${CY} L ${arcPts.map((pt) => `${pt.x} ${pt.y}`).join(" L ")} Z`;
          return <path key={`bg-${sign}`} d={d} fill="rgba(20,20,40,0.035)" />;
        })}

        {degreeTicks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.2)"}
            strokeWidth={t.major ? 1.1 : 0.6}
          />
        ))}

        <circle cx={CX} cy={CY} r={R_OUTER} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={1.4} />
        <circle cx={CX} cy={CY} r={R_SIGN_IN} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R_ASPECT} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />

        {SIGNS_AZ.map((sign, idx) => {
          const boundary = toXY(idx * 30, ascLongitude, R_OUTER);
          const boundaryIn = toXY(idx * 30, ascLongitude, R_SIGN_IN);
          const mid = toXY(idx * 30 + 15, ascLongitude, (R_OUTER + R_SIGN_IN) / 2);
          return (
            <g key={sign}>
              <line x1={boundaryIn.x} y1={boundaryIn.y} x2={boundary.x} y2={boundary.y} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
              <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle" fontSize={19} fontWeight={600} fill="#1a1a1a">
                {SIGN_SYMBOLS[sign]}
              </text>
            </g>
          );
        })}

        {chart.houses.map((h) => {
          const lon = toLongitude(h.sign, h.degree + (h.minute ?? 0) / 60);
          const outer = toXY(lon, ascLongitude, R_HOUSE_LINE);
          const num = toXY(lon + 10, ascLongitude, R_HOUSE_NUM);
          const cuspLabel = toXY(lon + 10, ascLongitude, R_CUSP_DEGREE);
          const isAngular = h.index === 1 || h.index === 4 || h.index === 7 || h.index === 10;
          return (
            <g key={h.index}>
              <line
                x1={CX}
                y1={CY}
                x2={outer.x}
                y2={outer.y}
                stroke={isAngular ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.22)"}
                strokeWidth={isAngular ? 1.8 : 0.8}
              />
              <text x={num.x} y={num.y} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={700} fill="#444">
                {h.index}
              </text>
              <text x={cuspLabel.x} y={cuspLabel.y} textAnchor="middle" dominantBaseline="middle" fontSize={8} fontWeight={500} fill="#888">
                {formatDegree(h.degree, h.minute ?? 0)}
              </text>
            </g>
          );
        })}

        {aspects.map((hit, i) => {
          const la = planetLonByName.get(hit.a);
          const lb = planetLonByName.get(hit.b);
          if (la === undefined || lb === undefined) return null;
          const pa = toXY(la, ascLongitude, R_ASPECT);
          const pb = toXY(lb, ascLongitude, R_ASPECT);
          return (
            <line
              key={`${hit.a}-${hit.b}-${i}`}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke={hit.aspect.color}
              strokeWidth={hit.orb < 2 ? 1.8 : 1}
              opacity={hit.orb < 2 ? 0.95 : 0.6}
            />
          );
        })}

        {planetPoints.map(
          (p) =>
            p.displaced && (
              <line
                key={`leader-${p.name}`}
                x1={p.true.x}
                y1={p.true.y}
                x2={p.x}
                y2={p.y}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth={0.6}
                strokeDasharray="2 2"
              />
            ),
        )}

        {planetPoints.map((p) => (
          <g key={p.name}>
            <circle cx={p.x} cy={p.y} r={13} fill="#ffffff" stroke="#1a1a1a" strokeWidth={1.2} />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="#1a1a1a">
              {BODY_SYMBOLS[p.name] ?? "•"}
            </text>
            <text x={p.deg.x} y={p.deg.y} textAnchor="middle" dominantBaseline="middle" fontSize={9.5} fontWeight={600} fill="#333">
              {formatDegree(p.degree, p.minute)}
              {p.retrograde ? <tspan fill="#c0392b"> ℞</tspan> : null}
            </text>
          </g>
        ))}

        {(() => {
          const asc = toXY(ascLongitude, ascLongitude, R_OUTER + 13);
          const desc = toXY(ascLongitude + 180, ascLongitude, R_OUTER + 13);
          const mc = toXY(mcLongitude, ascLongitude, R_OUTER + 13);
          const ic = toXY(mcLongitude + 180, ascLongitude, R_OUTER + 13);
          return (
            <>
              <text x={asc.x} y={asc.y} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight={700} fill="#1a1a1a">ASC</text>
              <text x={desc.x} y={desc.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#777">DESC</text>
              <text x={mc.x} y={mc.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#777">MC</text>
              <text x={ic.x} y={ic.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#777">IC</text>
            </>
          );
        })()}
      </svg>
    </div>
  );
}
