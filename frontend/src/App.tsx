import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TopLoader } from "@/components/ui/top-loader";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardWrapper } from "@/components/layout/dashboard-wrapper";
import AuthLayout from "@/app/(auth)/layout";
import LoginPage from "@/app/(auth)/login/page";
import DashboardPage from "@/app/(dashboard)/page";
import ProductsPage from "@/app/(dashboard)/products/page";
import StockPage from "@/app/(dashboard)/stock/page";
import OrdersPage from "@/app/(dashboard)/orders/page";
import UsersPage from "@/app/(dashboard)/users/page";
import BroadcastPage from "@/app/(dashboard)/broadcast/page";
import SettingsPage from "@/app/(dashboard)/settings/page";
import PaymentsPage from "@/app/(dashboard)/payments/page";

// Customer Storefront Components
import { StoreLayout } from "@/components/storefront/StoreLayout";
import { HomePage } from "@/pages/store/Home";
import { StoreProductsPage } from "@/pages/store/Products";
import { StoreProductDetailPage } from "@/pages/store/ProductDetail";
import { StoreCheckoutPage } from "@/pages/store/Checkout";
import { StoreMyOrdersPage } from "@/pages/store/MyOrders";
import { StoreContactPage } from "@/pages/store/Contact";

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
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />

        {/* ======================================================== */}
        {/* ⚙️ Protected Admin Dashboard Routes                     */}
        {/* ======================================================== */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardWrapper />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/stock" element={<StockPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/payments" element={<PaymentsPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/broadcast" element={<BroadcastPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />

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
