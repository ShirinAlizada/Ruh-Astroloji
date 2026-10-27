import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { shopApi, profileApi, ApiError, type ShopProductDto } from "../lib/api";
import { useCart } from "../lib/cart-context";
import { Page, PageHeader } from "../components/Page";
import { useI18n } from "../lib/i18n";

// destiny-reads-app-ın cart/checkout axınının ayrıca səhifə versiyası —
// CartDropdown-un "Sifarişi tamamla" keçidi artıq buraya yönləndirir (əvvəllər
// /magaza-da inline forma açılırdı). Kupon kodu AstroBackend-in mövcud
// `PlaceShopOrderRequest.discountPct` sahəsini istifadə edir — server
// tərəfində ayrıca kupon validasiyası yoxdur, kod→faiz uyğunluğu bu faylda
// lokaldır (bax COUPONS aşağıda).

const API_ORIGIN = "https://localhost:7168";

function imgSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

// destiny-reads-app-ın lib/shop.ts-indəki DEMO_DISCOUNT_CODES ilə HƏRFİ eyni
// (demo/nümayiş məqsədli sabit siyahı, hər iki tətbiqdə serverdə ayrıca kupon
// cədvəli yoxdur) — tam uyğunluq üçün kodlar dəyişməyib.
const COUPONS: Record<string, number> = {
  XOSGELDIN10: 10,
  ULDUZ15: 15,
  ASTRO20: 20,
};

export default function CartPage() {
  const { t } = useI18n();
  const { items, totalAzn: subtotal, changeQty, removeFromCart, clearCart } = useCart();
  const [products, setProducts] = useState<Record<string, ShopProductDto>>({});

  const [couponInput, setCouponInput] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    shopApi
      .products()
      .then((res) => setProducts(Object.fromEntries(res.items.map((p) => [p.id, p]))))
      .catch(() => {});
    profileApi
      .getMe()
      .then((p) => setFullName(p.fullName ?? ""))
      .catch(() => {});
  }, []);

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const pct = COUPONS[code];
    if (pct) {
      setDiscountPct(pct);
      setCouponMessage({ ok: true, text: t("cart.couponApplied", { pct }) });
    } else {
      setDiscountPct(0);
      setCouponMessage({ ok: false, text: t("cart.couponInvalid") });
    }
  }

  const discountAmount = Math.round(subtotal * discountPct) / 100;
  const total = Math.max(0, subtotal - discountAmount);

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setError(null);
    setPlacing(true);
    try {
      await shopApi.placeOrder({
        items: items.map(({ productId, productName, quantity, unitPriceAzn }) => ({
          productId,
          productName,
          quantity,
          unitPriceAzn,
        })),
        fullName,
        phone,
        address,
        note: note || null,
        discountPct: discountPct || undefined,
      });
      clearCart();
      setNote("");
      setCouponInput("");
      setDiscountPct(0);
      setCouponMessage(null);
      setNotice(t("cart.successNotice"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("cart.errPlace"));
    } finally {
      setPlacing(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50";
  const labelClass = "block text-xs text-mist mb-1.5";

  return (
    <Page>
      <PageHeader kicker={t("cart.kicker")} title={t("cart.title")} subtitle={t("cart.subtitle")} />

      {notice && (
        <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-6">
          ✓ {notice}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">{error}</p>
      )}

      {items.length === 0 && !notice && (
        <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-8 text-center">
          <p className="text-mist mb-4">{t("cart.empty")}</p>
          <Link to="/magaza" className="inline-block px-5 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition">
            {t("cart.goToShop")}
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <form onSubmit={placeOrder} className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 divide-y divide-white/5 overflow-hidden">
              {items.map((l) => {
                const product = products[l.productId];
                const img = product ? imgSrc(product.imageUrl) : null;
                return (
                  <div key={l.productId} className="flex items-center gap-4 p-4">
                    <div className="size-14 shrink-0 rounded-xl overflow-hidden bg-ink2 border border-white/10 grid place-items-center text-lg">
                      {img ? <img src={img} alt={l.productName} className="size-full object-cover" /> : "🛍"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{l.productName}</p>
                      <p className="text-xs text-mist mt-0.5">{l.unitPriceAzn} AZN</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => changeQty(l.productId, -1)} className="size-7 rounded-full border border-white/15 text-mist">
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{l.quantity}</span>
                      <button type="button" onClick={() => changeQty(l.productId, 1)} className="size-7 rounded-full border border-white/15 text-mist">
                        +
                      </button>
                    </div>
                    <span className="w-16 text-right text-gold text-sm shrink-0">{l.unitPriceAzn * l.quantity} AZN</span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(l.productId)}
                      className="text-mist/70 hover:text-red-300 transition shrink-0"
                      aria-label={t("common.delete")}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-4">
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  placeholder={t("cart.couponPlaceholder")}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="shrink-0 px-5 py-2.5 rounded-xl border border-gold/40 text-goldsoft text-sm font-semibold hover:bg-gold/10 transition"
                >
                  {t("cart.couponApply")}
                </button>
              </div>
              {couponMessage && (
                <p className={"text-xs mt-2 " + (couponMessage.ok ? "text-emerald-300" : "text-red-300")}>{couponMessage.text}</p>
              )}
            </div>

            <div className="rounded-2xl bg-celestial-card/60 border border-white/5 p-5 space-y-2 text-sm">
              <div className="flex items-center justify-between text-mist">
                <span>{t("cart.subtotal")}</span>
                <span>{subtotal} AZN</span>
              </div>
              {discountPct > 0 && (
                <div className="flex items-center justify-between text-emerald-300">
                  <span>{t("cart.discount")} (-{discountPct}%)</span>
                  <span>−{discountAmount} AZN</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-base">
                <span className="text-mist">{t("cart.total")}</span>
                <span className="text-gold font-display text-lg">{total} AZN</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-celestial-card/60 border border-white/5 p-6 space-y-4 h-fit">
            <h2 className="font-display text-xl">{t("cart.checkoutTitle")}</h2>
            <div>
              <label className={labelClass}>{t("cart.fullName")}</label>
              <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t("cart.phone")}</label>
              <input
                className={inputClass}
                placeholder={t("cart.phonePlaceholder")}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t("cart.address")}</label>
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>{t("cart.note")}</label>
              <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <p className="text-[11px] text-mist/70 leading-relaxed">
              {t("cart.disclaimer")}
            </p>
            <button
              type="submit"
              disabled={placing}
              className="w-full px-6 py-3 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition disabled:opacity-60"
            >
              {placing ? t("cart.submitting") : `${t("cart.submitPrefix")} ${total} AZN`}
            </button>
          </div>
        </form>
      )}
    </Page>
  );
}
