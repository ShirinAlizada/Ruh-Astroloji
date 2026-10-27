import { useEffect, useState, type FormEvent } from "react";
import { astrologersApi, bookingsApi, ApiError, type AstrologerDto, type BookingDto } from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// DÜZƏLİŞ (2026-10-28): rol=Astrologer olan istifadəçilər üçün /astroloq-panelim —
// admin panelinə getmədən öz profilini redaktə edib özünə edilən rezervasiyaları
// idarə etsin (bax AstrologerRoute.tsx, App.tsx-dəki /profil yönləndirməsi).

// DÜQQƏT: backend `BookingDto.Status`/`SessionType`-i KİÇİK HƏRFLƏ qaytarır
// (`booking.Status.ToString().ToLower()` — bax BookingService.cs), ona görə açarlar
// bura da kiçik hərflə yazılmalıdır (Bookings.tsx-dəki böyük-hərfli naxışdan FƏRQLİ
// olaraq — həmin fayldakı eyni naxış əslində səhvdir, bax aşağıdakı qeyd).
const STATUS_CLASS: Record<string, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  confirmed: "border-gold/40 text-goldsoft",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-white/15 bg-white/[0.02] text-mist",
};

interface FormState {
  displayName: string;
  title: string;
  bio: string;
  specialties: string;
  languages: string;
  priceAzn: string;
  avatarUrl: string;
  titleEn: string;
  titleRu: string;
  bioEn: string;
  bioRu: string;
}

const EMPTY_FORM: FormState = {
  displayName: "",
  title: "",
  bio: "",
  specialties: "",
  languages: "",
  priceAzn: "0",
  avatarUrl: "",
  titleEn: "",
  titleRu: "",
  bioEn: "",
  bioRu: "",
};

function splitList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function fromDto(a: AstrologerDto): FormState {
  return {
    displayName: a.displayName,
    title: a.title ?? "",
    bio: a.bio ?? "",
    specialties: a.specialties.join(", "),
    languages: a.languages.join(", "),
    priceAzn: String(a.priceAzn),
    avatarUrl: a.avatarUrl ?? "",
    titleEn: a.titleEn ?? "",
    titleRu: a.titleRu ?? "",
    bioEn: a.bioEn ?? "",
    bioRu: a.bioRu ?? "",
  };
}

