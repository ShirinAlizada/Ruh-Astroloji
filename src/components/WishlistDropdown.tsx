import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { shopApi, type ShopProductDto } from "../lib/api";
import { useWishlist } from "../lib/wishlist-context";
import { useI18n, pickLocalized } from "../lib/i18n";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function WishlistDropdown() {
  const { t, lang } = useI18n();
  const { productIds, count, toggleWishlist } = useWishlist();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ShopProductDto[] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (products === null) {
      shopApi
        .products()
        .then((res) => setProducts(res.items))
        .catch(() => setProducts([]));
    }
  }

  const wishlisted = (products ?? []).filter((p) => productIds.has(p.id));

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={t("wishlistDropdown.title")}
        onClick={handleOpen}
        className="relative p-2 text-mist hover:text-white transition"
      >
        <HeartIcon filled={false} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-gold text-ink text-[10px] font-semibold leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-ink2/95 backdrop-blur shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white">{t("wishlistDropdown.title")}</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {products === null && <p className="px-4 py-6 text-center text-xs text-mist">{t("common.loading")}</p>}
            {products !== null && count === 0 && (
              <p className="px-4 py-6 text-center text-xs text-mist">{t("wishlistDropdown.empty")}</p>
            )}
            {wishlisted.map((p) => (
              <div key={p.id} className="flex items-center gap-2 px-4 py-3 border-b border-white/5 last:border-b-0">
                <Link to="/magaza" onClick={() => setOpen(false)} className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate hover:text-goldsoft transition">{pickLocalized(lang, p.name, p.nameEn, p.nameRu)}</p>
                  <p className="text-xs text-gold mt-0.5">{p.priceAzn} AZN</p>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleWishlist(p.id)}
                  className="text-gold shrink-0 hover:text-red-300 transition"
                  aria-label={t("wishlistDropdown.removeAria")}
                >
                  <HeartIcon filled />
                </button>
              </div>
            ))}
          </div>

          {count > 0 && (
            <div className="border-t border-white/5 px-4 py-3">
              <Link
                to="/magaza"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold px-4 py-2.5 rounded-full border border-gold/40 text-goldsoft hover:bg-gold/10 transition"
              >
                {t("wishlistDropdown.goToShop")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
