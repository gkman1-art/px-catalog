import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  company: string;
  spec: string;
  price: string;
  qty: number;
}

const STORAGE_KEY = "px-cart";
const CART_EVENT = "px-cart-change";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    const sync = () => setItems(loadCart());
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const addItem = useCallback((product: Omit<CartItem, "qty">) => {
    const current = loadCart();
    const existing = current.find((i) => i.id === product.id);
    if (existing) {
      saveCart(current.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      saveCart([...current, { ...product, qty: 1 }]);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    saveCart(loadCart().filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      saveCart(loadCart().filter((i) => i.id !== id));
    } else {
      saveCart(loadCart().map((i) => (i.id === id ? { ...i, qty } : i)));
    }
  }, []);

  const clearCart = useCallback(() => {
    saveCart([]);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce(
    (s, i) => s + parsePrice(i.price) * i.qty,
    0,
  );

  return { items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice };
}

export function parsePrice(price: string): number {
  return parseInt(price.replace(/[^0-9]/g, ""), 10) || 0;
}

export function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}
