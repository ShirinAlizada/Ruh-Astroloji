import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { synastryApi, profileApi, ApiError, type SynastryResponse, type ElementBalanceDto, type ProfileDto } from "../lib/api";
import { signLabel } from "../lib/signs";
import { CITIES, findCity } from "../lib/cities";
import { Page, PageHeader } from "../components/Page";
import { TimeSelect24 } from "../components/TimeSelect24";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/uygunluq.tsx-indəki "PersonCard" naxışı: sol
// kart HƏMİŞƏ istifadəçinin öz profilindəki xəritəni göstərir (əvvəlki
// "Mənim profilimi istifadə et" checkbox-ı silinib — artıq şərtsizdir), sağ
// kart isə ikinci şəxsin məlumatını (Ad, tarix, saat, Doğum yeri — indi raw
// enlik/uzunluq əvəzinə şəhər siyahısı) toplayır. AstroBackend `personA`
// göndərilmədikdə öz saxlanılmış natal xəritəsini özü istifadə edir.

function ElementBars({
  balance,
  dominant,
  labels,
}: {
  balance: ElementBalanceDto;
  dominant: string | null;
  labels: Record<keyof ElementBalanceDto, string>;
}) {
  return (
    <div className="space-y-1.5">
      {(Object.keys(labels) as Array<keyof ElementBalanceDto>).map((key) => (
        <div key={key}>
          <div className="flex items-center justify-between text-[11px] text-mist mb-0.5">
            <span className={dominant === labels[key] ? "text-gold" : ""}>{labels[key]}</span>
            <span>{balance[key]}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${balance[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SynastryPage() {
  const { t, lang } = useI18n();
  const TIER_LABELS: Record<string, string> = {
    cosmic: t("synastry.tierCosmic"),
    strong: t("synastry.tierStrong"),
    growing: t("synastry.tierGrowing"),
    challenging: t("synastry.tierChallenging"),
  };
  const ELEMENT_LABELS: Record<keyof ElementBalanceDto, string> = {
    od: t("synastry.elementFire"),
    torpaq: t("synastry.elementEarth"),
    hava: t("synastry.elementAir"),
    su: t("synastry.elementWater"),
  };
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [nameB, setNameB] = useState(t("synastry.partnerNamePlaceholder"));
  const [dateB, setDateB] = useState("");
  const [timeB, setTimeB] = useState("12:00");
  const [placeB, setPlaceB] = useState("Bakı");

  const [result, setResult] = useState<SynastryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileApi
      .getMe()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  const hasOwnChart = Boolean(profile?.birthDate);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const city = findCity(placeB);
    if (!city) {
      setError(t("synastry.errSelectCity"));
      return;
    }
    setLoading(true);
    try {
      const data = await synastryApi.calculateChart({
        personA: null,
        personB: { date: dateB, time: timeB, latitude: city.lat, longitude: city.lon },
        lang,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("synastry.errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";
  const partnerLabel = nameB.trim() || t("synastry.partnerDefault");

  return (
    <Page>
      <PageHeader kicker={t("synastry.kicker")} title={t("synastry.title")} subtitle={t("synastry.subtitle")} />

      <form onSubmit={submit} className="grid md:grid-cols-2 gap-6 mb-6">
        {error && (
          <p className="md:col-span-2 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6 space-y-4">
          <h2 className="font-display text-xl">{t("synastry.youTitle")}</h2>
          {profileLoading && <p className="text-sm text-mist">{t("common.loading")}</p>}
          {!profileLoading && hasOwnChart && (
            <p className="text-sm text-mist">
              {t("profile.sun")} {profile?.sunSign ?? "—"} · {t("profile.moon")} {profile?.moonSign ?? "—"} · {t("profile.ascendant")}{" "}
              {profile?.ascendant ?? "—"}
            </p>
          )}
          {!profileLoading && !hasOwnChart && (
            <div className="text-sm text-mist space-y-3">
              <p>{t("synastry.noChartText")}</p>
              <Link to="/profil" className="inline-block text-sm text-gold hover:text-goldsoft transition">
                {t("synastry.goToProfile")}
              </Link>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6 space-y-4">
          <h2 className="font-display text-xl">{t("synastry.partnerTitle")}</h2>
          <div>
            <label className={labelClass}>{t("synastry.partnerName")}</label>
            <input
              className={inputClass}
              value={nameB}
              maxLength={60}
              placeholder={t("synastry.partnerNamePlaceholder")}
              onChange={(e) => setNameB(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("synastry.birthDate")}</label>
              <input type="date" className={inputClass} value={dateB} onChange={(e) => setDateB(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t("synastry.time")}</label>
              <TimeSelect24 value={timeB} onChange={setTimeB} />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t("synastry.birthPlace")}</label>
            <select className={inputClass} value={placeB} onChange={(e) => setPlaceB(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-ink">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading || !dateB || !hasOwnChart}
            className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
          >
            {loading ? t("synastry.calculating") : t("synastry.submit")}
          </button>
        </div>
      </form>

      {result && (
        <>
          <section className="rounded-3xl border border-white/10 bg-gradient-to-b from-ink2 to-ink p-6 md:p-8 mb-6">
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                [t("synastry.overall"), result.overall],
                [t("synastry.love"), result.love],
                [t("synastry.friendship"), result.friendship],
                [t("synastry.communication"), result.communication],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center">
                  <p className="text-[9px] text-mist uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-xl text-gold font-display">{value}%</p>
                </div>
              ))}
            </div>

            <div className="text-center mb-5">
              <span className="inline-block px-4 py-1.5 rounded-full border border-gold/30 text-sm text-gold">
                {TIER_LABELS[result.tier] ?? result.tier}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-[10px] text-mist uppercase tracking-wide mb-2 text-center">{t("synastry.you")}</p>
                <ElementBars balance={result.elementBalanceA} dominant={result.dominantElementA} labels={ELEMENT_LABELS} />
              </div>
              <div>
                <p className="text-[10px] text-mist uppercase tracking-wide mb-2 text-center truncate">{partnerLabel}</p>
                <ElementBars balance={result.elementBalanceB} dominant={result.dominantElementB} labels={ELEMENT_LABELS} />
              </div>
            </div>

            {result.notes.length > 0 && (
              <div className="space-y-2">
                {result.notes.map((n, i) => (
                  <p key={i} className="text-sm text-mist rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
                    {n}
                  </p>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
            <h2 className="font-display text-2xl mb-4">{t("synastry.planetDetails")}</h2>
            <div className="space-y-2">
              {result.details.map((d) => (
                <div key={d.planet} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm">
                  <span className="text-[#F3EFE6]">
                    {d.symbol} {d.planet}
                  </span>
                  <span className="text-mist">
                    {signLabel(d.signA, lang)} / {signLabel(d.signB, lang)}
                  </span>
                  <span className="text-gold text-xs">{d.aspect}</span>
                  <span className="text-mist/70 text-xs">{d.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
