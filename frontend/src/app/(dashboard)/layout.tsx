import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Pane 1: Sidebar Navigation */}
      <Sidebar />

      {/* Pane 2 & 3: Main Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Header */}
        <Topbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
