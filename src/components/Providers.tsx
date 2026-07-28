"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { BusinessConfigProvider } from "@/context/BusinessConfigContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BusinessConfigProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </BusinessConfigProvider>
  );
}
