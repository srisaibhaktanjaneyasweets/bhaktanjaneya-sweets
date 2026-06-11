"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Category,
  Customer,
  Offer,
  Order,
  OrderStatus,
  Product,
} from "@/lib/types";
import { adminLogin, type AdminSession } from "@/lib/api/adminAuth";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";

const SESSION_KEY = "bas_admin_session";

function isRealSession(value: unknown): value is AdminSession {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AdminSession).token === "string" &&
    (value as AdminSession).token.includes(".")
  );
}

interface AdminContextValue {
  hydrated: boolean;
  session: AdminSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  products: Product[];
  categories: Category[];
  offers: Offer[];
  orders: Order[];
  customers: Customer[];

  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  saveOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [nextProducts, nextCategories, nextOffers, nextOrders, nextCustomers] = await Promise.all([
        apiGet<Product[]>("/admin/products"),
        apiGet<Category[]>("/admin/categories"),
        apiGet<Offer[]>("/admin/offers"),
        apiGet<Order[]>("/admin/orders"),
        apiGet<Customer[]>("/admin/customers"),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOffers(nextOffers);
      setOrders(nextOrders);
      setCustomers(nextCustomers);
    } catch {
      setProducts([]);
      setCategories([]);
      setOffers([]);
      setOrders([]);
      setCustomers([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isRealSession(parsed)) setSession(parsed);
        else window.localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      setSession(null);
      window.localStorage.removeItem(SESSION_KEY);
    }
    setHydrated(true);
    void loadAll();
  }, [loadAll]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const next = await adminLogin(email, password);
      setSession(next);
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      await loadAll();
    } finally {
      setLoading(false);
    }
  }, [loadAll]);

  const logout = useCallback(() => {
    setSession(null);
    window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const saveProduct = useCallback((product: Product) => {
    void (async () => {
      const exists = products.some((p) => p.id === product.id);
      const next = exists
        ? await apiPut<Product>(`/admin/products/${product.id}`, product)
        : await apiPost<Product>("/admin/products", product);
      setProducts((prev) => (exists ? prev.map((p) => (p.id === next.id ? next : p)) : [next, ...prev]));
    })();
  }, [products]);

  const deleteProduct = useCallback((id: string) => {
    void apiDelete<void>(`/admin/products/${id}`).then(() => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });
  }, []);

  const saveCategory = useCallback((category: Category) => {
    void (async () => {
      const exists = categories.some((c) => c.id === category.id);
      const next = exists
        ? await apiPut<Category>(`/admin/categories/${category.id}`, category)
        : await apiPost<Category>("/admin/categories", category);
      setCategories((prev) => (exists ? prev.map((c) => (c.id === next.id ? next : c)) : [...prev, next]));
    })();
  }, [categories]);

  const deleteCategory = useCallback((id: string) => {
    void apiDelete<void>(`/admin/categories/${id}`).then(() => {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    });
  }, []);

  const saveOffer = useCallback((offer: Offer) => {
    void (async () => {
      const exists = offers.some((o) => o.id === offer.id);
      const next = exists
        ? await apiPut<Offer>(`/admin/offers/${offer.id}`, offer)
        : await apiPost<Offer>("/admin/offers", offer);
      setOffers((prev) => (exists ? prev.map((o) => (o.id === next.id ? next : o)) : [...prev, next]));
    })();
  }, [offers]);

  const deleteOffer = useCallback((id: string) => {
    void apiDelete<void>(`/admin/offers/${id}`).then(() => {
      setOffers((prev) => prev.filter((o) => o.id !== id));
    });
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    void apiPatch<Order>(`/admin/orders/${id}`, { status }).then((next) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
    });
  }, []);

  const refreshData = useCallback(() => {
    void loadAll();
  }, [loadAll]);

  const value = useMemo<AdminContextValue>(
    () => ({
      hydrated,
      session,
      loading,
      login,
      logout,
      products,
      categories,
      offers,
      orders,
      customers,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      saveOffer,
      deleteOffer,
      updateOrderStatus,
      refreshData,
    }),
    [
      hydrated,
      session,
      loading,
      login,
      logout,
      products,
      categories,
      offers,
      orders,
      customers,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      saveOffer,
      deleteOffer,
      updateOrderStatus,
      refreshData,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
