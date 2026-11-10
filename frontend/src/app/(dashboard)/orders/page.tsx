"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, RefreshCw, Eye, UserCheck, CheckCircle2, ShieldCheck, XCircle, FileText, KeyRound, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedKeyPayload, setSelectedKeyPayload] = useState<{ orderId: number; payload: string } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleVerifyBakong = async (orderId: number) => {
    setActionLoadingId(orderId);
    setFeedback(null);
    try {
      const res = await orderService.verifyBakongOrder(orderId);
      if (res.status === "COMPLETED") {
        setFeedback({ type: "success", message: `Order #${orderId} confirmed via Bakong! Keys delivered.` });
        await fetchOrders();
      } else {
        setFeedback({ type: "error", message: `Order #${orderId}: No payment detected on Bakong yet.` });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.response?.data?.detail || "Verification failed." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFulfillManually = async (orderId: number) => {
    if (!confirm(`Are you sure you want to manually fulfill Order #${orderId}? This will lock & decrypt license keys and deliver them to the customer.`)) {
      return;
    }
    setActionLoadingId(orderId);
    setFeedback(null);
    try {
      const res = await orderService.fulfillOrderManually(orderId);
      setFeedback({ type: "success", message: res.message || `Order #${orderId} fulfilled successfully!` });
      await fetchOrders();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.response?.data?.detail || "Manual fulfillment failed. Check stock keys." });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm(`Cancel Order #${orderId}?`)) return;
    setActionLoadingId(orderId);
    setFeedback(null);
    try {
      await orderService.cancelOrder(orderId);
      setFeedback({ type: "success", message: `Order #${orderId} cancelled.` });
      await fetchOrders();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.response?.data?.detail || "Failed to cancel order." });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a] dark:text-white">🛒 Customer Orders & Audit Logs</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time transaction tracking, Bakong verification, manual approvals, and digital delivery logs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </Button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400"
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* 💻 Desktop & Tablet Full Data Table (≥ 768px) */}
      <div className="hidden md:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="bg-gray-50/90 dark:bg-slate-900/90 hover:bg-gray-50/90 dark:hover:bg-slate-900/90 hover:shadow-none">
                <TableHead className="w-16 whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Order ID</TableHead>
                <TableHead className="w-24 whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Source</TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Customer</TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Purchased Item</TableHead>
                <TableHead className="min-w-[100px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Total Amount</TableHead>
                <TableHead className="min-w-[110px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="min-w-[90px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Method</TableHead>
                <TableHead className="min-w-[160px] whitespace-nowrap font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Date & Time</TableHead>
                <TableHead className="min-w-[230px] whitespace-nowrap text-right font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                    {loading ? "Loading order audit logs..." : "No customer orders recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const customerName = order.user
                    ? `@${order.user.username}` || order.user.first_name
                    : `User #${order.user_id}`;
                  const item = order.items?.[0];
                  const itemTitle = item?.product?.title || "Digital License Key";
                  const isWebsite = order.source === "website";
                  const isPending = order.status === "PENDING";
                  const isCompleted = order.status === "COMPLETED" || order.status === "DELIVERED";
                  const isProcessing = actionLoadingId === order.id;

                  return (
                    <TableRow key={order.id} className="transition-all duration-150">
                      <TableCell className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">#{order.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                          isWebsite
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                        }`}>
                          {isWebsite ? "🌐 Website" : "🤖 Telegram"}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-[#0f172a] dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span>{customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[#0f172a] dark:text-slate-200 whitespace-nowrap font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{itemTitle}</span>
                          {item?.delivered_payload && (
                            <button
                              onClick={() => setSelectedKeyPayload({ orderId: order.id, payload: item.delivered_payload! })}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors p-1"
                              title="View Delivered Key"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={isCompleted ? "success" : isPending ? "warning" : "danger"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs uppercase text-slate-700 dark:text-slate-400 font-mono whitespace-nowrap font-medium">
                        {order.payment_method || "KHQR"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVerifyBakong(order.id)}
                                disabled={isProcessing}
                                className="h-7 px-2.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-500/10 whitespace-nowrap"
                              >
                                Check Bakong
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleFulfillManually(order.id)}
                                disabled={isProcessing}
                                className="h-7 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white whitespace-nowrap shadow-sm"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={isProcessing}
                                className="h-7 px-2 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 whitespace-nowrap"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {order.receipt_url && (
                            <a
                              href={order.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline px-2 py-1 font-semibold"
                            >
                              <FileText className="h-3 w-3" />
                              <span>Slip</span>
                            </a>
                          )}
                          {isCompleted && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Delivered</span>
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 📱 Mobile Responsive Touch Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-8 text-center text-slate-500 text-xs">
            {loading ? "Loading order audit logs..." : "No customer orders recorded yet."}
          </div>
        ) : (
          orders.map((order) => {
            const customerName = order.user
              ? `@${order.user.username}` || order.user.first_name
              : `User #${order.user_id}`;
            const item = order.items?.[0];
            const itemTitle = item?.product?.title || "Digital License Key";
            const isWebsite = order.source === "website";
            const isPending = order.status === "PENDING";
            const isCompleted = order.status === "COMPLETED" || order.status === "DELIVERED";
            const isProcessing = actionLoadingId === order.id;

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/80 p-4 space-y-3 shadow-sm backdrop-blur-sm transition-all"
              >
                {/* Header: ID, Source, Status */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">#{order.id}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                      isWebsite
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                    }`}>
                      {isWebsite ? "🌐 Website" : "🤖 Telegram"}
                    </span>
                  </div>
                  <Badge variant={isCompleted ? "success" : isPending ? "warning" : "danger"}>
                    {order.status}
                  </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Customer</span>
                    <span className="font-bold text-[#0f172a] dark:text-white flex items-center gap-1 mt-0.5 truncate">
                      <UserCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      {customerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Amount & Method</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatCurrency(order.total_amount)}
                      <span className="ml-1 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal">
                        ({order.payment_method || "KHQR"})
                      </span>
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[11px] block">Purchased Item</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{itemTitle}</span>
                      {item?.delivered_payload && (
                        <button
                          onClick={() => setSelectedKeyPayload({ orderId: order.id, payload: item.delivered_payload! })}
                          className="text-emerald-600 dark:text-emerald-400 p-0.5"
                          title="View Delivered Key"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                    {order.receipt_url && (
                      <a
                        href={order.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 dark:text-purple-400 underline font-semibold flex items-center gap-0.5"
                      >
                        <FileText className="h-3 w-3" />
                        Slip
                      </a>
                    )}
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                {isPending && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyBakong(order.id)}
                      disabled={isProcessing}
                      className="h-8 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/30 hover:bg-blue-50"
                    >
                      Check Bakong
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleFulfillManually(order.id)}
                      disabled={isProcessing}
                      className="h-8 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isProcessing}
                      className="h-8 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {isCompleted && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Delivered to Customer
                    </span>
                    {item?.delivered_payload && (
                      <button
                        onClick={() => setSelectedKeyPayload({ orderId: order.id, payload: item.delivered_payload! })}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline"
                      >
                        View License Key
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delivered License Key Modal */}
      {selectedKeyPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4 shadow-2xl text-[#0f172a] dark:text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f172a] dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-emerald-500" />
                <span>Delivered Digital Keys for Order #{selectedKeyPayload.orderId}</span>
              </h3>
              <button
                onClick={() => setSelectedKeyPayload(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400 select-all whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
              {selectedKeyPayload.payload}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedKeyPayload.payload);
                  alert("Copied to clipboard!");
                }}
              >
                Copy Content
              </Button>
              <Button size="sm" onClick={() => setSelectedKeyPayload(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
