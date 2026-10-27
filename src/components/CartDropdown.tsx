import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/cart-context";
import { useI18n } from "../lib/i18n";

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export function CartDropdown() {
  const { t } = useI18n();
  const { items, totalCount, totalAzn, changeQty, removeFromCart } = useCart();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label={t("cartDropdown.title")}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-mist hover:text-white transition"
      >
        <CartIcon />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-gold text-ink text-[10px] font-semibold leading-none">
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/10 bg-ink2/95 backdrop-blur shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-white">{t("cartDropdown.title")}</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-mist">{t("cartDropdown.empty")}</p>}
            {items.map((l) => (
              <div key={l.productId} className="flex items-center gap-2 px-4 py-3 border-b border-white/5 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{l.productName}</p>
                  <p className="text-xs text-mist mt-0.5">{l.unitPriceAzn} AZN</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => changeQty(l.productId, -1)} className="size-6 rounded-full border border-white/15 text-mist text-xs">
                    −
                  </button>
                  <span className="w-4 text-center text-xs text-white">{l.quantity}</span>
                  <button type="button" onClick={() => changeQty(l.productId, 1)} className="size-6 rounded-full border border-white/15 text-mist text-xs">
                    +
                  </button>
                  <button type="button" onClick={() => removeFromCart(l.productId)} className="ml-1 text-mist/70 hover:text-red-300 transition text-xs">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="border-t border-white/5 px-4 py-3 space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mist">{t("cartDropdown.total")}</span>
                <span className="text-gold font-display text-base">{totalAzn} AZN</span>
              </div>
              <Link
                to="/sebet"
                onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold px-4 py-2.5 rounded-full bg-gold text-ink hover:bg-goldsoft transition"
              >
                {t("cartDropdown.checkout")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
