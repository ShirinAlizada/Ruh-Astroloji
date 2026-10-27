import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ShopCartItemRequest } from "./api";

// destiny-reads-app-ın useCart/cart-store.ts naxışından ilhamlanıb, amma vanilla
// external-store əvəzinə sadə React Context istifadə edir (bu kodbazada artıq
// auth-context.tsx eyni naxışdadır). AstroBackend-də server-saxlanan "səbət"
// endpoint-i yoxdur (sifariş birbaşa tam siyahı ilə yaradılır), ona görə
// localStorage-a yazılır — səhifə yenilənəndə belə səbət qalır.

export interface CartLine extends ShopCartItemRequest {
  stock: number;
}

interface CartContextValue {
  items: CartLine[];
  totalCount: number;
  totalAzn: number;
  // DÜZƏLİŞ (2026-10-27): boolean qaytarır — stok limiti səbəbindən əlavə
  // edilə bilmədikdə (false) çağıran tərəf (Shop.tsx) artıq "Əlavə edildi"
  // animasiyasını SƏHV YERƏ göstərmir (əvvəllər nəticədən asılı olmayaraq
  // həmişə göstərilirdi — istifadəçi "əlavə etdim" deyib səbətdə görməyə bilirdi).
  addToCart: (item: { productId: string; productName: string; unitPriceAzn: number; stock: number }) => boolean;
  changeQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "ruh_cart_v1";

function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* best-effort — localStorage dolu/əlçatmaz ola bilər */
    }
  }, [items]);

  function addToCart(p: { productId: string; productName: string; unitPriceAzn: number; stock: number }): boolean {
    let added = true;
    setItems((prev) => {
      const existing = prev.find((l) => l.productId === p.productId);
      if (existing) {
        if (existing.quantity >= p.stock) {
          added = false;
          return prev;
        }
        return prev.map((l) => (l.productId === p.productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (p.stock <= 0) {
        added = false;
        return prev;
      }
      return [
        ...prev,
        { productId: p.productId, productName: p.productName, unitPriceAzn: p.unitPriceAzn, quantity: 1, stock: p.stock },
      ];
    });
    return added;
  }

  function changeQty(productId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.min(l.stock, Math.max(1, l.quantity + delta)) } : l))
        .filter((l) => l.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setItems((prev) => prev.filter((l) => l.productId !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, l) => sum + l.quantity, 0);
  const totalAzn = items.reduce((sum, l) => sum + l.unitPriceAzn * l.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalCount, totalAzn, addToCart, changeQty, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
