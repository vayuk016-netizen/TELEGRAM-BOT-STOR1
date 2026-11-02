"use client";

import React from "react";
import { DollarSign, PackageCheck, AlertTriangle, Users } from "lucide-react";
import { MetricCard } from "@/components/features/analytics/metric-card";
import { LiveFeed } from "@/components/features/analytics/live-feed";
import { useLiveAnalytics } from "@/hooks/use-websocket";
import { formatCurrency } from "@/lib/utils";
import { useLanguageStore } from "@/store/use-language-store";
import { useThemeStore } from "@/store/use-theme-store";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const sampleChartData = [
  { name: "Mon", revenue: 0, sales: 0 },
  { name: "Tue", revenue: 0, sales: 0 },
  { name: "Wed", revenue: 0, sales: 0 },
  { name: "Thu", revenue: 0, sales: 0 },
  { name: "Fri", revenue: 0, sales: 0 },
  { name: "Sat", revenue: 0, sales: 0 },
  { name: "Sun", revenue: 0, sales: 0 },
];

export default function DashboardPage() {
  const { data, loading } = useLiveAnalytics(4000);
  const { t } = useLanguageStore();
  const { theme } = useThemeStore();

  const todayRevenue = data?.today_revenue ?? 0.0;
  const totalRevenue = data?.total_revenue ?? 0.0;
  const soldToday = data?.sold_today ?? 0;
  const totalOrders = data?.total_orders ?? 0;
  const lowStock = data?.low_stock_alerts ?? 0;
  const totalUsers = data?.total_users ?? 0;
  const liveFeed = data?.live_feed ?? [];
  const chartData = data?.chart_data && data.chart_data.length > 0 ? data.chart_data : sampleChartData;

  const isKhmer = t("today_revenue").includes("ចំណូល");

  return (
    <div className="space-y-6">
      {/* 📊 Quick Stats Bar */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t("today_revenue")}
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          variant="blue"
          loading={loading}
        />
        <MetricCard
          title={t("sold_today")}
          value={soldToday.toString()}
          icon={PackageCheck}
          variant="emerald"
          loading={loading}
        />
        <MetricCard
          title={t("low_stock_warning")}
          value={lowStock.toString()}
          icon={AlertTriangle}
          variant="amber"
          loading={loading}
        />
        <MetricCard
          title={t("total_bot_users")}
          value={totalUsers.toLocaleString()}
          icon={Users}
          variant="purple"
          loading={loading}
        />
      </div>

      {/* Main Analytics Grid: Chart + Live Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue & Sales Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6 shadow-sm dark:shadow-lg backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 font-sans">
            <div>
              <h3 className="text-sm font-bold text-slate-100">{t("revenue_sales_analytics")}</h3>
              <p className="text-[11px] font-medium text-slate-400">{isKhmer ? "ទិន្នន័យការលក់រយៈពេល ៧ ថ្ងៃចុងក្រោយ" : "7-Day Sales & Revenue Trends"}</p>
            </div>
            <div className="flex gap-1 text-[11px]">
              <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
                {t("weekly")}
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            {loading ? (
              <div className="h-full w-full rounded-xl bg-slate-900/40 animate-pulse flex items-center justify-center border border-slate-800/40">
                <div className="space-y-4 w-5/6">
                  <div className="h-4 w-1/4 rounded bg-slate-800/50" />
                  <div className="h-28 rounded bg-slate-800/20 relative overflow-hidden flex items-end">
                    <div className="w-full flex items-end justify-between px-4 h-full pt-6">
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[20%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[40%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[35%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[65%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[50%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[80%]" />
                      <div className="w-[10%] bg-slate-800/30 rounded-t h-[95%]" />
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <div>Mon</div>
                    <div>Wed</div>
                    <div>Fri</div>
                    <div>Sun</div>
                  </div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#1e293b" : "#e2e8f0"} />
                  <XAxis dataKey="name" stroke={theme === "dark" ? "#94a3b8" : "#475569"} fontSize={11} fontWeight={500} />
                  <YAxis stroke={theme === "dark" ? "#94a3b8" : "#475569"} fontSize={11} fontWeight={500} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === "dark" ? "#0f172a" : "#ffffff",
                      borderColor: theme === "dark" ? "#1e293b" : "#e2e8f0",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                      color: theme === "dark" ? "#f8fafc" : "#0f172a",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ⚡ Live Bot Orders Feed */}
        <div className="lg:col-span-1">
          <LiveFeed feedItems={liveFeed} loading={loading} />
        </div>
      </div>
    </div>
  );
}
