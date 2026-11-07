"use client";

import React from "react";
import { Activity, ShoppingBag, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface LiveFeedProps {
  feedItems: Array<{
    order_id: number;
    user: string;
    product_title: string;
    amount: number;
    created_at: string;
  }>;
  loading?: boolean;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ feedItems, loading = false }) => {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm dark:shadow-md backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2.5 border-b border-gray-200 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Activity className="h-4 w-4 animate-pulse" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] dark:text-white whitespace-nowrap truncate">
            ⚡ Live Bot Orders <span className="hidden sm:inline">Activity</span>
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider whitespace-nowrap shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          REAL-TIME
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[340px]">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800/80 animate-pulse text-xs shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3 w-16 rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="h-3.5 w-32 rounded bg-gray-100/70 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="space-y-1.5 flex flex-col items-end">
                <div className="h-3.5 w-10 rounded bg-gray-100 dark:bg-slate-800" />
                <div className="h-2.5 w-8 rounded bg-gray-100/70 dark:bg-slate-800/60" />
              </div>
            </div>
          ))
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-500 text-xs">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <span>No bot order activities recorded yet.</span>
          </div>
        ) : (
          feedItems.map((item) => (
            <div
              key={item.order_id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-950/70 border border-gray-200 dark:border-slate-800/80 shadow-xs hover:shadow-sm hover:border-blue-400 dark:hover:border-slate-700 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-[#0f172a] dark:text-slate-100 truncate block">{item.user}</span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{item.product_title}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap block">{formatCurrency(item.amount)}</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">#{item.order_id}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
