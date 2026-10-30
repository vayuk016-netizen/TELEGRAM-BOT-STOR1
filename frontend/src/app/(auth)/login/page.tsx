"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.login(username, password);
      const user = await authService.getMe();
      setUser(user);
      navigate("/admin");
    } catch (err: any) {
      if (err.code === "ERR_NETWORK" || !err.response) {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || "https://telegram-bot-stor1.onrender.com/api/v1";
        setError(`Cannot connect to Backend Server (${apiUrl}). Please make sure the backend is running and CORS is configured!`);
      } else {
        setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
      
      {/* LEFT COLUMN: Clean Light Panel with Sharp Dark Black Text */}
      <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-white text-[#0f172a] relative z-10">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a] tracking-wide">Store Manager Bot</h2>
              <span className="text-[11px] font-mono font-bold text-blue-700 tracking-wider">AUTOMATION CONTROL PANEL</span>
            </div>
          </div>

          {/* Welcome Titles - Sharp Crisp Dark Black Text */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f172a]">
              សូមស្វាគមន៍ (Welcome Back)
            </h1>

          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-bold animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form Controls */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#0f172a] mb-1.5 uppercase tracking-wide">
                Email / Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-700 z-10" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="vayuk016@gmail.com"
                  className="pl-10 h-11 bg-slate-50 border-slate-300 text-[#0f172a] font-extrabold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm rounded-xl shadow-sm transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#0f172a] mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-700 z-10" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-slate-50 border-slate-300 text-[#0f172a] font-extrabold placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 text-sm rounded-xl shadow-sm transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-700 hover:text-black transition-colors z-10"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>



            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 text-sm font-bold gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/25 rounded-xl transition-all transform active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>


      </div>

      {/* RIGHT COLUMN: Vibrant Automation & 3D Bot Illustration Panel */}
      <div className="lg:col-span-6 relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-8 sm:p-12 flex flex-col justify-between overflow-hidden text-white min-h-[400px] lg:min-h-full">
        
        {/* Decorative Graphic Waves & Circles */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

        {/* 3D Bot / Automation Floating Graphic Illustration */}
        <div className="relative z-10 flex flex-col items-center justify-center py-12 my-auto">
          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center">
            
            {/* Ambient Glowing Aura */}
            <div className="absolute h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl animate-pulse-glow" />

            {/* Center Robot / Automation SVG Avatar */}
            <div className="relative animate-float z-10 flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-56 h-56 drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Robot Head */}
                <rect x="60" y="40" width="80" height="65" rx="18" fill="url(#botGrad)" stroke="#67e8f9" strokeWidth="2.5" />
                {/* Robot Antennas */}
                <line x1="100" y1="40" x2="100" y2="22" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" />
                <circle cx="100" cy="18" r="6" fill="#38bdf8" className="animate-pulse" />
                
                {/* Robot Screen Face */}
                <rect x="70" y="52" width="60" height="40" rx="10" fill="#090d16" />
                {/* Robot Eyes */}
                <circle cx="86" cy="72" r="7" fill="#38bdf8" />
                <circle cx="114" cy="72" r="7" fill="#38bdf8" />
                <circle cx="88" cy="70" r="2.5" fill="#ffffff" />
                <circle cx="116" cy="70" r="2.5" fill="#ffffff" />

                {/* Robot Body */}
                <rect x="50" y="112" width="100" height="70" rx="20" fill="url(#botGrad)" stroke="#67e8f9" strokeWidth="2.5" />
                {/* Robot Chest Plate */}
                <rect x="65" y="125" width="70" height="42" rx="8" fill="#090d16" />
                <path d="M75 137L95 137" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                <path d="M75 147L115 147" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                <path d="M75 157L105 157" stroke="#f472b6" strokeWidth="3" strokeLinecap="round" />

                <defs>
                  <linearGradient id="botGrad" x1="50" y1="40" x2="150" y2="180" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e40af" />
                    <stop offset="0.5" stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
