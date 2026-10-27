import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import AdminLayout, { ICONS } from "../../components/AdminLayout";
import { adminApi, type AdminOverviewStatsDto, type DailyRevenuePointDto } from "../../lib/api";

const cardCls = "rounded-3xl border border-white/10 bg-white/[0.03] p-7";

const SECTIONS = [
  { to: "/admin/users", title: "İstifadəçilər", blurb: "Qeydiyyat, rol dəyişmə və status idarəetməsi.", icon: "users" },
  { to: "/admin/contact", title: "Əlaqə mesajları", blurb: "Gələn mesajlara baxış, oxunmuş kimi işarələmə.", icon: "mail" },
  { to: "/admin/articles", title: "Məqalələr", blurb: "Qəzet məqalələri, AI ilə yaratma, dərc/qaralama.", icon: "article" },
  { to: "/admin/astrologers", title: "Astroloqlar", blurb: "Profil redaktəsi, təsdiqləmə, qiymət.", icon: "star" },
  { to: "/admin/bookings", title: "Rezervasiyalar", blurb: "İstifadəçi-astroloq görüşlərinə baxış.", icon: "calendar" },
  { to: "/admin/horoscopes", title: "Horoskoplar", blurb: "Gündəlik/həftəlik bürc proqnozlarının yaradılması.", icon: "moon" },
  { to: "/admin/forum", title: "Forum moderasiyası", blurb: "Mövzu/rəyləri gizlət, admin adından məzmun əlavə et.", icon: "forum" },
  { to: "/admin/shop", title: "Mağaza", blurb: "Məhsul kataloqu, sifariş statusları, satış statistikası.", icon: "shop" },
  { to: "/admin/subscriptions", title: "Abunəlik paketləri", blurb: "Paket qiymət, dövriyyə və xüsusiyyətləri.", icon: "card" },
] as const;

