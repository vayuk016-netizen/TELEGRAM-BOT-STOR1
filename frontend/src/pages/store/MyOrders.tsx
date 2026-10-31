"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShoppingBag,
  Send,
  User,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { storeService, OrderDetail } from "@/services/store.service";
import { useCustomerStore } from "@/store/use-customer-store";
import { useLanguageStore } from "@/store/use-language-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const StoreMyOrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguageStore();
  const { customer, setCustomer } = useCustomerStore();

  const [orderSearchId, setOrderSearchId] = useState(searchParams.get("id") || "");
  const [searchedOrder, setSearchedOrder] = useState<OrderDetail | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // If customer is logged in, fetch their order history
  useEffect(() => {
    if (customer?.telegram_id) {
      const fetchHistory = async () => {
        try {
          setLoadingOrders(true);
          const orders = await storeService.getUserOrders(customer.telegram_id);
          setCustomerOrders(orders);
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchHistory();
    }
  }, [customer]);

  // If query param ?id=123 is present, auto-lookup
  useEffect(() => {
    const idFromParam = searchParams.get("id");
    if (idFromParam) {
      handleLookupOrder(Number(idFromParam));
    }
  }, [searchParams]);

  const handleLookupOrder = async (orderIdNum?: number) => {
    const targetId = orderIdNum || Number(orderSearchId.replace(/\D/g, ""));
    if (!targetId) return;

    setSearchError("");
    setLoadingOrders(true);
    try {
      const res = await storeService.getOrderStatus(targetId);
      setSearchedOrder(res);
    } catch (err: any) {
      setSearchError(err.response?.data?.detail || "Order not found. Please verify your Order ID.");
      setSearchedOrder(null);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Telegram Login Callback Handler (if using standard Telegram Login Widget)
  useEffect(() => {
    // Expose login function on window for Telegram Widget callback
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        const res = await storeService.telegramLogin(user);
        setCustomer(res.user, res.access_token);
      } catch (err) {
        console.error("Telegram Login Error:", err);
      }
    };
  }, [setCustomer]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            {t("nav_orders")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your order status and retrieve your delivered license keys anytime.
          </p>
        </div>

        {/* Telegram Login integration pill */}
        {!customer && (
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs">
            <Send className="h-4 w-4 text-blue-500" />
            <span className="font-semibold text-blue-500">
              Have Telegram? Login to view all orders:
            </span>
            <a
              href="https://t.me/sopha9926"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 text-[11px]"
            >
              @sopha9926
            </a>
          </div>
        )}
      </div>

      {/* 🔍 Search / Lookup Order by ID Box */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4 shadow-sm backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Instant Order Lookup (By Order ID)
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              value={orderSearchId}
              onChange={(e) => setOrderSearchId(e.target.value)}
              placeholder="Enter your Order ID (e.g. 101)..."
              className="pl-10 h-11 bg-slate-950 border-slate-800 text-xs rounded-xl"
            />
          </div>
          <Button
            onClick={() => handleLookupOrder()}
            disabled={!orderSearchId}
            className="h-11 px-6 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white gap-2 flex-shrink-0"
          >
            <Search className="h-4 w-4" />
            <span>Search Order</span>
          </Button>
        </div>

        {searchError && (
          <p className="text-xs text-rose-500 font-bold">{searchError}</p>
        )}
      </div>

      {/* Result of Searched Order */}
      {searchedOrder && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6 shadow-md animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400">ORDER RECORD</span>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <span>#{searchedOrder.order_id}</span>
                <span className="text-slate-400 font-normal">|</span>
                <span>{searchedOrder.product?.title}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                searchedOrder.status === "COMPLETED" || searchedOrder.status === "PAID"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              }`}>
                {searchedOrder.status === "COMPLETED" ? t("status_completed") : t("status_pending")}
              </span>
              <span className="text-base font-black text-blue-500 font-mono">
                ${searchedOrder.total_amount?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Delivered Keys Box if completed */}
          {searchedOrder.delivered_payload ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t("delivered_keys")}</span>
                </span>
                <button
                  onClick={() => handleCopy(searchedOrder.delivered_payload || "")}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey === searchedOrder.delivered_payload ? t("key_copied") : t("copy_key")}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-sm border border-slate-800 shadow-inner select-all whitespace-pre-wrap break-all leading-relaxed">
                {searchedOrder.delivered_payload}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-medium">
              Payment is awaiting confirmation. License keys will appear here automatically as soon as payment is confirmed.
            </div>
          )}
        </div>
      )}

      {/* 📜 Logged In Customer Orders Table */}
      {customer && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Order History for @{customer.username || customer.first_name}</span>
          </h3>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading orders...</div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-800 p-8 space-y-2">
              <ShoppingBag className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-400">{t("no_orders_found")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {customerOrders.map((ord) => (
                <div
                  key={ord.order_id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">#{ord.order_id}</span>
                      <span className="font-bold text-sm text-slate-100">{ord.product_title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-500 text-sm">${ord.total_amount?.toFixed(2)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ord.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                  </div>

                  {ord.delivered_payload && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-400">Delivered Key:</span>
                        <button
                          onClick={() => handleCopy(ord.delivered_payload)}
                          className="text-blue-500 hover:underline flex items-center gap-1 font-bold"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedKey === ord.delivered_payload ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 break-all select-all border border-slate-800">
                        {ord.delivered_payload}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

