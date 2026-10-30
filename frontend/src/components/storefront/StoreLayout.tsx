"use client";

import React from "react";
import { Outlet } from "react-router-dom";
import { StoreNavbar } from "./Navbar";
import { StoreFooter } from "./Footer";

export const StoreLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-kantumruy-pro transition-colors selection:bg-blue-500 selection:text-white">
      <StoreNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <StoreFooter />
    </div>
  );
};

