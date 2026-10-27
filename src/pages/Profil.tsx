import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { profileApi, subscriptionApi, ApiError, type ProfileDto, type UserSubscriptionDto } from "../lib/api";
import { signLabel } from "../lib/signs";
import { CITIES, findCity } from "../lib/cities";
import { Page, PageHeader } from "../components/Page";
import { TimeSelect24 } from "../components/TimeSelect24";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın routes/_authenticated/profil.tsx-indəki iki sütunlu
// tərtibat: sol — doğum məlumatları formu (avatar + Ad Soyad + tarix/saat/yer
// + haqqımda), sağ — "Səmavi imzan" (sürətli keçidlər) və "Abunəlik" kartları.
// Natal Xəritə artıq ayrıca nav elementi deyil — bura, "Natal xəritəm"
// düyməsinə köçürülüb (marşrutun özü /natal-xerite saxlanılır).

const API_ORIGIN = "https://localhost:7168";

function avatarSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

export default function ProfilPage() {
  const { t, locale, lang } = useI18n();
  const STATUS_LABELS: Record<string, string> = {
    active: t("profile.statusActive"),
    cancelled: t("profile.statusCancelled"),
    expired: t("profile.statusExpired"),
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [mySub, setMySub] = useState<UserSubscriptionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("Bakı");
  const [bio, setBio] = useState("");

  function loadSubscription() {
    subscriptionApi
      .me()
      .then(setMySub)
      .catch(() => setMySub(null));
  }

  useEffect(() => {
    Promise.all([
      profileApi.getMe().then((p) => {
        setProfile(p);
        setFullName(p.fullName ?? "");
        setBirthDate(p.birthDate ?? "");
        setBirthTime(p.birthTime ?? "");
        setBirthPlace(p.birthPlace && findCity(p.birthPlace) ? p.birthPlace : "Bakı");
        setBio(p.bio ?? "");
      }),
      Promise.resolve(loadSubscription()),
    ])
      .catch((err) => setError(err instanceof ApiError ? err.message : t("profile.errLoad")))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      const city = findCity(birthPlace);
      const updated = await profileApi.updateMe({
        fullName: fullName || null,
        birthDate: birthDate || null,
        birthTime: birthTime || null,
        birthPlace: city ? city.name : null,
        birthLat: city ? city.lat : null,
        birthLon: city ? city.lon : null,
        bio: bio || null,
      });
      setProfile(updated);
      setNotice(t("profile.savedNotice"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("profile.errSave"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      setProfile(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("profile.errAvatar"));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function cancelSubscription() {
    if (!confirm(t("profile.cancelConfirm"))) return;
    setCancelBusy(true);
    try {
      await subscriptionApi.cancel();
      loadSubscription();
    } catch {
      /* best-effort — Abunələr səhifəsində ətraflı xəta mesajı var */
    } finally {
      setCancelBusy(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  if (loading) {
    return <div className="min-h-screen bg-ink grid place-items-center text-mist text-sm">{t("common.loading")}</div>;
  }

  const avatar = avatarSrc(profile?.avatarUrl ?? null);

  return (
    <Page>
      <PageHeader kicker={t("profile.kicker")} title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 rounded-2xl bg-celestial-card/60 border border-white/5 p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
          )}
          {notice && (
            <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">{notice}</p>
          )}

          <div className="flex items-center gap-4">
            <div className="size-16 shrink-0 rounded-full overflow-hidden border border-gold/40 bg-white/5 grid place-items-center text-xl text-mist/70">
              {avatar ? <img src={avatar} alt="Avatar" className="size-full object-cover" /> : "☾"}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-xs font-semibold px-4 py-2 rounded-full border border-gold/40 text-goldsoft hover:bg-gold/10 transition disabled:opacity-60"
              >
                {uploadingAvatar ? t("profile.uploading") : t("profile.uploadPhoto")}
              </button>
              <p className="text-[11px] text-mist/70 mt-1.5">{t("profile.photoHint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={handleAvatarPick}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("profile.fullName")}</label>
            <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t("profile.birthDate")}</label>
              <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t("profile.birthTime")}</label>
              <TimeSelect24 value={birthTime} onChange={setBirthTime} />
            </div>
            <div>
              <label className={labelClass}>{t("profile.birthPlace")}</label>
              <select className={inputClass} value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-ink">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t("profile.bio")}</label>
            <textarea className={inputClass} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
          >
            {saving ? t("profile.submitting") : t("profile.submit")}
          </button>
        </form>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">{t("profile.heavenlySignature")}</p>
            <div className="space-y-3 text-sm">
              {[
                [t("profile.sun"), profile?.sunSign],
                [t("profile.moon"), profile?.moonSign],
                [t("profile.ascendant"), profile?.ascendant],
              ].map(([label, sign]) => (
                <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-mist">{label}</span>
                  <span className="text-white">{signLabel(sign, lang)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-2">
              <Link
                to="/natal-xerite"
                className="text-center text-sm px-4 py-2.5 rounded-full border border-gold/40 text-goldsoft hover:bg-gold/10 transition"
              >
                {t("profile.myNatalChart")}
              </Link>
              <Link
                to="/goruslerim"
                className="text-center text-sm px-4 py-2.5 rounded-full border border-white/10 text-mist hover:text-white transition"
              >
                {t("profile.myBookings")}
              </Link>
              <Link
                to="/magaza"
                className="text-center text-sm px-4 py-2.5 rounded-full border border-white/10 text-mist hover:text-white transition"
              >
                {t("profile.myOrders")}
              </Link>
              <Link
                to="/abuneler"
                className="text-center text-sm px-4 py-2.5 rounded-full border border-white/10 text-mist hover:text-white transition"
              >
                {t("profile.myPayments")}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-6">
            <p className="text-gold text-xs tracking-[0.3em] uppercase mb-4">{t("profile.subscription")}</p>
            {mySub ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg">{mySub.planKey}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full border border-gold/40 text-gold">
                    {STATUS_LABELS[mySub.status] ?? mySub.status}
                  </span>
                </div>
                <p className="text-xs text-mist/70 mt-1.5">
                  {t("profile.endDate")}: {new Date(mySub.currentPeriodEnd).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="mt-5 grid gap-2">
                  <Link
                    to="/abuneler"
                    className="text-center text-sm px-4 py-2.5 rounded-full border border-gold/40 text-goldsoft hover:bg-gold/10 transition"
                  >
                    {t("profile.upgradePlan")}
                  </Link>
                  {mySub.status === "active" && (
                    <button
                      type="button"
                      onClick={cancelSubscription}
                      disabled={cancelBusy}
                      className="text-sm px-4 py-2.5 rounded-full border border-red-400/30 text-red-300 hover:bg-red-400/10 transition disabled:opacity-50"
                    >
                      {cancelBusy ? t("profile.cancelling") : t("profile.cancelSubscription")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-mist">{t("profile.noActivePlan")}</p>
                <Link
                  to="/abuneler"
                  className="mt-5 block text-center text-sm px-4 py-2.5 rounded-full bg-gold text-ink font-semibold hover:bg-goldsoft transition"
                >
                  {t("profile.viewPlans")}
                </Link>
              </>
            )}
          </div>
        </aside>
      </div>
    </Page>
  );
}
