// destiny-reads-app-dan köçürülüb (StarField.tsx) — sayt-boyu zərif, animasiyalı
// ulduz/planet fonu. Təmiz CSS (canvas yox, kadr-başı JS yox), "mix-blend-mode:
// screen" ilə render olunur ki, yalnız işıq əlavə etsin — altındakı mətn/kartları
// heç vaxt qaraltmasın. Ulduz mövqeləri kiçik seed-lənmiş PRNG ilə yaradılır
// (Math.random yox) ki, server-render olunan HTML ilə client-in ilk render-i
// bayt-bayt eyni olsun və hydration mismatch yaranmasın.

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starLayer(seed: number, count: number, spreadVh: number): string {
  const rand = mulberry32(seed);
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = (rand() * 100).toFixed(2);
    const y = (rand() * spreadVh).toFixed(2);
    shadows.push(`${x}vw ${y}vh #fff`);
  }
  return shadows.join(", ");
}

const LAYER_SMALL = starLayer(1, 90, 100);
const LAYER_MEDIUM = starLayer(2, 45, 100);
const LAYER_LARGE = starLayer(3, 18, 100);

export function StarField() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[1] overflow-hidden pointer-events-none [mix-blend-mode:screen]"
    >
      <span
        className="absolute left-0 top-0 block size-px rounded-full animate-star-twinkle-a"
        style={{ boxShadow: LAYER_SMALL, opacity: 0.5 }}
      />
      <span
        className="absolute left-0 top-0 block size-[1.5px] rounded-full animate-star-twinkle-b"
        style={{ boxShadow: LAYER_MEDIUM, opacity: 0.6 }}
      />
      <span
        className="absolute left-0 top-0 block size-[2px] rounded-full animate-star-twinkle-c"
        style={{ boxShadow: LAYER_LARGE, opacity: 0.7 }}
      />
      <span className="absolute -left-24 top-1/4 size-72 rounded-full bg-violet/10 blur-3xl animate-planet-drift-a" />
      <span className="absolute -right-20 bottom-1/5 size-96 rounded-full bg-gold/10 blur-3xl animate-planet-drift-b" />
    </div>
  );
}
