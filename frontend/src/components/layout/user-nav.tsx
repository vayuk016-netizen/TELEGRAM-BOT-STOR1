"use client";

import React, { useState } from "react";
import { User, LogOut, Shield } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";
import { useSidebarStore } from "@/store/use-sidebar-store";
import { cn } from "@/lib/utils";

interface UserNavProps {
  showDetails?: boolean;
}

export const UserNav: React.FC<UserNavProps> = ({ showDetails }) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isOpen } = useSidebarStore();
  const shouldShowDetails = showDetails !== undefined ? showDetails : isOpen;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      logout();
      window.location.href = "/login";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl p-2 transition-all duration-300 w-full group active:scale-[0.98] border cursor-pointer bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-blue-500/40 shadow-sm",
          !shouldShowDetails && "justify-center px-2"
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400 group-hover:scale-105 transition-all duration-300">
          <User className="h-4 w-4" />
        </div>
        {shouldShowDetails && (
          <div className="flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold transition-colors truncate text-slate-100 group-hover:text-blue-500">
              {user?.username || "Admin"}
            </span>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold capitalize truncate">
              {user?.role || "Administrator"}
            </span>
          </div>
        )}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className={cn(
            "absolute bottom-full mb-3 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-2 shadow-2xl z-50 min-w-[12rem] left-0 animate-in fade-in zoom-in-95 duration-200 text-slate-100",
            shouldShowDetails ? "w-full" : "w-44"
          )}>
            <div className="px-3 py-2 border-b border-slate-800 text-xs flex items-center gap-2 font-semibold text-slate-300">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
              <span>{user?.username || "Admin"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 mt-1 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
