import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "../types";

const CART_STORAGE_KEY = "cart_items";

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  unit: string;
  image_url: string | null;
  quantity: number;
  stock_quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseStoredCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const item = value as Record<string, unknown>;
  const price = toFiniteNumber(item.price);

  if (
    typeof item.product_id !== "number" ||
    typeof item.name !== "string" ||
    price === null ||
    typeof item.unit !== "string" ||
    (item.image_url !== null && typeof item.image_url !== "string") ||
    typeof item.quantity !== "number" ||
    typeof item.stock_quantity !== "number"
  ) {
    return null;
  }

  return {
    product_id: item.product_id,
    name: item.name,
    price,
    unit: item.unit,
    image_url: item.image_url,
    quantity: item.quantity,
    stock_quantity: item.stock_quantity,
  };
}

// Invalid or corrupted localStorage should never crash the app.
function loadCartFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const items: CartItem[] = [];

    for (const entry of parsed) {
      const item = parseStoredCartItem(entry);

      if (item) {
        items.push(item);
      }
    }

    return normalizeCartItems(items);
  } catch {
    return [];
  }
}

function toCartItem(product: Product, quantity: number): CartItem {
  return {
    product_id: product.id,
    name: product.name,
    price: Number(product.price),
    unit: product.unit,
    image_url: product.image_url,
    quantity,
    stock_quantity: product.stock_quantity,
  };
}

// Merge any duplicate product_id entries and keep quantities within stock.
function normalizeCartItems(items: CartItem[]): CartItem[] {
  const byId = new Map<number, CartItem>();

  for (const item of items) {
    const quantity = Math.max(0, Math.floor(item.quantity));
    const existing = byId.get(item.product_id);

    if (existing) {
      byId.set(item.product_id, {
        ...existing,
        quantity: Math.min(
          existing.stock_quantity,
          existing.quantity + quantity,
        ),
      });
      continue;
    }

    byId.set(item.product_id, {
      ...item,
      quantity: Math.min(item.stock_quantity, quantity),
    });
  }

  return [...byId.values()].filter((item) => item.quantity > 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((product: Product, quantity: number) => {
    const requested = Math.max(0, Math.floor(quantity));

    if (requested <= 0) {
      return;
    }

    setItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);

      // Same product: increase quantity, never above stock.
      if (existing) {
        const nextQuantity = Math.min(
          existing.stock_quantity,
          existing.quantity + requested,
        );

        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: nextQuantity }
            : item,
        );
      }

      const nextQuantity = Math.min(product.stock_quantity, requested);

      if (nextQuantity <= 0) {
        return current;
      }

      return [...current, toCartItem(product, nextQuantity)];
    });
  }, []);

  const removeFromCart = useCallback((product_id: number) => {
    setItems((current) =>
      current.filter((item) => item.product_id !== product_id),
    );
  }, []);

  const updateQuantity = useCallback((product_id: number, quantity: number) => {
    const nextQuantity = Math.floor(quantity);

    // 0 or Less means the shopper removed this item.
    if (nextQuantity <= 0) {
      setItems((current) =>
        current.filter((item) => item.product_id !== product_id),
      );
      return;
    }

    setItems((current) =>
      current.map((item) => {
        if (item.product_id !== product_id) {
          return item;
        }

        return {
          ...item,
          quantity: Math.min(item.stock_quantity, Math.max(1, nextQuantity)),
        };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
