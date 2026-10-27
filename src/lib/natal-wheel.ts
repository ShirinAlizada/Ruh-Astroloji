// destiny-reads-app-ın lib/astrology.ts-indən köçürülüb — yalnız NatalWheel
// vizual təkəri üçün lazım olan xalis (pure) köməkçilər: ekliptik uzunluq
// hesablaması, dərəcə formatlaşdırma və əsas (major) aspektlərin tapılması.
// AstroBackend-in NatalChartResponse-u (sun/moon/ascendant/midheaven/planets/
// houses, hamısı AZ bürc/planet adları ilə) birbaşa uyğun gəlir — Supabase-ə
// bağlı astronomik hesablama məntiqi (computeNatalChart və s.) köçürülməyib.

export const SIGNS_AZ = [
  "Qoç",
  "Buğa",
  "Əkizlər",
  "Xərçəng",
  "Aslan",
  "Qız",
  "Tərəzi",
  "Əqrəb",
  "Oxatan",
  "Oğlaq",
  "Dolça",
  "Balıqlar",
] as const;

export const SIGN_SYMBOLS: Record<string, string> = {
  Qoç: "♈",
  Buğa: "♉",
  Əkizlər: "♊",
  Xərçəng: "♋",
  Aslan: "♌",
  Qız: "♍",
  Tərəzi: "♎",
  Əqrəb: "♏",
  Oxatan: "♐",
  Oğlaq: "♑",
  Dolça: "♒",
  Balıqlar: "♓",
};

export const BODY_SYMBOLS: Record<string, string> = {
  Günəş: "☉",
  Ay: "☾",
  Merkuri: "☿",
  Venera: "♀",
  Mars: "♂",
  Yupiter: "♃",
  Saturn: "♄",
  Uran: "♅",
  Neptun: "♆",
  Pluton: "♇",
  Xiron: "⚷",
};

export function formatDegree(degree: number, minute: number): string {
  const safeDeg = Number.isFinite(degree) ? degree : 0;
  const safeMin = Number.isFinite(minute) ? minute : 0;
  return `${safeDeg}°${String(safeMin).padStart(2, "0")}′`;
}

export function toLongitude(sign: string, degree: number): number {
  const idx = SIGNS_AZ.indexOf(sign as (typeof SIGNS_AZ)[number]);
  if (idx < 0) return degree;
  return idx * 30 + degree;
}

export const ASPECT_DEFS = [
  { key: "conjunction", nameAz: "Konyunksiya", symbol: "☌", angle: 0, orb: 8, color: "#e7ce88" },
  { key: "sextile", nameAz: "Sekstil", symbol: "⚹", angle: 60, orb: 4, color: "#8b7bef" },
  { key: "square", nameAz: "Kvadrat", symbol: "□", angle: 90, orb: 6, color: "#f26d6d" },
  { key: "trine", nameAz: "Trigon", symbol: "△", angle: 120, orb: 6, color: "#6ddc8f" },
  { key: "opposition", nameAz: "Oppozisiya", symbol: "☍", angle: 180, orb: 8, color: "#f26d6d" },
] as const;

export interface AspectHit {
  a: string;
  b: string;
  aspect: (typeof ASPECT_DEFS)[number];
  orb: number;
}

export interface ChartPlanet {
  name: string;
  sign: string;
  degree: number;
  minute: number;
  house?: number | null;
  retrograde?: boolean;
}

export interface ChartHouse {
  index: number;
  sign: string;
  degree: number;
  minute: number;
}

export interface ChartAngle {
  sign: string;
  degree: number;
  minute: number;
}

export interface WheelChart {
  planets: ChartPlanet[];
  houses: ChartHouse[];
  ascendant: ChartAngle;
  midheaven: ChartAngle;
}

export function computeAspects(chart: WheelChart): AspectHit[] {
  const bodies = chart.planets;
  const hits: AspectHit[] = [];

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const la = toLongitude(bodies[i]!.sign, bodies[i]!.degree);
      const lb = toLongitude(bodies[j]!.sign, bodies[j]!.degree);
      let diff = Math.abs(la - lb) % 360;
      if (diff > 180) diff = 360 - diff;

      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          hits.push({ a: bodies[i]!.name, b: bodies[j]!.name, aspect: def, orb: Math.round(orb * 10) / 10 });
          break;
        }
      }
    }
  }

  return hits.sort((x, y) => x.orb - y.orb);
}
