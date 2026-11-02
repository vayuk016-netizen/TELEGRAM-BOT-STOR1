import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export const DashboardWrapper: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Pane 1: Sidebar Navigation */}
      <Sidebar />

      {/* Pane 2 & 3: Main Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar Header */}
        <Topbar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
