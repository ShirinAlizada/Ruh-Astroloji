// "Virgo Astrology" loqo lokup-u — iki-tonlu: "Virgo" əsas çəki, "ASTROLOGY"
// kiçik/boşluqlu tracked-caps. className yuxarı çağıranın əvvəlki tək-mətn
// `<span className="...">Ruh Astrolojiya</span>` sətrindəki eyni className
// ilə doldurulur ki, ölçü/boşluq konteksti pozulmasın.
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={className}>
      Virgo
      <span className="ml-1.5 align-middle text-[0.55em] font-sans font-semibold tracking-[0.25em] text-goldsoft/90">
        ASTROLOGY
      </span>
    </span>
  );
}
