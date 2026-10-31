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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-kantumruy-pro transition-colors selection:bg-blue-500 selection:text-white">
      <StoreNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
};

