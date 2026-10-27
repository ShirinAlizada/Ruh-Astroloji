import { useEffect, useState } from "react";
import { panchangApi, profileApi, ApiError, type PanchangResponse } from "../lib/api";
import { signLabel } from "../lib/signs";
import { SIGN_SYMBOLS } from "../lib/natal-wheel";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/gunun-beledcisi.tsx-indəki dizayn: InfoCard
// statistik kafel-lər, aspekt çip-ləri sırası və hökm-rənglənmiş tövsiyə grid-i.

// DÜZƏLİŞ (2026-10-27): backend indi EN/RU üçün "favorable"/"благоприятно" və
// "be cautious"/"будьте осторожны" kimi tərcümə olunmuş verdikt mətnləri də
// qaytarır — bu yoxlama əvvəllər yalnız AZ alt-sətirlərini tanıyırdı.
function verdictClass(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v.includes("əlverişli") || v.includes("favorable") || v.includes("благоприятно"))
    return "text-emerald-300 border-emerald-400/30 bg-emerald-400/10";
  if (v.includes("ehtiyat") || v.includes("caution") || v.includes("осторож"))
    return "text-amber-300 border-amber-400/30 bg-amber-400/10";
  return "text-mist border-white/10 bg-white/5";
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-4">
      <div className="text-mist text-xs tracking-[0.25em] uppercase mb-2">{label}</div>
      <div className="font-display text-xl text-goldsoft">{value}</div>
      {sub && <div className="text-xs text-mist mt-1">{sub}</div>}
    </div>
  );
}

export default function DailyGuidePage() {
  const { t, lang } = useI18n();
  const WEEKDAYS = [
    t("dailyGuide.weekday0"),
    t("dailyGuide.weekday1"),
    t("dailyGuide.weekday2"),
    t("dailyGuide.weekday3"),
    t("dailyGuide.weekday4"),
    t("dailyGuide.weekday5"),
    t("dailyGuide.weekday6"),
  ];
  const [data, setData] = useState<PanchangResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileApi
      .getMe()
      .then((p) => panchangApi.today(p.birthLat ?? undefined, p.birthLon ?? undefined, lang))
      .catch(() => panchangApi.today(undefined, undefined, lang))
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : t("dailyGuide.errLoad")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <Page>
      <PageHeader
        kicker={data ? `${WEEKDAYS[data.weekday] ?? ""} · ${data.dateISO.slice(0, 10)}` : t("dailyGuide.kickerDefault")}
        title={t("dailyGuide.title")}
        subtitle={t("dailyGuide.subtitle")}
      />

      {loading && <p className="text-mist">{t("common.loading")}</p>}

      {!loading && error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      {!loading && data && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <InfoCard
              label={t("dailyGuide.moonSign")}
              value={`${SIGN_SYMBOLS[data.moonSign] ?? ""} ${signLabel(data.moonSign, lang).split(" ").slice(1).join(" ")}`}
              sub={data.moonElement}
            />
            <InfoCard label={t("dailyGuide.dayRuler")} value={data.dayRuler} sub={`${t("dailyGuide.colorPrefix")} ${data.dayColor}`} />
          </div>

          {data.aspects.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg mb-3">{t("dailyGuide.todaysAspects")}</h2>
              <div className="flex flex-wrap gap-2">
                {data.aspects.slice(0, 6).map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs rounded-full border border-white/10 bg-celestial-card/50 px-3 py-1.5 text-gold"
                  >
                    <span className="text-white/90">
                      {a.planetA} ({signLabel(a.signA, lang).split(" ").slice(1).join(" ")})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white/90">
                      {a.planetB} ({signLabel(a.signB, lang).split(" ").slice(1).join(" ")})
                    </span>
                    <span className="text-mist">({a.aspect})</span>
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <h2 className="font-display text-2xl mb-4">{t("dailyGuide.todaysGuidance")}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.guidance.map((g, i) => (
                <div key={i} className={`rounded-2xl border p-5 ${verdictClass(g.verdict)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg text-white">{g.category}</h3>
                    <span className="text-xs uppercase tracking-widest">{g.verdict}</span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{g.reason}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </Page>
  );
}
