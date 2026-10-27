// destiny-reads-app-ın src/lib/astrology.ts-indəki CITIES kataloqu ilə
// hərfi eynidir (ad + enlik/uzunluq) — doğum yeri seçimini raw lat/lon
// mətn sahələri əvəzinə açılan siyahı (select) kimi göstərmək üçün.
export interface City {
  name: string;
  lat: number;
  lon: number;
}

export const CITIES: City[] = [
  { name: "Bakı", lat: 40.4093, lon: 49.8671 },
  { name: "Gəncə", lat: 40.6828, lon: 46.3606 },
  { name: "Sumqayıt", lat: 40.5897, lon: 49.6686 },
  { name: "Şəki", lat: 41.1919, lon: 47.1706 },
  { name: "Lənkəran", lat: 38.7529, lon: 48.8475 },
  { name: "Naxçıvan", lat: 39.2089, lon: 45.4122 },
  { name: "Quba", lat: 41.3606, lon: 48.5127 },
  { name: "Şirvan", lat: 39.9316, lon: 48.9207 },
  { name: "Mingəçevir", lat: 40.7703, lon: 47.0496 },
  { name: "İstanbul", lat: 41.0082, lon: 28.9784 },
  { name: "Ankara", lat: 39.9334, lon: 32.8597 },
  { name: "Moskva", lat: 55.7558, lon: 37.6173 },
  { name: "Tbilisi", lat: 41.7151, lon: 44.8271 },
  { name: "London", lat: 51.5072, lon: -0.1276 },
  { name: "Berlin", lat: 52.52, lon: 13.405 },
  { name: "Nyu-York", lat: 40.7128, lon: -74.006 },
];

export function findCity(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}
