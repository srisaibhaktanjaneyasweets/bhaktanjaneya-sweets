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
  Post,
  Product,
  Tag,
} from "@/lib/types";
import { adminLogin, type AdminSession } from "@/lib/api/adminAuth";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";

const SESSION_KEY = "bas_admin_session";
const ADMIN_SESSION_COOKIE = "bas_admin_session";

function clearAdminSessionCookie() {
  if (typeof window === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ADMIN_SESSION_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

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
  tags: Tag[];
  offers: Offer[];
  orders: Order[];
  customers: Customer[];
  posts: Post[];

  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  saveTag: (tag: Tag) => void;
  deleteTag: (id: string) => void;
  saveOffer: (offer: Offer) => void;
  deleteOffer: (id: string) => void;
  savePost: (post: Post) => void;
  deletePost: (id: string) => void;
  updateOrderStatus: (
    id: string,
    status: OrderStatus,
    deliveryDetails?: { deliveryCompany: string; deliveryTrackingId: string },
  ) => Promise<Order>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<Order>;
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

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
    // Posts and tags live in their own tables that may not be migrated yet —
    // load separately so a missing table doesn't blank out the rest of the admin.
    try {
      setPosts(await apiGet<Post[]>("/admin/posts"));
    } catch {
      setPosts([]);
    }
    try {
      setTags(await apiGet<Tag[]>("/admin/tags"));
    } catch {
      setTags([]);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let restored = false;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (isRealSession(parsed)) {
          setSession(parsed);
          restored = true;
        } else {
          window.localStorage.removeItem(SESSION_KEY);
        }
      }
    } catch {
      setSession(null);
      window.localStorage.removeItem(SESSION_KEY);
    }
    setHydrated(true);
    // Only fetch admin data when we actually have a session token to send.
    // Otherwise every /admin/* GET 401s before the user has logged in — and
    // login() runs loadAll() itself once authenticated.
    if (restored) void loadAll();
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
    clearAdminSessionCookie();
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

  const saveTag = useCallback((tag: Tag) => {
    void (async () => {
      const exists = tags.some((t) => t.id === tag.id);
      const next = exists
        ? await apiPut<Tag>(`/admin/tags/${tag.id}`, tag)
        : await apiPost<Tag>("/admin/tags", tag);
      setTags((prev) => (exists ? prev.map((t) => (t.id === next.id ? next : t)) : [...prev, next]));
    })();
  }, [tags]);

  const deleteTag = useCallback((id: string) => {
    void apiDelete<void>(`/admin/tags/${id}`).then(() => {
      setTags((prev) => prev.filter((t) => t.id !== id));
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

  const savePost = useCallback((post: Post) => {
    void (async () => {
      const exists = posts.some((p) => p.id === post.id);
      const next = exists
        ? await apiPut<Post>(`/admin/posts/${post.id}`, post)
        : await apiPost<Post>("/admin/posts", post);
      setPosts((prev) => (exists ? prev.map((p) => (p.id === next.id ? next : p)) : [next, ...prev]));
    })();
  }, [posts]);

  const deletePost = useCallback((id: string) => {
    void apiDelete<void>(`/admin/posts/${id}`).then(() => {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    });
  }, []);

  const updateOrderStatus = useCallback(
    async (
      id: string,
      status: OrderStatus,
      deliveryDetails?: { deliveryCompany: string; deliveryTrackingId: string },
    ) => {
      const next = await apiPatch<Order>(`/admin/orders/${id}`, {
        status,
        ...deliveryDetails,
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
      return next;
    },
    [],
  );

  const updateOrder = useCallback(async (id: string, patch: Partial<Order>) => {
    const next = await apiPatch<Order>(`/admin/orders/${id}`, patch);
    setOrders((prev) => prev.map((o) => (o.id === id ? next : o)));
    return next;
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
      tags,
      offers,
      orders,
      customers,
      posts,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      saveTag,
      deleteTag,
      saveOffer,
      deleteOffer,
      savePost,
      deletePost,
      updateOrderStatus,
      updateOrder,
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
      tags,
      offers,
      orders,
      customers,
      posts,
      saveProduct,
      deleteProduct,
      saveCategory,
      deleteCategory,
      saveTag,
      deleteTag,
      saveOffer,
      deleteOffer,
      savePost,
      deletePost,
      updateOrderStatus,
      updateOrder,
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