export default function AstrologerDashboardPage() {
  const { t, locale } = useI18n();
  const STATUS_LABELS: Record<string, string> = {
    pending: t("bookings.statusPending"),
    confirmed: t("bookings.statusConfirmed"),
    completed: t("bookings.statusCompleted"),
    cancelled: t("bookings.statusCancelled"),
  };

  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<AstrologerDto | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const me = await astrologersApi.me();
        setProfile(me);
        setForm(fromDto(me));
        const list = await bookingsApi.astrologerBookings();
        setBookings([...list].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotLinked(true);
        } else {
          setError(err instanceof ApiError ? err.message : t("astrologerDashboard.errLoad"));
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await astrologersApi.updateMe({
        displayName: form.displayName,
        title: form.title || null,
        bio: form.bio || null,
        specialties: splitList(form.specialties),
        languages: splitList(form.languages),
        priceAzn: Number(form.priceAzn) || 0,
        avatarUrl: form.avatarUrl || null,
        titleEn: form.titleEn || null,
        titleRu: form.titleRu || null,
        bioEn: form.bioEn || null,
        bioRu: form.bioRu || null,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("astrologerDashboard.errSave"));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, status: string) {
    setBusyBookingId(id);
    setError(null);
    try {
      const updated = await bookingsApi.updateStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: updated.status } : b)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("astrologerDashboard.errSave"));
    } finally {
      setBusyBookingId(null);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  return (
    <Page>
      <PageHeader
        kicker={t("astrologerDashboard.kicker")}
        title={t("astrologerDashboard.title")}
        subtitle={t("astrologerDashboard.subtitle")}
      />

      {loading && <p className="text-center text-mist text-sm">{t("common.loading")}</p>}

      {!loading && notLinked && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center">
          <p className="font-display text-xl mb-2">{t("astrologerDashboard.notLinkedTitle")}</p>
          <p className="text-sm text-amber-200/90">{t("astrologerDashboard.notLinkedBody")}</p>
        </div>
      )}

      {!loading && !notLinked && (
        <>
          {error && (
            <p className="mb-5 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <section className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-8">
            <h2 className="font-display text-xl mb-5">{t("astrologerDashboard.bookingsTitle")}</h2>

            {bookings.length === 0 ? (
              <p className="text-mist text-sm">{t("astrologerDashboard.bookingsEmpty")}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-mist">{t("astrologerDashboard.client")}</p>
                        <p className="font-medium">{b.userFullName ?? b.userId}</p>
                        {b.userEmail && <p className="text-xs text-mist">{b.userEmail}</p>}
                      </div>
                      <span className={"text-xs px-3 py-1 rounded-full border " + (STATUS_CLASS[b.status] ?? "border-white/15 text-mist")}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-mist space-y-1">
                      <div>
                        {t("bookings.date")}{" "}
                        <span className="text-white">{new Date(b.scheduledAt).toLocaleString(locale, { hour12: false })}</span>
                      </div>
                      <div>
                        {t("bookings.type")}{" "}
                        <span className="text-white">
                          {b.sessionType === "live" ? t("bookings.sessionTypeLive") : t("bookings.sessionTypeWritten")}
                        </span>
                      </div>
                      {b.note && (
                        <div>
                          {t("bookings.noteLabel")} <span className="text-white">{b.note}</span>
                        </div>
                      )}
                    </div>
                    {(b.status === "pending" || b.status === "confirmed") && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {b.status === "pending" && (
                          <button
                            type="button"
                            disabled={busyBookingId === b.id}
                            onClick={() => changeStatus(b.id, "Confirmed")}
                            className="text-xs px-4 py-2 rounded-full bg-gold text-ink font-medium hover:bg-goldsoft transition disabled:opacity-50"
                          >
                            {t("astrologerDashboard.confirm")}
                          </button>
                        )}
                        {b.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={busyBookingId === b.id}
                            onClick={() => changeStatus(b.id, "Completed")}
                            className="text-xs px-4 py-2 rounded-full bg-gold text-ink font-medium hover:bg-goldsoft transition disabled:opacity-50"
                          >
                            {t("astrologerDashboard.complete")}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyBookingId === b.id}
                          onClick={() => changeStatus(b.id, "Cancelled")}
                          className="text-xs px-4 py-2 rounded-full border border-white/10 text-mist hover:text-red-300 transition disabled:opacity-50"
                        >
                          {t("astrologerDashboard.cancel")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7">
            <h2 className="font-display text-xl mb-5">{t("astrologerDashboard.profileTitle")}</h2>

            <form onSubmit={saveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t("astrologerDashboard.displayName")}</label>
                <input
                  className={inputClass}
                  required
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.titleLabel")}</label>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("astrologerDashboard.bio")}</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.specialties")}</label>
                <input
                  className={inputClass}
                  placeholder="natal xəritə, tarot, uyğunluq"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.languages")}</label>
                <input
                  className={inputClass}
                  placeholder="az, en, ru"
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.price")}</label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={form.priceAzn}
                  onChange={(e) => setForm({ ...form, priceAzn: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.avatarUrl")}</label>
                <input
                  className={inputClass}
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 border-t border-white/10 pt-4 text-xs text-mist">
                {t("astrologerDashboard.translationsHint")}
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.titleLabel")} (EN)</label>
                <input
                  className={inputClass}
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.titleLabel")} (RU)</label>
                <input
                  className={inputClass}
                  value={form.titleRu}
                  onChange={(e) => setForm({ ...form, titleRu: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.bio")} (EN)</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.bioEn}
                  onChange={(e) => setForm({ ...form, bioEn: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>{t("astrologerDashboard.bio")} (RU)</label>
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.bioRu}
                  onChange={(e) => setForm({ ...form, bioRu: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
                >
                  {saving ? t("astrologerDashboard.saving") : t("astrologerDashboard.save")}
                </button>
                {saved && <span className="text-xs text-emerald-300">{t("astrologerDashboard.profileSaved")}</span>}
                {profile && !profile.verified && (
                  <span className="text-xs text-amber-300 ml-auto">{t("astrologerDashboard.notVerifiedBadge")}</span>
                )}
              </div>
            </form>
          </section>
        </>
      )}
    </Page>
  );
}
