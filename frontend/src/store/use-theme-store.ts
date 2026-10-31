import { create } from "zustand";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  initTheme: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyThemeToDOM = (theme: Theme) => {
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }
};

const getActualDOMTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("dashboard_theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  }
  return "dark";
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: typeof window !== "undefined" ? getActualDOMTheme() : "dark",
  initTheme: () => {
    if (typeof window !== "undefined") {
      const current = getActualDOMTheme();
      applyThemeToDOM(current);
      set({ theme: current });
    }
  },
  setTheme: (newTheme: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard_theme", newTheme);
    }
    applyThemeToDOM(newTheme);
    set({ theme: newTheme });
  },
  toggleTheme: () => {
    if (typeof window !== "undefined") {
      // Check actual DOM state directly to guarantee flawless toggling
      const isCurrentlyDark = document.documentElement.classList.contains("dark");
      const nextTheme: Theme = isCurrentlyDark ? "light" : "dark";
      
      localStorage.setItem("dashboard_theme", nextTheme);
      applyThemeToDOM(nextTheme);
      set({ theme: nextTheme });
    }
  },
}));


