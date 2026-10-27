import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  profileApi,
  natalChartApi,
  synastryApi,
  subscriptionApi,
  shopApi,
  panchangApi,
  type ProfileDto,
  type NatalChartResponse,
  type SynastryResponse,
  type SubscriptionPlanDto,
  type ShopProductDto,
  type PanchangResponse,
} from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { NatalWheel } from "../components/NatalWheel";
import { useI18n, pickLocalized } from "../lib/i18n";
import { useCart } from "../lib/cart-context";
import { signLabel } from "../lib/signs";
import { BODY_SYMBOLS, SIGN_SYMBOLS, computeAspects, type WheelChart } from "../lib/natal-wheel";

// destiny-reads-app-ın routes/index.tsx-indəki (AUTH edilmiş) əsas səhifəsinin
// ruh-v2-yə portu — "/" marşrutu daxil olmuş istifadəçi üçün artıq /profil-ə
// yönləndirmir, bu dashboard-u göstərir (bax App.tsx-dəki Home()).
//
// Köhnə versiyadan FƏRQLİ OLARAQ: "Ən uyğun bürc — Balıqlar 88%" statik/saxta
// kartı YOXDUR. Bugünkü səma paneli ayrıca client-side astronomiya yazmır —
// mövcud natalChartApi.calculate() + NatalWheel-dən istifadə edir ki, hesablama
// məntiqi tək yerdə (AstrologyEngine) qalsın.
//
// DÜZƏLİŞ (2026-10-27): bir neçə əlavə:
//  1. Canlı saat/tarix zolağı (LiveClock) — ayrıca komponentdir ki, hər saniyə
//     yalnız ÖZÜ yenidən render olunsun, bütün HomePage-i yox.
//  2. "Uyğunluğum" kartı artıq istifadəçinin öz Günəş/Ay bürcünü MÜQAYİSƏ etmir
//     (bu, "daxili harmoniya" idi, real uyğunluq deyildi) — indi
//     synastryApi.calculateChart ilə istifadəçinin SAXLANILMIŞ natal xəritəsi
//     ilə BUGÜNKÜ səma arasında tam xəritə-əsaslı sinastriya hesablanır (eyni
//     date/time/lat/lon "Bugünkü səma" panelində istifadə olunanla).
//  3. Bugünkü səma paneli zənginləşdirilib: Merkuri/Venera də göstərilir,
//     bugünkü əsas aspektlər çip sırası əlavə olunub.
//  4. Yeni "Günün bələdçisi" önizləmə bölməsi (panchangApi.today) — əvvəllər
//     yalnız Sürətli keçidlər-də bir kart idi, indi əsas səhifədə məzmunu
//     birbaşa göstərir.

const BAKU_LAT = 40.4093;
const BAKU_LON = 49.8671;

// DÜZƏLİŞ (2026-10-27): mağaza önizləməsi əvvəllər məhsulun öz şəklini YOX,
// yalnız kateqoriya emojisini göstərirdi (ShopProductDto.imageUrl istifadə
// olunmurdu) — Shop.tsx/Cart.tsx-dəki eyni `imgSrc` naxışı bura da köçürülüb.
const SHOP_API_ORIGIN = "https://localhost:7168";

function shopImgSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${SHOP_API_ORIGIN}${url}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowParts() {
  const d = new Date();
  return { date: isoDate(d), time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

// AstroBackend.Application.Astrology.PanchangEngine.DayRulersAz ilə HƏRFİ eyni
// ardıcıllıq (0=Bazar…6=Şənbə, DateTime.DayOfWeek ↔ JS Date.getDay() eyni
// indeksləmədir) — /Panchang/today-nin "dayRuler" sahəsi ilə ziddiyyət yaranmasın.
const DAY_RULER_AZ_NAME: Record<number, string> = {
  0: "Günəş",
  1: "Ay",
  2: "Mars",
  3: "Merkuri",
  4: "Yupiter",
  5: "Venera",
  6: "Saturn",
};
const DAY_RULER_I18N_KEY: Record<number, string> = {
  0: "rulerSun",
  1: "rulerMoon",
  2: "rulerMars",
  3: "rulerMercury",
  4: "rulerJupiter",
  5: "rulerVenus",
  6: "rulerSaturn",
};

interface DayCell {
  date: Date;
  weekday: number;
  isToday: boolean;
}

function buildWeekStrip(): DayCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3;
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return { date: d, weekday: d.getDay(), isToday: offset === 0 };
  });
}

