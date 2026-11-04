import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopLoader } from "@/components/ui/top-loader";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import AuthLayout from "@/app/(auth)/layout";

// Customer Storefront Components (Directly imported for instant FCP)
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { HomePage } from "@/pages/store/Home";
import { StoreProductsPage } from "@/pages/store/Products";
import { StoreProductDetailPage } from "@/pages/store/ProductDetail";
import { StoreCheckoutPage } from "@/pages/store/Checkout";
import { StoreMyOrdersPage } from "@/pages/store/MyOrders";
import { StoreContactPage } from "@/pages/store/Contact";

// ⚡ Lazy-loaded Admin & Auth Components (Keeps storefront initial bundle ultra-light)
const LoginPage = React.lazy(() => import("@/app/(auth)/login/page"));
const DashboardPage = React.lazy(() => import("@/app/(dashboard)/page"));
const ProductsPage = React.lazy(() => import("@/app/(dashboard)/products/page"));
const StockPage = React.lazy(() => import("@/app/(dashboard)/stock/page"));
const OrdersPage = React.lazy(() => import("@/app/(dashboard)/orders/page"));
const UsersPage = React.lazy(() => import("@/app/(dashboard)/users/page"));
const BroadcastPage = React.lazy(() => import("@/app/(dashboard)/broadcast/page"));
const SettingsPage = React.lazy(() => import("@/app/(dashboard)/settings/page"));
const PaymentsPage = React.lazy(() => import("@/app/(dashboard)/payments/page"));

const RouteSuspenseFallback = (
  <div className="min-h-[50vh] flex items-center justify-center p-8">
    <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      {/* 🚀 Ultra-Smooth Top Loading Bar (Sleek & Thin 2px) */}
      <TopLoader color="#ef4444" height={2} />
      <Routes>
        {/* ======================================================== */}
        {/* 🛍️ Customer-Facing Storefront Routes (Public)           */}
        {/* ======================================================== */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<StoreProductsPage />} />
          <Route path="/products/:id" element={<StoreProductDetailPage />} />
          <Route path="/checkout/:id" element={<StoreCheckoutPage />} />
          <Route path="/my-orders" element={<StoreMyOrdersPage />} />
          <Route path="/orders/lookup" element={<StoreMyOrdersPage />} />
          <Route path="/contact" element={<StoreContactPage />} />
        </Route>

        {/* ======================================================== */}
        {/* 🔐 Admin Authentication Route                           */}
        {/* ======================================================== */}
        <Route
          path="/login"
          element={
            <Suspense fallback={RouteSuspenseFallback}>
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            </Suspense>
          }
        />

        {/* ======================================================== */}
        {/* ⚙️ Protected Admin Dashboard Routes                     */}
        {/* ======================================================== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardWrapper />}>
            <Route
              path="/admin"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/products"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <ProductsPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/stock"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <StockPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <OrdersPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <PaymentsPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/users"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <UsersPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/broadcast"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <BroadcastPage />
                </Suspense>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <Suspense fallback={RouteSuspenseFallback}>
                  <SettingsPage />
                </Suspense>
              }
            />

            {/* Dashboard path aliases */}
            <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
            <Route path="/dashboard/products" element={<Navigate to="/admin/products" replace />} />
            <Route path="/dashboard/stock" element={<Navigate to="/admin/stock" replace />} />
            <Route path="/dashboard/orders" element={<Navigate to="/admin/orders" replace />} />
            <Route path="/dashboard/payments" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/dashboard/users" element={<Navigate to="/admin/users" replace />} />
            <Route path="/dashboard/broadcast" element={<Navigate to="/admin/broadcast" replace />} />
            <Route path="/dashboard/settings" element={<Navigate to="/admin/settings" replace />} />
          </Route>
        </Route>

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
