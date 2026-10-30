"use client";

import React, { useState, useEffect } from "react";
import { ShoppingCart, RefreshCw, Eye, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">🛒 Customer Orders & Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete transaction order history and instant digital content delivery logs.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </Button>
      </div>

      {/* Orders Data Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Purchased Item</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date & Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                {loading ? "Loading order audit logs..." : "No customer orders recorded yet."}
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => {
              const customerName = order.user
                ? `@${order.user.username}` || order.user.first_name
                : `User #${order.user_id}`;
              const itemTitle = order.items?.[0]?.product?.title || "Digital License Key";
              const isWebsite = order.source === "website";

              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs text-slate-400">#{order.id}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                      isWebsite
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    }`}>
                      {isWebsite ? "🌐 Website" : "🤖 Telegram"}
                    </span>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-100">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-blue-400" />
                      <span>{customerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{itemTitle}</TableCell>
                  <TableCell className="font-bold text-emerald-400">
                    {formatCurrency(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.status === "COMPLETED" ? "success" : "danger"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {new Date(order.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
