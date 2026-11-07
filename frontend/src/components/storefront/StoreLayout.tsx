"use client";

import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { StoreNavbar } from "./Navbar";
import { StoreFooter } from "./Footer";
import { useThemeStore } from "@/store/use-theme-store";

export const StoreLayout: React.FC = () => {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-kantumruy-pro transition-colors selection:bg-blue-500 selection:text-white relative isolate overflow-x-hidden">
      
      {/* 🌌 Smooth Clean Ambient Background (Pure Clean Darkness with No Grid Boxes) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden hidden dark:block">
        {/* Soft Top Ambient Aura */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1200px] h-[550px] bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.12),rgba(99,102,241,0.05),transparent_70%)] blur-3xl" />

        {/* Soft Side Ambient Glows */}
        <div className="absolute top-[35%] -left-48 w-96 h-96 bg-blue-600/6 rounded-full blur-[120px]" />
        <div className="absolute top-[65%] -right-48 w-96 h-96 bg-indigo-600/6 rounded-full blur-[120px]" />
      </div>

      <StoreNavbar />
      <main className="flex-1 relative z-0">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
};