const SHOP_PREVIEW_ICON: Record<string, string> = {
  tarot: "🔮",
  kristal: "💎",
  sham: "🕯",
  kitab: "📖",
};

const QUICK_LINKS: Array<{ href: string; icon: string; titleKey: string; subtitleKey: string }> = [
  { href: "/natal-xerite", icon: "🪐", titleKey: "natalChart.title", subtitleKey: "natalChart.subtitle" },
  { href: "/burc-proqnozu", icon: "♈", titleKey: "horoscopes.title", subtitleKey: "horoscopes.subtitle" },
  { href: "/uygunluq", icon: "💞", titleKey: "synastry.title", subtitleKey: "synastry.subtitle" },
  { href: "/numerologiya", icon: "🔢", titleKey: "numerology.title", subtitleKey: "numerology.subtitle" },
  { href: "/gunun-beledcisi", icon: "🌙", titleKey: "dailyGuide.title", subtitleKey: "dailyGuide.subtitle" },
  { href: "/astroloqlar", icon: "🧿", titleKey: "astrologers.title", subtitleKey: "astrologers.subtitle" },
  { href: "/ai-sohbet", icon: "✨", titleKey: "chat.title", subtitleKey: "chat.subtitle" },
  { href: "/jurnal", icon: "📓", titleKey: "journal.title", subtitleKey: "journal.subtitle" },
  { href: "/forum", icon: "🗣", titleKey: "forum.title", subtitleKey: "forum.subtitle" },
];

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5 text-center">
      <div className="text-mist text-[10px] tracking-[0.2em] uppercase mb-1">{label}</div>
      <div className="font-display text-lg text-goldsoft">{value}</div>
    </div>
  );
}

// AstroBackend.Application.Astrology.PanchangEngine indi EN/RU üçün tərcümə olunmuş
// verdikt mətnləri də qaytarır (bax: lib/api.ts-dəki eyni qeyd, DailyGuide.tsx-dən köçürülüb).
function verdictClass(verdict: string): string {
  const v = verdict.toLowerCase();
  if (v.includes("əlverişli") || v.includes("favorable") || v.includes("благоприятно"))
    return "text-emerald-300 border-emerald-400/30 bg-emerald-400/10";
  if (v.includes("ehtiyat") || v.includes("caution") || v.includes("осторож"))
    return "text-amber-300 border-amber-400/30 bg-amber-400/10";
  return "text-mist border-white/10 bg-white/5";
}

