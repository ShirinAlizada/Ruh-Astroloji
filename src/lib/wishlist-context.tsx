import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { wishlistApi } from "./api";
import { useAuth } from "./auth-context";

// AstroBackend-də sevimlilər hesabla bağlıdır (WishlistItemDto, backend-də
// saxlanır) — destiny-reads-app-ın localStorage-əsaslı wishlist-store.ts-indən
// fərqli olaraq, bura React Context altında serverlə sinxronlaşır.

interface WishlistContextValue {
  productIds: Set<string>;
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setProductIds(new Set());
      return;
    }
    wishlistApi
      .list()
      .then((list) => setProductIds(new Set(list.map((w) => w.productId))))
      .catch(() => {});
  }, [user]);

  function isWishlisted(productId: string) {
    return productIds.has(productId);
  }

  function toggleWishlist(productId: string) {
    const inList = productIds.has(productId);
    setProductIds((prev) => {
      const next = new Set(prev);
      if (inList) next.delete(productId);
      else next.add(productId);
      return next;
    });
    (inList ? wishlistApi.remove(productId) : wishlistApi.add(productId)).catch(() => {
      // Geri qaytar — server əməliyyatı uğursuz oldusa, optimistik dəyişikliyi ləğv et.
      setProductIds((prev) => {
        const next = new Set(prev);
        if (inList) next.add(productId);
        else next.delete(productId);
        return next;
      });
    });
  }

  return (
    <WishlistContext.Provider value={{ productIds, count: productIds.size, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
