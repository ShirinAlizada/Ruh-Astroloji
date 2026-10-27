import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  subscriptionApi,
  ApiError,
  type SubscriptionPlanDto,
  type UserSubscriptionDto,
  type PaymentTransactionDto,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// Qeyd: SubscriptionPlanDto (istifadəçi tərəfi) backend-də *En/*Ru bacı
// sahələrinə malik deyil (yalnız AdminSubscriptionPlanDto-da var) — ona görə
// p.name/p.tagline/p.features backend-in qaytardığı dildə (AZ) qalır, yalnız
// ətrafdakı UI mətni (başlıqlar, düymələr) tərcümə olunur.

// Standart/Premium illik qiyməti: aylıq qiymət × 12 ay × 20% endirim.
function annualPrice(monthlyAzn: number): number {
  return Math.round(monthlyAzn * 12 * 0.8);
}

function PaymentModal({
  plan,
  price,
  period,
  busy,
  onClose,
  onConfirm,
}: {
  plan: SubscriptionPlanDto;
  price: number;
  period: "monthly" | "yearly";
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onConfirm();
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/50 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-ink2 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          className="absolute top-4 right-4 text-mist hover:text-white transition"
        >
          ✕
        </button>
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">{plan.name}</p>
        <p className="font-display text-2xl mb-5">
          {price} AZN <span className="text-sm text-mist font-sans">/ {period === "yearly" ? t("subscriptions.unitYear") : t("subscriptions.unitMonth")}</span>
        </p>

        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className={labelClass}>{t("paymentModal.cardholderName")}</label>
            <input
              className={inputClass}
              placeholder={t("paymentModal.cardholderPlaceholder")}
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>{t("paymentModal.cardNumber")}</label>
            <input
              className={inputClass}
              placeholder={t("paymentModal.cardNumberPlaceholder")}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
              inputMode="numeric"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t("paymentModal.expiry")}</label>
              <input
                className={inputClass}
                placeholder={t("paymentModal.expiryPlaceholder")}
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("paymentModal.cvv")}</label>
              <input className={inputClass} placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} required inputMode="numeric" />
            </div>
          </div>

          <p className="text-[11px] text-mist/70 leading-relaxed">{t("paymentModal.disclaimer")}</p>

          <button
            type="submit"
            disabled={busy}
            className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
          >
            {busy ? t("paymentModal.paying") : t("paymentModal.payButton", { amount: price })}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { t, locale, lang } = useI18n();
  const BILLING_LABELS: Record<string, string> = { monthly: t("subscriptions.unitMonth"), yearly: t("subscriptions.unitYear") };
  // AstroBackend.Domain.Entities.UserSubscription.Status — "active" | "cancelled" | "expired" (kiçik hərflə).
  const STATUS_LABELS: Record<string, string> = {
    active: t("subscriptions.statusActive"),
    cancelled: t("subscriptions.statusCancelled"),
    expired: t("subscriptions.statusExpired"),
  };
  // "Pulsuz" paket AstroBackend-də DB sətri kimi mövcud deyil (heç bir aktiv
  // abunəliyi olmayan istifadəçi üçün /Subscriptions/me null qaytarır) — ona
  // görə bu kart tamam statik/frontend-only-dur, satın alına bilməz.
  const FREE_FEATURES = [t("subscriptions.freeFeature1"), t("subscriptions.freeFeature2"), t("subscriptions.freeFeature3")];

  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [mySub, setMySub] = useState<UserSubscriptionDto | null>(null);
  const [payments, setPayments] = useState<PaymentTransactionDto[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [payModalPlan, setPayModalPlan] = useState<SubscriptionPlanDto | null>(null);

  function refreshMine() {
    if (!user) return Promise.resolve();
    return Promise.all([
      subscriptionApi.me().then(setMySub).catch(() => {}),
      subscriptionApi.payments().then(setPayments).catch(() => {}),
    ]).then(() => {});
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([subscriptionApi.plans(lang).then(setPlans), refreshMine()])
      .catch((err) => setError(err instanceof ApiError ? err.message : t("subscriptions.errLoad")))
      .finally(() => setLoading(false));
    // DÜZƏLİŞ (2026-10-27): `lang` deps-ə əlavə olundu — əvvəllər dil
    // dəyişəndə paket adı/tagline/features HƏMİŞƏ AZ qalırdı.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lang]);

  async function confirmPurchase() {
    const plan = payModalPlan;
    if (!plan || !user) return;
    setBusyKey(plan.key);
    setError(null);
    setNotice(null);
    try {
      const sub = await subscriptionApi.purchase({ planKey: plan.key, billingPeriod });
      setMySub(sub);
      setNotice(t("subscriptions.purchaseSuccess"));
      setPayModalPlan(null);
      await refreshMine();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscriptions.errPurchase"));
    } finally {
      setBusyKey(null);
    }
  }

  async function cancel() {
    if (!confirm(t("profile.cancelConfirm"))) return;
    setBusyKey("__cancel__");
    setError(null);
    try {
      await subscriptionApi.cancel();
      setNotice(t("subscriptions.cancelSuccess"));
      await refreshMine();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscriptions.errCancel"));
    } finally {
      setBusyKey(null);
    }
  }

  const premiumKey = plans.length > 1 ? plans[plans.length - 1].key : null;
  const modalPrice = payModalPlan
    ? billingPeriod === "yearly"
      ? annualPrice(payModalPlan.priceAzn)
      : payModalPlan.priceAzn
    : 0;

  return (
    <Page>
      <PageHeader kicker={t("subscriptions.kicker")} title={t("subscriptions.title")} subtitle={t("subscriptions.subtitle")} />

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-6">
          {notice}
        </p>
      )}

      {!user && (
        <p className="text-sm text-mist bg-celestial-card/40 border border-white/10 rounded-xl px-4 py-2.5 mb-6">
          {t("forum.loginToPost")}{" "}
          <Link to="/giris" className="text-gold hover:text-goldsoft transition">
            {t("forum.loginLink")}
          </Link>
          .
        </p>
      )}

      {user && mySub && (
        <div className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 mb-8">
          <p className="text-sm text-mist mb-1">{t("subscriptions.yourPlan")}</p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-display text-lg">{mySub.planKey}</span>
              <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full border border-gold/40 text-gold">
                {STATUS_LABELS[mySub.status] ?? mySub.status}
              </span>
              <p className="text-xs text-mist/70 mt-1">
                {BILLING_LABELS[mySub.billingPeriod] ?? mySub.billingPeriod} · {t("profile.endDate").toLowerCase()}{" "}
                {new Date(mySub.currentPeriodEnd).toLocaleDateString(locale)}
              </p>
            </div>
            {mySub.status === "active" && (
              <button
                onClick={cancel}
                disabled={busyKey === "__cancel__"}
                className="text-xs px-4 py-1.5 rounded-full border border-red-400/40 text-red-300 hover:bg-red-400/10 transition disabled:opacity-50"
              >
                {busyKey === "__cancel__" ? t("profile.cancelling") : t("common.cancel")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={
              "text-sm px-5 py-2 rounded-full transition " +
              (billingPeriod === "monthly" ? "bg-gold text-ink font-semibold" : "text-mist hover:text-white")
            }
          >
            {t("subscriptions.monthly")}
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={
              "flex items-center gap-1.5 text-sm px-5 py-2 rounded-full transition " +
              (billingPeriod === "yearly" ? "bg-gold text-ink font-semibold" : "text-mist hover:text-white")
            }
          >
            {t("subscriptions.yearly")}
            <span
              className={
                "text-[10px] px-1.5 py-0.5 rounded-full " +
                (billingPeriod === "yearly" ? "bg-ink/20 text-ink" : "bg-gold/15 text-gold")
              }
            >
              {t("subscriptions.yearlyBadge")}
            </span>
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-mist text-sm">{t("common.loading")}</p>}

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* Pulsuz — frontend-only, heç bir backend planına uyğun gəlmir */}
        <div className="relative rounded-3xl border border-white/8 bg-celestial-card/50 p-7 flex flex-col">
          <h2 className="font-display text-2xl">{t("subscriptions.freeTitle")}</h2>
          <div className="mt-5 flex items-baseline gap-1">
            <span className="font-display text-4xl text-gold">0</span>
            <span className="text-mist text-sm"> {t("subscriptions.perMonth")}</span>
          </div>
          <ul className="mt-6 space-y-2.5 flex-1">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                <span className="text-gold shrink-0">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <div className="text-center text-sm font-semibold text-mist py-3 rounded-full border border-white/10">
              {t("subscriptions.freeAlwaysButton")}
            </div>
          </div>
        </div>

        {plans.map((p) => {
          const isCurrent = mySub?.planKey === p.key && mySub.status === "active";
          const priceShown = billingPeriod === "yearly" ? annualPrice(p.priceAzn) : p.priceAzn;
          const isPremium = p.key === premiumKey;
          return (
            <div
              key={p.key}
              className={
                "relative rounded-3xl border p-7 flex flex-col " +
                (isPremium ? "border-gold/50 bg-gradient-to-b from-gold/10 to-celestial-card/70" : "border-white/8 bg-celestial-card/50")
              }
            >
              {isPremium && (
                <span className="absolute -top-3 left-7 flex items-center gap-1 rounded-full bg-gold text-ink text-[11px] font-semibold px-3 py-1">
                  ✦ {t("subscriptions.mostPopular")}
                </span>
              )}

              <h2 className="font-display text-2xl">{p.name}</h2>
              {p.tagline && <p className="mt-1.5 text-sm text-mist">{p.tagline}</p>}

              <div className="mt-5 flex items-baseline gap-1 flex-wrap">
                <span className="font-display text-4xl text-gold">{priceShown}</span>
                <span className="text-mist text-sm"> AZN / {BILLING_LABELS[billingPeriod]}</span>
              </div>
              {billingPeriod === "yearly" && (
                <p className="text-[11px] text-mist/70 mt-1">{t("subscriptions.equivPerMonth", { amount: Math.round(priceShown / 12) })}</p>
              )}

              {p.features.length > 0 && (
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/85">
                      <span className="text-gold shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-7">
                {isCurrent ? (
                  <div className="text-center text-sm font-semibold text-goldsoft py-3 rounded-full border border-gold/40 bg-gold/10">
                    {t("subscriptions.currentPlanButton")}
                  </div>
                ) : !user ? (
                  <Link
                    to="/giris"
                    className={
                      "block text-center text-sm font-semibold py-3 rounded-full transition " +
                      (isPremium ? "bg-gold text-ink hover:bg-goldsoft" : "border border-gold/40 text-goldsoft hover:bg-gold/10")
                    }
                  >
                    {t("auth.login")} · {t("subscriptions.subscribeButton")}
                  </Link>
                ) : (
                  <button
                    onClick={() => setPayModalPlan(p)}
                    disabled={busyKey === p.key}
                    className={
                      "w-full text-center text-sm font-semibold py-3 rounded-full transition disabled:opacity-50 " +
                      (isPremium ? "bg-gold text-ink hover:bg-goldsoft" : "border border-gold/40 text-goldsoft hover:bg-gold/10")
                    }
                  >
                    {busyKey === p.key ? t("common.sending") : t("subscriptions.subscribeButton")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-mist flex items-center gap-1.5">{t("subscriptions.disclaimer")}</p>

      {user && payments.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm text-mist mb-3">{t("subscriptions.paymentHistory")}</h2>
          <div className="space-y-2">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm"
              >
                <span>
                  {pay.planKey} · {BILLING_LABELS[pay.billingPeriod] ?? pay.billingPeriod}
                </span>
                <span className="text-mist/70 text-xs">
                  {pay.amountAzn} ₼ · {new Date(pay.createdAt).toLocaleDateString(locale)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {payModalPlan && (
        <PaymentModal
          plan={payModalPlan}
          price={modalPrice}
          period={billingPeriod}
          busy={busyKey === payModalPlan.key}
          onClose={() => setPayModalPlan(null)}
          onConfirm={confirmPurchase}
        />
      )}
    </Page>
  );
}
