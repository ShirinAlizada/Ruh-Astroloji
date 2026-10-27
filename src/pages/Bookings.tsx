import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  bookingsApi,
  astrologersApi,
  ApiError,
  type BookingDto,
  type AstrologerDto,
} from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// DÜZƏLİŞ (2026-10-28): açarlar KİÇİK hərflə — backend `BookingDto.Status`-u
// `booking.Status.ToString().ToLower()` ilə qaytarır (bax BookingService.cs), əvvəlki
// böyük-hərfli açarlar heç vaxt uyğun gəlmirdi (status badge həmişə defolt rəngdə
// görünürdü, "Ləğv et" düyməsi də HEÇ VAXT görünmürdü, çünki "Pending" === "pending" false-dur).
const STATUS_CLASS: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  confirmed: "border-gold/40 text-goldsoft",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-white/15 bg-white/[0.02] text-mist",
};

function defaultScheduledAt(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
}

// DÜZƏLİŞ (2026-10-27): keçmiş tarix/saat seçilə bilməsin — "min" atributu
// native datetime-local kalendarında keçmiş günləri boz (deaktiv) göstərir.
function nowForMin(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

export default function BookingsPage() {
  const { t, locale } = useI18n();
  const STATUS_LABELS: Record<string, string> = {
    pending: t("bookings.statusPending"),
    confirmed: t("bookings.statusConfirmed"),
    completed: t("bookings.statusCompleted"),
    cancelled: t("bookings.statusCancelled"),
  };
  const [searchParams] = useSearchParams();

  const [astrologers, setAstrologers] = useState<AstrologerDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [astrologerId, setAstrologerId] = useState(searchParams.get("astrologerId") ?? "");
  const [sessionType, setSessionType] = useState("Live");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt());
  const [note, setNote] = useState("");
  const minScheduledAt = nowForMin();

  function refreshBookings() {
    return bookingsApi
      .myBookings()
      .then((list) => setBookings([...list].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt))))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("bookings.errLoad")));
  }

  useEffect(() => {
    Promise.all([
      astrologersApi.list().then((list) => {
        setAstrologers(list);
        if (!astrologerId && list.length > 0) setAstrologerId(list[0].id);
      }),
      refreshBookings(),
    ])
      .catch((err) => setError(err instanceof ApiError ? err.message : t("bookings.errLoadGeneric")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await bookingsApi.create({
        astrologerId,
        sessionType,
        // <input type="datetime-local"> saniyəsiz "YYYY-MM-DDTHH:mm" qaytarır —
        // backend-in DateTime JSON parseri üçün tam dəqiqliyə gətiririk.
        scheduledAt: scheduledAt.length === 16 ? `${scheduledAt}:00` : scheduledAt,
        note: note || null,
      });
      setNote("");
      await refreshBookings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("bookings.errCreate"));
    } finally {
      setSaving(false);
    }
  }

  async function cancel(id: string) {
    if (!window.confirm(t("bookings.cancelConfirm"))) return;
    setError(null);
    try {
      await bookingsApi.updateStatus(id, "Cancelled");
      await refreshBookings();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("bookings.errCancel"));
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  return (
    <Page>
      <PageHeader kicker={t("bookings.kicker")} title={t("bookings.title")} subtitle={t("bookings.subtitle")} />

      {loading && <p className="text-center text-mist text-sm">{t("common.loading")}</p>}

      {!loading && (
        <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-8 space-y-4">
          <h2 className="font-display text-xl mb-1 text-center">{t("bookings.formTitle")}</h2>

          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          {astrologers.length === 0 ? (
            <p className="text-center text-mist text-sm">{t("bookings.noAstrologers")}</p>
          ) : (
            <>
              <div>
                <label className={labelClass}>{t("bookings.astrologer")}</label>
                <select className={inputClass} value={astrologerId} onChange={(e) => setAstrologerId(e.target.value)}>
                  {astrologers.map((a) => (
                    <option key={a.id} value={a.id} className="bg-ink">
                      {a.displayName} {a.title ? `· ${a.title}` : ""} — {a.priceAzn} AZN
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("bookings.sessionType")}</label>
                  <select className={inputClass} value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
                    <option value="Live" className="bg-ink">{t("bookings.sessionLive")}</option>
                    <option value="Written" className="bg-ink">{t("bookings.sessionWritten")}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t("bookings.dateTime")}</label>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={scheduledAt}
                    min={minScheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("bookings.note")}</label>
                <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
              >
                {saving ? t("bookings.submitting") : t("bookings.submit")}
              </button>
            </>
          )}
        </form>
      )}

      {!loading && bookings.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-celestial-card/60 p-8 text-center">
          <p className="text-mist">{t("bookings.emptyTitle")}</p>
          <Link
            to="/astroloqlar"
            className="inline-block mt-4 px-5 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            {t("bookings.pickAstrologer")}
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <div key={b.id} className="rounded-2xl bg-celestial-card/60 border border-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{b.astrologerName}</h2>
                  {b.astrologerTitle && <p className="text-mist text-xs mt-0.5">{b.astrologerTitle}</p>}
                </div>
                <span className={"text-xs px-3 py-1 rounded-full border " + (STATUS_CLASS[b.status] ?? "border-white/15 text-mist")}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
              <div className="mt-4 text-sm text-mist space-y-1">
                <div>
                  {t("bookings.date")} <span className="text-white">{new Date(b.scheduledAt).toLocaleString(locale, { hour12: false })}</span>
                </div>
                <div>
                  {t("bookings.type")} <span className="text-white">{b.sessionType === "live" ? t("bookings.sessionTypeLive") : t("bookings.sessionTypeWritten")}</span>
                </div>
                {b.note && (
                  <div>
                    {t("bookings.noteLabel")} <span className="text-white">{b.note}</span>
                  </div>
                )}
              </div>
              {(b.status === "pending" || b.status === "confirmed") && (
                <button
                  type="button"
                  onClick={() => cancel(b.id)}
                  className="mt-4 text-xs px-4 py-2 rounded-full border border-white/10 text-mist hover:text-red-300 transition"
                >
                  {t("bookings.cancel")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Page>
  );
}
