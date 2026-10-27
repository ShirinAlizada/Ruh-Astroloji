import { useEffect, useState } from "react";
import { horoscopeApi, profileApi, ApiError, type HoroscopeDto } from "../lib/api";
import { SIGN_LABELS, SIGN_SYMBOLS, signLabel } from "../lib/signs";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/horoskop.tsx-indəki dizayn: bürc seçici grid,
// dövr pill-ləri, qradiyentli "hero" kart və üç ölçü (sevgi/karyera/maliyyə)
// üçün animasiyalı meter-lər. Məlumat mənbəyi AstroBackend-dir (Supabase yox).

const SIGNS = Object.keys(SIGN_LABELS);

function Meter({ label, value }: { label: string; value: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setWidth(value));
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-4">
      <div className="text-mist text-xs mb-2">{label}</div>
      <div className="font-display text-3xl text-goldsoft">
        {value}
        <span className="text-base text-mist">/10</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full bg-gold transition-[width] duration-700 ease-out" style={{ width: `${width * 10}%` }} />
      </div>
    </div>
  );
}

export default function HoroscopesPage() {
  const { t, lang } = useI18n();
  const PERIODS: Array<{ key: string; label: string }> = [
    { key: "daily", label: t("horoscopes.periodDaily") },
    { key: "weekly", label: t("horoscopes.periodWeekly") },
    { key: "monthly", label: t("horoscopes.periodMonthly") },
  ];
  const [sign, setSign] = useState(SIGNS[0]);
  const [period, setPeriod] = useState("daily");
  const [result, setResult] = useState<HoroscopeDto | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(signToUse: string, periodToUse: string) {
    setError(null);
    setNotFound(false);
    setLoading(true);
    try {
      const data = await horoscopeApi.current(signToUse, periodToUse, lang);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setResult(null);
        setNotFound(true);
      } else {
        setError(err instanceof ApiError ? err.message : t("horoscopes.errLoad"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    profileApi
      .getMe()
      .then((p) => {
        const initialSign = p.sunSign && SIGNS.includes(p.sunSign) ? p.sunSign : SIGNS[0];
        setSign(initialSign);
        load(initialSign, "daily");
      })
      .catch(() => load(SIGNS[0], "daily"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load(sign, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign, period, lang]);

  return (
    <Page>
      <PageHeader
        kicker={t("horoscopes.kicker")}
        title={t("horoscopes.title")}
        subtitle={t("horoscopes.subtitle")}
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {SIGNS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSign(s)}
            className={`rounded-2xl border p-4 text-center transition ${
              sign === s ? "border-gold bg-gold/10" : "border-white/10 bg-celestial-card/40 hover:border-gold/40"
            }`}
          >
            <div className="text-2xl text-goldsoft">{SIGN_SYMBOLS[s]}</div>
            <div className="text-xs mt-1.5 text-mist">{signLabel(s, lang).split(" ").slice(1).join(" ")}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`text-sm px-5 py-2 rounded-full border transition ${
              period === p.key ? "border-gold bg-gold/15 text-goldsoft" : "border-white/10 text-mist hover:border-gold/40"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}

      <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-ink2 to-ink p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl text-gold">{SIGN_SYMBOLS[sign]}</span>
            <div>
              <h2 className="font-display text-3xl">{signLabel(sign, lang).split(" ").slice(1).join(" ")}</h2>
              <p className="text-mist text-xs tracking-widest uppercase">
                {PERIODS.find((p) => p.key === period)?.label} {t("horoscopes.forecastSuffix")}
              </p>
            </div>
          </div>
        </div>

        {loading && <p className="text-mist mt-6">{t("common.loading")}</p>}
        {!loading && notFound && <p className="text-mist mt-6">{t("horoscopes.notFound")}</p>}

        {!loading && result && (
          <div key={`${sign}-${period}`} className="animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-both">
            <p className="mt-5 text-[15px] leading-relaxed text-white/85 max-w-3xl">{result.content}</p>
            <div className="grid grid-cols-3 gap-3 mt-6 max-w-xl">
              <Meter label={t("horoscopes.love")} value={result.love} />
              <Meter label={t("horoscopes.career")} value={result.career} />
              <Meter label={t("horoscopes.finance")} value={result.finance} />
            </div>
          </div>
        )}
      </section>
    </Page>
  );
}
