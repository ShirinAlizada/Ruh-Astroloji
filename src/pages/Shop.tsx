import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  shopApi,
  ApiError,
  type ShopProductDto,
  type ShopOrderDto,
  type ShopProductReviewDto,
} from "../lib/api";
import { Page, PageHeader } from "../components/Page";
import { useCart } from "../lib/cart-context";
import { useWishlist } from "../lib/wishlist-context";
import { useI18n, pickLocalized } from "../lib/i18n";

const API_ORIGIN = "https://localhost:7168";

function imgSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

const CATEGORY_ICON: Record<string, string> = {
  tarot: "🔮",
  kristal: "💎",
  sham: "🕯",
  kitab: "📖",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  tarot: "from-indigo-500/30 via-transparent to-fuchsia-500/20",
  kristal: "from-cyan-400/25 via-transparent to-violet-500/20",
  sham: "from-amber-500/25 via-transparent to-orange-600/15",
  kitab: "from-emerald-500/20 via-transparent to-teal-600/15",
};

function StarRow({ value, size = "text-sm" }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={size}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "text-gold" : "text-white/15"}>
          ★
        </span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={"text-lg leading-none transition " + (n <= value ? "text-gold" : "text-white/20 hover:text-white/40")}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewsPanel({ productId }: { productId: string }) {
  const { t, locale } = useI18n();
  const [reviews, setReviews] = useState<ShopProductReviewDto[] | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    shopApi
      .reviews(productId)
      .then(setReviews)
      .catch(() => setReviews([]));
  }

  useEffect(load, [productId]);

  async function submit() {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await shopApi.upsertReview(productId, { rating, comment: comment || null });
      setComment("");
      load();
    } catch {
      /* best-effort */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
      {reviews === null && <p className="text-xs text-mist">{t("shop.reviewsLoading")}</p>}
      {reviews?.length === 0 && <p className="text-xs text-mist">{t("shop.noReviewsYet")}</p>}
      {reviews && reviews.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {reviews.map((r) => (
            <div key={r.id} className="text-xs">
              <div className="flex items-center gap-2">
                <StarRow value={r.rating} size="text-xs" />
                <span className="text-mist">{new Date(r.createdAt).toLocaleDateString(locale)}</span>
              </div>
              {r.comment && <p className="mt-0.5 text-mist leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2 pt-1">
        <p className="text-[11px] text-mist">{t("shop.yourRating")}</p>
        <StarPicker value={rating} onChange={setRating} />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={280}
          rows={2}
          placeholder={t("shop.reviewPlaceholder")}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:border-gold/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={rating < 1 || submitting}
          className="text-xs font-semibold px-4 py-2 rounded-full bg-gold text-ink hover:bg-goldsoft transition disabled:opacity-50"
        >
          {t("shop.submitReview")}
        </button>
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { t, lang, locale } = useI18n();
  const SORTS: Array<[string, string]> = [
    ["", t("shop.sortDefault")],
    ["price_asc", t("shop.sortPriceAsc")],
    ["price_desc", t("shop.sortPriceDesc")],
    ["name", t("shop.sortName")],
    ["newest", t("shop.sortNewest")],
  ];
  // DÜZƏLİŞ (2026-10-27): kateqoriya tabları əvvəllər backend-dən gələn xam
  // enum sözünü ("tarot"/"kristal"/"sham"/"kitab") heç bir dildə tərcümə
  // etmədən birbaşa göstərirdi — EN/RU interfeysdə də "sham" sözü belə qalırdı.
  // İndi hər dil üçün i18n açarından oxunur (bax shop.categorySham və s.).
  const CATEGORY_LABELS: Record<string, string> = {
    tarot: t("shop.categoryTarot"),
    kristal: t("shop.categoryKristal"),
    sham: t("shop.categorySham"),
    kitab: t("shop.categoryKitab"),
  };
  const STATUS_LABELS: Record<string, string> = {
    Pending: t("shop.statusPending"),
    Confirmed: t("shop.statusConfirmed"),
    Shipped: t("shop.statusShipped"),
    Completed: t("shop.statusCompleted"),
    Cancelled: t("shop.statusCancelled"),
  };
  const { items: cart, totalAzn: cartTotal, addToCart: addItemToCart } = useCart();
  const { isWishlisted, toggleWishlist: toggleWishlistCtx } = useWishlist();
  const [products, setProducts] = useState<ShopProductDto[]>([]);
  const [orders, setOrders] = useState<ShopOrderDto[]>([]);

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openReviews, setOpenReviews] = useState<Record<string, boolean>>({});
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [wishlistPulseId, setWishlistPulseId] = useState<string | null>(null);

  function refreshProducts(s?: string, srt?: string) {
    return shopApi
      .products(s || undefined, srt || undefined)
      .then((res) => setProducts(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t("shop.errLoad")));
  }

  function refreshOrders() {
    return shopApi
      .myOrders()
      .then((list) => setOrders([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([refreshProducts(), refreshOrders()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function search_() {
    refreshProducts(search, sort);
  }

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))).sort(), [products]);
  const filtered = tab === "all" ? products : products.filter((p) => p.category === tab);

  function toggleWishlist(productId: string) {
    toggleWishlistCtx(productId);
    setWishlistPulseId(productId);
    window.setTimeout(() => setWishlistPulseId((cur) => (cur === productId ? null : cur)), 300);
  }

  function addToCart(p: ShopProductDto) {
    // DÜZƏLİŞ (2026-10-27): əvvəllər bu funksiya addItemToCart-ın NƏTİCƏSİNDƏN
    // asılı olmayaraq həmişə "Əlavə edildi" animasiyasını göstərirdi — stok
    // limitinə görə əlavə edilmədikdə belə (məs. səbətdə artıq stokun hamısı
    // varsa) istifadəçi "əlavə etdim" görürdü, amma səbətdə heç nə dəyişmirdi.
    // İndi nəticə yoxlanılır: uğursuz olduqda xəta mesajı göstərilir.
    const added = addItemToCart({ productId: p.id, productName: p.name, unitPriceAzn: p.priceAzn, stock: p.stock });
    if (added) {
      setError(null);
      setJustAddedId(p.id);
      window.setTimeout(() => setJustAddedId((cur) => (cur === p.id ? null : cur)), 900);
    } else {
      setError(t("shop.cantAddMoreStock"));
    }
  }

  return (
    <Page>
      <PageHeader kicker={t("shop.kicker")} title={t("shop.title")} subtitle={t("shop.subtitle")} />

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-6">
          {error}
        </p>
      )}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setTab(c)}
              className={
                "text-sm px-5 py-2 rounded-full border transition " +
                (tab === c ? "border-gold bg-gold/15 text-goldsoft" : "border-white/10 text-mist hover:border-gold/40")
              }
            >
              {c === "all" ? t("shop.allCategories") : (CATEGORY_LABELS[c] ?? c)}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <input
          className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-full px-5 py-2.5 text-sm placeholder:text-mist/60 focus:outline-none focus:border-gold/50"
          placeholder={t("shop.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search_()}
        />
        <select
          className="bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-gold/50"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            refreshProducts(search, e.target.value);
          }}
        >
          {SORTS.map(([val, label]) => (
            <option key={val} value={val} className="bg-ink">
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={search_}
          className="px-5 py-2.5 rounded-full bg-gold text-ink text-sm font-medium hover:bg-goldsoft transition"
        >
          {t("shop.search")}
        </button>
      </div>

      {loading && <p className="text-mist text-sm">{t("common.loading")}</p>}
      {!loading && filtered.length === 0 && <p className="text-mist text-sm mb-6">{t("shop.noProducts")}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {filtered.map((p) => {
          const img = imgSrc(p.imageUrl);
          const inWishlist = isWishlisted(p.id);
          const outOfStock = p.stock <= 0;
          const lowStock = !outOfStock && p.stock <= 5;
          const reviewsOpen = Boolean(openReviews[p.id]);
          return (
            <div key={p.id} className="rounded-3xl border border-white/8 bg-celestial-card/50 p-4 flex flex-col">
              <div className="relative">
                {img ? (
                  <div className="relative aspect-[4/5] rounded-2xl border border-white/10 overflow-hidden bg-ink2">
                    <img src={img} alt={p.name} loading="lazy" className="absolute inset-0 size-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div
                    className={
                      "relative aspect-[4/5] rounded-2xl border border-white/10 overflow-hidden bg-ink2 bg-gradient-to-br grid place-items-center text-4xl " +
                      (CATEGORY_GRADIENT[p.category] ?? "from-white/10 via-transparent to-transparent")
                    }
                  >
                    {CATEGORY_ICON[p.category] ?? "🛍"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => toggleWishlist(p.id)}
                  className={
                    "absolute top-2 left-2 size-8 grid place-items-center rounded-full bg-ink/80 border border-white/10 text-goldsoft hover:text-gold transition-transform " +
                    (wishlistPulseId === p.id ? "scale-125" : "scale-100")
                  }
                >
                  {inWishlist ? "♥" : "♡"}
                </button>
                {outOfStock && (
                  <span className="absolute top-2 right-2 text-[10px] px-2.5 py-1 rounded-full bg-ink/90 border border-red-400/40 text-red-300 uppercase tracking-wide">
                    {t("shop.outOfStock")}
                  </span>
                )}
              </div>
              <h2 className="font-display text-lg mt-4">{pickLocalized(lang, p.name, p.nameEn, p.nameRu)}</h2>
              <p className="mt-1.5 text-xs text-mist leading-relaxed flex-1 line-clamp-3">
                {pickLocalized(lang, p.description, p.descriptionEn, p.descriptionRu)}
              </p>

              <button
                type="button"
                onClick={() => setOpenReviews((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                className="mt-2 flex items-center gap-1.5 text-xs text-mist hover:text-goldsoft transition"
              >
                {p.averageRating != null && p.reviewCount > 0 ? (
                  <>
                    <StarRow value={p.averageRating} />
                    <span>({p.reviewCount})</span>
                  </>
                ) : (
                  <span>{t("shop.noRatingYet")}</span>
                )}
                <span className={"transition-transform " + (reviewsOpen ? "rotate-180" : "")}>⌄</span>
              </button>

              {reviewsOpen && <ReviewsPanel productId={p.id} />}

              {lowStock && (
                <p className="mt-1.5 text-xs text-amber-300">
                  {t("shop.lowStockPrefix")} {p.stock} {t("shop.lowStockSuffix")}
                </p>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-mist">
                {p.unitLabel && <span>{p.unitLabel}</span>}
                <span className="font-display text-lg text-gold ml-auto">{p.priceAzn} AZN</span>
              </div>
              <button
                type="button"
                onClick={() => addToCart(p)}
                disabled={outOfStock}
                className={
                  "mt-4 w-full text-center text-sm font-semibold py-2.5 rounded-full text-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed " +
                  (justAddedId === p.id ? "bg-goldsoft scale-[1.02]" : "bg-gold hover:bg-goldsoft")
                }
              >
                {outOfStock ? t("shop.outOfStock") : justAddedId === p.id ? t("shop.addedToCart") : t("shop.addToCartButton")}
              </button>
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div className="rounded-3xl border border-gold/20 bg-gold/[0.04] p-6 mb-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-mist">
            {t("shop.cartSummaryPrefix")} <span className="text-white">{cart.length}</span> {t("shop.cartSummaryProducts")} — {cartTotal} AZN.
          </p>
          <Link
            to="/sebet"
            className="px-5 py-2.5 rounded-full bg-gold text-ink font-semibold text-sm hover:bg-goldsoft transition"
          >
            {t("shop.goToCart")}
          </Link>
        </div>
      )}

      {orders.length > 0 && (
        <>
          <h2 className="font-display text-xl mb-4">{t("shop.myOrders")}</h2>
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-3xl border border-white/10 bg-celestial-card/40 p-7 py-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-mist/70">{new Date(o.createdAt).toLocaleString(locale)}</p>
                  <span className="text-xs px-3 py-1 rounded-full border border-white/15 text-mist">
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <div className="space-y-1 mb-2">
                  {o.items.map((it) => (
                    <p key={it.id} className="text-sm text-[#F3EFE6]">
                      {it.quantity}× {it.productName} — {it.unitPriceAzn * it.quantity} AZN
                    </p>
                  ))}
                </div>
                <p className="text-sm text-gold text-right">{o.totalAzn} AZN</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