// DÜZƏLİŞ (2026-10-27): böyük rəqəmlərin statik görünməsi əvəzinə yüklənəndə yumşaq
// "say-yuxarı" animasiyası ilə canlanması üçün — requestAnimationFrame ilə, əlavə
// kitabxana olmadan. target null olanda (hələ yüklənmirsə) "—" göstərilir.
function useCountUp(target: number | null, durationMs = 900): number | null {
  const [value, setValue] = useState<number | null>(target);

  useEffect(() => {
    if (target == null) {
      setValue(null);
      return;
    }
    let raf = 0;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

function StatCard({
  icon,
  label,
  value,
  accent = "gold",
  suffix,
  delayMs = 0,
}: {
  icon: ReactNode;
  label: string;
  value: number | null;
  accent?: "gold" | "amber" | "violet";
  suffix?: string;
  delayMs?: number;
}) {
  const animated = useCountUp(value);
  const accentCls =
    accent === "amber" ? "text-amber-300 border-amber-400/30 bg-amber-400/10" :
    accent === "violet" ? "text-violet border-violet/30 bg-violet/10" :
    "text-gold border-gold/30 bg-gold/10";
  return (
    <div
      className={cardCls + " animate-rise-in transition hover:border-gold/25"}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-[#8b84a8]">{label}</div>
        <span className={"size-8 grid place-items-center rounded-full border " + accentCls}>{icon}</span>
      </div>
      <div className="text-3xl font-display text-[#F3EFE6] tabular-nums">
        {animated == null ? "—" : `${animated.toLocaleString("az-AZ")}${suffix ?? ""}`}
      </div>
    </div>
  );
}

// Son 14 günün gəlir trendini göstərən yüngül, xarici kitabxanasız SVG qrafik —
// nöqtələr arasından yumşaq keçid üçün hər cüt arasında "orta nöqtəyə" kvadratik
// əyri çəkilir (standart, təhlükəsiz "smooth through midpoints" texnikası).
function RevenueTrendChart({ points }: { points: DailyRevenuePointDto[] }) {
  if (points.length === 0) return null;

  const W = 640;
  const H = 150;
  const padX = 6;
  const padTop = 10;
  const padBottom = 10;
  const maxAzn = Math.max(...points.map((p) => p.azn), 1);

  const coords = points.map((p, i) => ({
    x: padX + (i * (W - padX * 2)) / Math.max(1, points.length - 1),
    y: padTop + (H - padTop - padBottom) * (1 - p.azn / maxAzn),
  }));

  function smoothLinePath(pts: { x: number; y: number }[]): string {
    if (pts.length === 1) return `M ${pts[0]!.x} ${pts[0]!.y}`;
    let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
    for (let i = 0; i < pts.length - 2; i++) {
      const cur = pts[i + 1]!;
      const next = pts[i + 2]!;
      const mx = (cur.x + next.x) / 2;
      const my = (cur.y + next.y) / 2;
      d += ` Q ${cur.x} ${cur.y} ${mx} ${my}`;
    }
    const last = pts[pts.length - 1]!;
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  const linePath = smoothLinePath(coords);
  const areaPath = `${linePath} L ${coords[coords.length - 1]!.x} ${H - padBottom} L ${coords[0]!.x} ${H - padBottom} Z`;

  return (
    <div className="animate-rise-in" style={{ animationDelay: "160ms" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[150px] overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4af37" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#revTrendFill)" />
        <path d={linePath} fill="none" stroke="#e7ce88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === coords.length - 1 ? 3.5 : 2} fill="#e7ce88" />
        ))}
      </svg>
      <div className="flex justify-between mt-1.5">
        {points.map((p, i) => (
          <span key={i} className="text-[9px] text-[#6b6485] tabular-nums">
            {p.date.slice(5, 10).replace("-", "/")}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [unreadContact, setUnreadContact] = useState<number | null>(null);
  const [pendingBookings, setPendingBookings] = useState<number | null>(null);
  const [overview, setOverview] = useState<AdminOverviewStatsDto | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [users, contact, bookings, stats] = await Promise.all([
          adminApi.users.list(),
          adminApi.contactMessages.list(),
          adminApi.bookings.list(),
          adminApi.overviewStats(),
        ]);
        setUserCount(users.length);
        setUnreadContact(contact.filter((c) => !c.isRead).length);
        setPendingBookings(bookings.filter((b) => b.status === "Pending").length);
        setOverview(stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Məlumatlar yüklənərkən xəta baş verdi.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const maxUnits = Math.max(...(overview?.topProducts.map((p) => p.unitsSold) ?? [0]), 1);

  return (
    <AdminLayout>
      <div className="mb-7">
        <h1 className="font-display text-3xl">Ümumi baxış</h1>
        <p className="text-sm text-mist mt-1">Platformanın bugünkü vəziyyətinin qısa xülasəsi.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={ICONS.users} label="İstifadəçilər" value={userCount} delayMs={0} />
        <StatCard
          icon={ICONS.mail}
          label="Oxunmamış mesaj"
          value={unreadContact}
          accent={!loading && unreadContact ? "amber" : "gold"}
          delayMs={40}
        />
        <StatCard
          icon={ICONS.calendar}
          label="Gözləyən görüş"
          value={pendingBookings}
          accent={!loading && pendingBookings ? "amber" : "gold"}
          delayMs={80}
        />
      </div>

      {/* Satış paneli — mağaza + abunəlik gəlirini birləşdirən icmal (bax: AdminController.GetOverviewStats). */}
      <div className="mb-3 flex items-center gap-2.5">
        <h2 className="font-display text-xl">Satış paneli</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={ICONS.coin} label="Ümumi gəlir (AZN)" value={overview?.totalRevenueAzn ?? null} delayMs={0} />
        <StatCard icon={ICONS.shop} label="Mağaza gəliri (AZN)" value={overview?.shopRevenueAzn ?? null} accent="violet" delayMs={40} />
        <StatCard icon={ICONS.card} label="Abunəlik gəliri (AZN)" value={overview?.subscriptionRevenueAzn ?? null} accent="violet" delayMs={80} />
        <StatCard icon={ICONS.users} label="Aktiv abunəçi" value={overview?.activeSubscribers ?? null} delayMs={120} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        <div className={cardCls + " lg:col-span-2 animate-rise-in"} style={{ animationDelay: "120ms" }}>
          <h3 className="text-sm text-[#8b84a8] mb-1">Son 14 gün — gəlir trendi (AZN)</h3>
          {!loading && overview && overview.dailyRevenue.length > 0 ? (
            <RevenueTrendChart points={overview.dailyRevenue} />
          ) : (
            <p className="text-sm text-mist mt-4">{loading ? "Yüklənir…" : "Hələ məlumat yoxdur."}</p>
          )}
        </div>

        <div className={cardCls + " animate-rise-in"} style={{ animationDelay: "160ms" }}>
          <h3 className="text-sm text-[#8b84a8] mb-4">Ən çox satılan məhsullar</h3>
          {!loading && overview && overview.topProducts.length > 0 ? (
            <div className="space-y-3.5">
              {overview.topProducts.map((p, i) => (
                <div key={p.productId || p.productName} className="animate-rise-in" style={{ animationDelay: `${200 + i * 70}ms` }}>
                  <div className="flex items-center justify-between text-sm mb-1 gap-2">
                    <span className="text-[#F3EFE6] truncate">
                      <span className="text-[#6b6485] mr-1">{i + 1}.</span>
                      {p.productName}
                    </span>
                    <span className="text-mist text-xs shrink-0">{p.unitsSold} ədəd</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-goldsoft transition-all duration-700 ease-out"
                      style={{ width: `${(p.unitsSold / maxUnits) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist">{loading ? "Yüklənir…" : "Hələ satış yoxdur."}</p>
          )}
        </div>
      </div>

      <h2 className="font-display text-xl mb-4">Bölmələr</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className={
              cardCls +
              " block hover:border-gold/40 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-14px_rgba(212,175,55,0.35)] transition-all duration-300 group animate-rise-in"
            }
            style={{ animationDelay: `${260 + i * 40}ms` }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="size-9 grid place-items-center rounded-full border border-white/10 text-mist group-hover:border-gold/40 group-hover:text-gold transition">
                {ICONS[s.icon]}
              </span>
              <div className="text-lg font-display text-[#F3EFE6]">{s.title}</div>
            </div>
            <div className="text-sm text-mist">{s.blurb}</div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