// Canlı saat/tarix zolağı — ayrıca komponent olaraq çıxarılıb ki, hər saniyəlik
// "tick" yalnız bu kiçik hissəni yenidən render etsin (natal təkər, kartlar və s.
// toxunulmaz qalır). `tabular-nums` rəqəmlərin eni dəyişəndə "atlamanın" qarşısını alır.
function LiveClock() {
  const { t } = useI18n();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const weekday = t(`dailyGuide.weekday${now.getDay()}`);
  const month = t(`home.month${now.getMonth()}`);

  return (
    <section className="mb-8 rounded-2xl border border-gold/15 bg-gradient-to-br from-celestial-card/70 to-ink2/30 px-6 py-5 flex flex-wrap items-center justify-between gap-4 animate-rise-in">
      <div>
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1.5">{t("home.liveNowKicker")}</p>
        <p className="font-display text-lg sm:text-xl text-[#F3EFE6]">
          {weekday}, {now.getDate()} {month} {now.getFullYear()}
        </p>
      </div>
      <div className="font-display text-3xl sm:text-4xl tabular-nums text-goldsoft tracking-wide">
        {pad(now.getHours())}
        <span className="text-gold/50 animate-pulse">:</span>
        {pad(now.getMinutes())}
        <span className="text-gold/50 animate-pulse">:</span>
        {pad(now.getSeconds())}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { t, lang } = useI18n();
  const { addToCart } = useCart();

  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [chart, setChart] = useState<NatalChartResponse | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState(false);

  const [compat, setCompat] = useState<SynastryResponse | null>(null);
  const [compatLoading, setCompatLoading] = useState(true);
  const [compatError, setCompatError] = useState(false);

  const [guide, setGuide] = useState<PanchangResponse | null>(null);
  const [guideLoading, setGuideLoading] = useState(true);
  const [guideError, setGuideError] = useState(false);

  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [products, setProducts] = useState<ShopProductDto[]>([]);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    function loadSkyAndCompat(p: ProfileDto | null) {
      const { date, time } = nowParts();
      const latitude = p?.birthLat ?? BAKU_LAT;
      const longitude = p?.birthLon ?? BAKU_LON;

      natalChartApi
        .calculate({ date, time, latitude, longitude })
        .then((c) => alive && setChart(c))
        .catch(() => alive && setChartError(true))
        .finally(() => alive && setChartLoading(false));

      // DÜZƏLİŞ (2026-10-27): əvvəllər burda istifadəçinin öz Günəş×Ay bürcü
      // müqayisə olunurdu ("daxili harmoniya") — real uyğunluq deyildi. İndi
      // istifadəçinin SAXLANILMIŞ natal xəritəsi (personA: null → backend özü
      // tapır) BUGÜNKÜ səma ilə (yuxarıdakı eyni date/time/lat/lon) tam
      // xəritə-əsaslı sinastriya ilə müqayisə olunur.
      if (p?.birthDate) {
        synastryApi
          .calculateChart({ personA: null, personB: { date, time, latitude, longitude }, lang })
          .then((r) => alive && setCompat(r))
          .catch(() => alive && setCompatError(true))
          .finally(() => alive && setCompatLoading(false));
      } else {
        setCompatLoading(false);
      }

      panchangApi
        .today(p?.birthLat ?? undefined, p?.birthLon ?? undefined, lang)
        .then((g) => alive && setGuide(g))
        .catch(() => alive && setGuideError(true))
        .finally(() => alive && setGuideLoading(false));
    }

    profileApi
      .getMe()
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        loadSkyAndCompat(p);
      })
      .catch(() => alive && loadSkyAndCompat(null))
      .finally(() => alive && setProfileLoading(false));

    shopApi
      .products(undefined, "newest", 1, 4)
      .then((res) => alive && setProducts(res.items))
      .catch(() => {});

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ayrıca effekt (əsas mount-effektindən kənar) — DÜZƏLİŞ (2026-10-27): `lang`
  // dəyişəndə təkrarlanmalı olan sorğular: paket adı/tagline, uyğunluq
  // (notes/tier mətnləri) və günün bələdçisi (Category/Verdict/Reason) dildən
  // asılıdır. Səma (planet/bürc) mağaza önizləməsi dildən asılı deyil, artıq
  // şəbəkə sorğusu olardı.
  useEffect(() => {
    let alive = true;

    subscriptionApi
      .plans(lang)
      .then((pl) => alive && setPlans(pl))
      .catch(() => {});

    panchangApi
      .today(profile?.birthLat ?? undefined, profile?.birthLon ?? undefined, lang)
      .then((g) => alive && setGuide(g))
      .catch(() => alive && setGuideError(true));

    if (profile?.birthDate) {
      const { date, time } = nowParts();
      synastryApi
        .calculateChart({
          personA: null,
          personB: { date, time, latitude: profile.birthLat ?? BAKU_LAT, longitude: profile.birthLon ?? BAKU_LON },
          lang,
        })
        .then((r) => alive && setCompat(r))
        .catch(() => alive && setCompatError(true));
    }

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const firstName = profile?.fullName?.split(" ")[0] ?? "";
  const weekStrip = buildWeekStrip();
  const freeFeatures = [t("subscriptions.freeFeature1"), t("subscriptions.freeFeature2"), t("subscriptions.freeFeature3")];
  const todaysAspects = chart ? computeAspects(chart as unknown as WheelChart).slice(0, 4) : [];
  const compatTierLabels: Record<string, string> = {
    cosmic: t("synastry.tierCosmic"),
    strong: t("synastry.tierStrong"),
    growing: t("synastry.tierGrowing"),
    challenging: t("synastry.tierChallenging"),
  };

  function handleAddToCart(p: ShopProductDto) {
    addToCart({ productId: p.id, productName: p.name, unitPriceAzn: p.priceAzn, stock: p.stock });
    setJustAddedId(p.id);
    window.setTimeout(() => setJustAddedId((cur) => (cur === p.id ? null : cur)), 900);
  }

  return (
    <Page>
      <PageHeader
        kicker={t("home.kicker")}
        title={firstName ? `${t("home.greetingPrefix")}, ${firstName}` : t("home.greetingPrefix")}
        subtitle={t("home.subtitle")}
      />

      <LiveClock />

      {/* Həftənin gün hakimləri zolağı */}
      <section className="mb-8 -mx-1 flex gap-2 overflow-x-auto pb-1">
        {weekStrip.map((cell) => {
          const rulerAz = DAY_RULER_AZ_NAME[cell.weekday] ?? "Günəş";
          const rulerLabel = t(`home.${DAY_RULER_I18N_KEY[cell.weekday]}`);
          return (
            <div
              key={cell.date.toISOString()}
              className={
                "shrink-0 w-[76px] rounded-2xl border px-2 py-3 text-center transition " +
                (cell.isToday ? "border-gold bg-gold/10" : "border-white/8 bg-celestial-card/40")
              }
            >
              <div className={"text-[10px] uppercase tracking-wider " + (cell.isToday ? "text-gold" : "text-mist")}>
                {cell.isToday ? t("home.todayLabel") : t(`home.wd${cell.weekday}`)}
              </div>
              <div className="text-2xl mt-1.5">{BODY_SYMBOLS[rulerAz] ?? "☉"}</div>
              <div className="text-[10px] text-mist mt-1 truncate">{rulerLabel}</div>
            </div>
          );
        })}
      </section>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {/* Bugünkü səma */}
        <div className="lg:col-span-2 rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{t("home.todaySkyKicker")}</p>
          <h2 className="font-display text-2xl mb-4">{t("home.todaySkyTitle")}</h2>

          {chartLoading && <p className="text-mist text-sm">{t("home.todaySkyLoading")}</p>}
          {!chartLoading && chartError && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {t("home.todaySkyError")}
            </p>
          )}
          {!chartLoading && chart && (
            <div className="grid sm:grid-cols-[220px_1fr] gap-5 items-center">
              <div className="max-w-[220px] mx-auto sm:mx-0">
                <NatalWheel chart={chart as unknown as WheelChart} />
              </div>
              <div>
                <div className="grid grid-cols-3 gap-2.5">
                  <StatTile label={t("profile.sun")} value={signLabel(chart.sun, lang)} />
                  <StatTile label={t("profile.moon")} value={signLabel(chart.moon, lang)} />
                  <StatTile label={t("natalChart.ascendant")} value={signLabel(chart.ascendant.sign, lang)} />
                  <StatTile
                    label={t("home.rulerMercury")}
                    value={(() => {
                      const p = chart.planets.find((pl) => pl.name === "Merkuri");
                      return p ? signLabel(p.sign, lang) : "—";
                    })()}
                  />
                  <StatTile
                    label={t("home.rulerVenus")}
                    value={(() => {
                      const p = chart.planets.find((pl) => pl.name === "Venera");
                      return p ? signLabel(p.sign, lang) : "—";
                    })()}
                  />
                  <StatTile label={t("natalChart.midheaven")} value={signLabel(chart.midheaven.sign, lang)} />
                </div>
                {todaysAspects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {todaysAspects.map((hit, i) => (
                      <span
                        key={`${hit.a}-${hit.b}-${i}`}
                        className="inline-flex items-center gap-1 text-[11px] rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"
                      >
                        <span className="text-goldsoft">{BODY_SYMBOLS[hit.a] ?? hit.a}</span>
                        <span style={{ color: hit.aspect.color }}>{hit.aspect.symbol}</span>
                        <span className="text-violet">{BODY_SYMBOLS[hit.b] ?? hit.b}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <Link to="/natal-xerite" className="mt-5 inline-block text-sm text-goldsoft hover:text-gold transition">
            {t("home.todaySkyCta")}
          </Link>
        </div>

        {/* Daxili harmoniya (Günəş × Ay) */}
        <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6 flex flex-col">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{t("home.compatKicker")}</p>
          <h2 className="font-display text-xl mb-3">{t("home.compatTitle")}</h2>
          <p className="text-sm text-mist leading-relaxed mb-4">{t("home.compatBody")}</p>

          {!profileLoading && !profile?.birthDate && (
            <p className="text-sm text-mist bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
              {t("home.compatMissingBirth")}{" "}
              <Link to="/profil" className="text-gold hover:text-goldsoft transition">
                {t("natalChart.goToProfile")}
              </Link>
            </p>
          )}

          {profile?.birthDate && compatLoading && <p className="text-mist text-sm">{t("home.compatLoading")}</p>}
          {profile?.birthDate && !compatLoading && compatError && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {t("home.compatError")}
            </p>
          )}
          {!compatLoading && compat && (
            <>
              <div className="grid grid-cols-2 gap-2.5 mb-2">
                <StatTile label={t("synastry.overall")} value={`${compat.overall}%`} />
                <StatTile label={t("synastry.love")} value={`${compat.love}%`} />
                <StatTile label={t("synastry.communication")} value={`${compat.communication}%`} />
                <StatTile label={t("synastry.friendship")} value={`${compat.friendship}%`} />
              </div>
              <p className="text-xs text-mist mt-1">{compatTierLabels[compat.tier] ?? compat.tier}</p>
            </>
          )}

          <Link to="/uygunluq" className="mt-auto pt-4 inline-block text-sm text-goldsoft hover:text-gold transition">
            {t("home.compatCta")}
          </Link>
        </div>
      </div>

      {/* Günün bələdçisi (Panchang) önizləməsi */}
      <section className="mb-10 rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{t("home.dailyGuideKicker")}</p>
            <h2 className="font-display text-2xl">{t("home.dailyGuideTitle")}</h2>
          </div>
          <Link to="/gunun-beledcisi" className="text-sm text-goldsoft hover:text-gold transition shrink-0">
            {t("home.dailyGuideCta")}
          </Link>
        </div>

        {guideLoading && <p className="text-mist text-sm">{t("home.dailyGuideLoading")}</p>}
        {!guideLoading && guideError && (
          <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {t("home.dailyGuideError")}
          </p>
        )}
        {!guideLoading && guide && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                <div className="text-mist text-[10px] tracking-[0.2em] uppercase mb-1">{t("dailyGuide.moonSign")}</div>
                <div className="font-display text-lg text-goldsoft">
                  {SIGN_SYMBOLS[guide.moonSign] ?? ""} {signLabel(guide.moonSign, lang).split(" ").slice(1).join(" ")}
                </div>
                <div className="text-xs text-mist mt-1">{guide.moonElement}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/5 px-4 py-3">
                <div className="text-mist text-[10px] tracking-[0.2em] uppercase mb-1">{t("dailyGuide.dayRuler")}</div>
                <div className="font-display text-lg text-goldsoft">{guide.dayRuler}</div>
                <div className="text-xs text-mist mt-1">
                  {t("dailyGuide.colorPrefix")} {guide.dayColor}
                </div>
              </div>
            </div>

            {guide.aspects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {guide.aspects.slice(0, 4).map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-gold"
                  >
                    <span className="text-white/90">{a.planetA}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white/90">{a.planetB}</span>
                    <span className="text-mist">({a.aspect})</span>
                  </span>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {guide.guidance.slice(0, 4).map((g, i) => (
                <div key={i} className={`rounded-xl border p-4 ${verdictClass(g.verdict)}`}>
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <h3 className="font-display text-sm text-white">{g.category}</h3>
                    <span className="text-[10px] uppercase tracking-widest shrink-0">{g.verdict}</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed line-clamp-2">{g.reason}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Sürətli keçidlər */}
      <section className="mb-10">
        <h2 className="font-display text-2xl mb-5">{t("home.quickLinksTitle")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-2xl border border-white/5 bg-celestial-card/50 p-5 hover:border-gold/40 transition group"
            >
              <div className="text-2xl mb-2.5">{link.icon}</div>
              <h3 className="font-display text-base text-white group-hover:text-goldsoft transition">{t(link.titleKey)}</h3>
              <p className="text-xs text-mist mt-1.5 leading-relaxed line-clamp-2">{t(link.subtitleKey)}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        {/* Abunəlik önizləməsi */}
        <section className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{t("home.subscriptionKicker")}</p>
          <h2 className="font-display text-xl mb-4">{t("home.subscriptionTitle")}</h2>

          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 p-4 flex items-center justify-between">
              <div>
                <p className="font-display text-base">{t("subscriptions.freeTitle")}</p>
                <p className="text-xs text-mist mt-0.5">{freeFeatures[0]}</p>
              </div>
              <span className="text-xs text-mist shrink-0 ml-3">{t("subscriptions.freeAlwaysButton")}</span>
            </div>

            {plans.map((p, i) => (
              <div
                key={p.key}
                className={
                  "rounded-xl border p-4 flex items-center justify-between " +
                  (i === plans.length - 1 && plans.length > 1 ? "border-gold/40 bg-gold/[0.04]" : "border-white/10")
                }
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-display text-base">{p.name}</p>
                    {i === plans.length - 1 && plans.length > 1 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold">{t("subscriptions.mostPopular")}</span>
                    )}
                  </div>
                  {p.tagline && <p className="text-xs text-mist mt-0.5">{p.tagline}</p>}
                </div>
                <span className="font-display text-sm text-gold shrink-0 ml-3">
                  {p.priceAzn} {t("subscriptions.perMonth")}
                </span>
              </div>
            ))}
          </div>

          <Link to="/abuneler" className="mt-5 inline-block text-sm text-goldsoft hover:text-gold transition">
            {t("home.subscriptionCta")}
          </Link>
        </section>

        {/* Mağaza önizləməsi */}
        <section className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
          <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{t("home.shopKicker")}</p>
          <h2 className="font-display text-xl mb-4">{t("home.shopTitle")}</h2>

          {products.length === 0 ? (
            <p className="text-sm text-mist">{t("home.shopEmpty")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => {
                const img = shopImgSrc(p.imageUrl);
                return (
                <div key={p.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3 flex flex-col">
                  <div className="aspect-square rounded-lg bg-ink2 grid place-items-center text-2xl mb-2 overflow-hidden">
                    {img ? (
                      <img src={img} alt={p.name} loading="lazy" className="size-full object-cover" />
                    ) : (
                      SHOP_PREVIEW_ICON[p.category] ?? "🛍"
                    )}
                  </div>
                  <p className="text-xs font-medium line-clamp-1">{pickLocalized(lang, p.name, p.nameEn, p.nameRu)}</p>
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-xs text-gold font-display">{p.priceAzn} AZN</span>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      disabled={p.stock <= 0}
                      className={
                        "text-[11px] px-2.5 py-1 rounded-full text-ink transition disabled:opacity-40 " +
                        (justAddedId === p.id ? "bg-goldsoft" : "bg-gold hover:bg-goldsoft")
                      }
                    >
                      {justAddedId === p.id ? "✓" : "+"}
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          <Link to="/magaza" className="mt-5 inline-block text-sm text-goldsoft hover:text-gold transition">
            {t("home.shopCta")}
          </Link>
        </section>
      </div>

      {/* Son çağırış */}
      <section className="rounded-2xl border border-gold/20 bg-gold/[0.04] p-8 text-center">
        <h2 className="font-display text-2xl md:text-3xl mb-3">{t("home.ctaTitle")}</h2>
        <p className="text-mist max-w-xl mx-auto mb-6">{t("home.ctaBody")}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/natal-xerite"
            className="px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            {t("home.ctaButton")}
          </Link>
          <Link
            to="/profil"
            className="px-6 py-3 rounded-full border border-white/15 text-mist hover:text-white transition text-sm"
          >
            {t("home.ctaSecondary")}
          </Link>
        </div>
      </section>
    </Page>
  );
}
