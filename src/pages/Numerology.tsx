import { useEffect, useState, type FormEvent } from "react";
import { numerologyApi, profileApi, ApiError, type NumerologyResponse } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/numerologiya.tsx-indəki dizayn: say-sayaraq dolan
// SVG üzük (NumberRing) + qradiyentli mənalandırma kartları (MeaningCard).

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

function NumberRing({ value, label, accent = "gold" }: { value: number; label: string; accent?: "gold" | "violet" }) {
  const counted = useCountUp(value);
  const ringColor = accent === "gold" ? "stroke-gold" : "stroke-violet";
  const textColor = accent === "gold" ? "text-gold" : "text-violet";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3 text-center">
      <div className="relative size-16 mx-auto">
        <svg viewBox="0 0 80 80" className="size-16 -rotate-90">
          <circle cx="40" cy="40" r="35" fill="none" strokeWidth="5" className="stroke-white/10" />
          <circle cx="40" cy="40" r="35" fill="none" strokeWidth="5" strokeLinecap="round" className={ringColor} strokeDasharray={2 * Math.PI * 35} />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center font-display text-2xl ${textColor}`}>{counted}</div>
      </div>
      <p className="text-[10px] text-mist uppercase tracking-wide mt-2">{label}</p>
    </div>
  );
}

function MeaningCard({ d, accent }: { d: NumerologyResponse["details"][number]; accent: "gold" | "violet" }) {
  const { t } = useI18n();
  const borderClass = accent === "gold" ? "border-gold/20" : "border-violet/25";
  const textClass = accent === "gold" ? "text-goldsoft" : "text-violet";
  return (
    <div className={`rounded-2xl bg-gradient-to-br from-celestial-card/70 to-ink2 border ${borderClass} p-6`}>
      <div className="flex items-start gap-4">
        <NumberRing value={d.number} label="" accent={accent} />
        <div className="min-w-0 flex-1">
          <div className="text-mist text-xs tracking-[0.25em] uppercase mb-1.5">{d.name}</div>
          <span className={`text-sm font-medium ${textClass}`}>{d.title}</span>
          <p className="mt-3 text-sm text-white/80 leading-relaxed">{d.meaning}</p>
          {d.keywords.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {d.keywords.map((k) => (
                <span key={k} className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-mist">
                  {k}
                </span>
              ))}
            </div>
          )}
          {d.compatible.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-mist flex-wrap">
              <span>{t("numerology.compatibleNumbers")}</span>
              {d.compatible.map((c) => (
                <span key={c} className="inline-flex items-center justify-center size-6 rounded-full bg-white/5 border border-white/10 text-goldsoft font-display">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NumerologyPage() {
  const { t, lang } = useI18n();
  const MAIN_NUMBERS: Array<[keyof NumerologyResponse, string]> = [
    ["lifePath", t("numerology.lifePath")],
    ["destiny", t("numerology.destiny")],
    ["soulUrge", t("numerology.soulUrge")],
    ["personality", t("numerology.personality")],
    ["birthday", t("numerology.birthday")],
    ["maturity", t("numerology.maturity")],
  ];
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [forYear, setForYear] = useState(String(new Date().getFullYear()));
  const [result, setResult] = useState<NumerologyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileApi
      .getMe()
      .then((p) => {
        if (p.fullName) setFullName(p.fullName);
        if (p.birthDate) setBirthDate(p.birthDate);
      })
      .catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await numerologyApi.calculate({
        fullName,
        birthDate,
        lang,
        forYear: forYear ? Number(forYear) : null,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("numerology.errCalc"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  return (
    <Page>
      <PageHeader
        kicker={t("numerology.kicker")}
        title={t("numerology.title")}
        subtitle={t("numerology.subtitle")}
      />

      <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-6 space-y-4">
        {error && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <div>
          <label className={labelClass}>{t("numerology.fullName")}</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("numerology.birthDate")}</label>
            <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>{t("numerology.forYear")}</label>
            <input type="number" className={inputClass} value={forYear} onChange={(e) => setForYear(e.target.value)} />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !fullName || !birthDate}
          className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
        >
          {loading ? t("numerology.calculating") : t("numerology.calculate")}
        </button>
      </form>

      {result && (
        <>
          <div className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-6">
            <div className="grid grid-cols-3 gap-3">
              {MAIN_NUMBERS.map(([key, label]) => (
                <NumberRing key={key} value={result[key] as number} label={label} />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
              <p className="text-[10px] text-mist uppercase tracking-wide mb-1">
                {forYear} {t("numerology.personalYearPrefix")} {result.personalYear}
              </p>
              <p className="text-sm text-[#F3EFE6]">{result.personalYearTheme}</p>
            </div>
          </div>

          <div className="space-y-4">
            {result.details.map((d, i) => (
              <MeaningCard key={i} d={d} accent={i % 2 === 0 ? "gold" : "violet"} />
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
