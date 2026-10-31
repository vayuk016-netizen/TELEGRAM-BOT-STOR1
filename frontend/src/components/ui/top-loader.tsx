import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

type LoaderListener = (state: { progress: number; visible: boolean }) => void;

class TopLoaderManager {
  private activeCount = 0;
  private progress = 0;
  private visible = false;
  private listeners: Set<LoaderListener> = new Set();
  private trickleTimer: ReturnType<typeof setInterval> | null = null;
  private completeTimer: ReturnType<typeof setTimeout> | null = null;
  private safetyTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe(listener: LoaderListener) {
    this.listeners.add(listener);
    listener({ progress: this.progress, visible: this.visible });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) =>
      listener({ progress: this.progress, visible: this.visible })
    );
  }

  start() {
    this.activeCount++;

    if (this.completeTimer) {
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }

    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
    }

    // Auto-complete safety timeout (12 seconds)
    this.safetyTimer = setTimeout(() => {
      this.forceComplete();
    }, 12000);

    if (!this.visible) {
      this.visible = true;
      this.progress = Math.max(this.progress, 20);
      this.notify();
      this.startTrickle();
    }
  }

  private startTrickle() {
    if (this.trickleTimer) clearInterval(this.trickleTimer);

    this.trickleTimer = setInterval(() => {
      if (this.progress < 45) {
        this.progress += Math.random() * 12 + 6;
      } else if (this.progress < 75) {
        this.progress += Math.random() * 6 + 3;
      } else if (this.progress < 90) {
        this.progress += Math.random() * 2 + 1;
      } else if (this.progress < 96) {
        this.progress += 0.4;
      }
      this.notify();
    }, 180);
  }

  done() {
    if (this.activeCount > 0) {
      this.activeCount--;
    }

    if (this.activeCount <= 0) {
      this.forceComplete();
    }
  }

  forceComplete() {
    this.activeCount = 0;
    if (this.trickleTimer) {
      clearInterval(this.trickleTimer);
      this.trickleTimer = null;
    }
    if (this.safetyTimer) {
      clearTimeout(this.safetyTimer);
      this.safetyTimer = null;
    }

    this.progress = 100;
    this.notify();

    if (this.completeTimer) clearTimeout(this.completeTimer);

    this.completeTimer = setTimeout(() => {
      this.visible = false;
      this.notify();

      setTimeout(() => {
        this.progress = 0;
        this.notify();
      }, 300);
    }, 280);
  }
}

export const topLoaderManager = new TopLoaderManager();

export interface TopLoaderProps {
  color?: string;
  height?: number;
  showSpinner?: boolean;
}

export const TopLoader: React.FC<TopLoaderProps> = ({
  color = "#ef4444",
  height = 2,
  showSpinner = false,
}) => {
  const location = useLocation();
  const [state, setState] = useState({ progress: 0, visible: false });

  useEffect(() => {
    return topLoaderManager.subscribe(setState);
  }, []);

  // Trigger smooth loading on route changes
  useEffect(() => {
    topLoaderManager.start();
    const timer = setTimeout(() => {
      topLoaderManager.done();
    }, 320);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  if (!state.visible && state.progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[999999] w-full"
      style={{
        opacity: state.visible ? 1 : 0,
        transition: "opacity 300ms ease-in-out",
      }}
    >
      {/* Progress Bar Container - Thin & Sleek */}
      <div
        className="relative"
        style={{
          width: `${Math.min(100, state.progress)}%`,
          height: `${height}px`,
          background: `linear-gradient(90deg, ${color} 0%, #f43f5e 50%, #fb7185 100%)`,
          boxShadow: `0 0 8px ${color}, 0 0 2px rgba(244, 63, 94, 0.5)`,
          transition: "width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        {/* Subtle, refined flare peg at the front of the bar */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: "60px",
            height: "100%",
            boxShadow: `0 0 10px 1px ${color}, 0 0 4px 1px #f43f5e`,
            opacity: 0.9,
            transform: "rotate(2deg) translate(0px, -2px)",
          }}
        />
      </div>

      {/* Optional Top-Right Sleek Spinner */}
      {showSpinner && state.visible && (
        <div
          style={{
            position: "fixed",
            top: "12px",
            right: "12px",
            zIndex: 999999,
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              boxSizing: "border-box",
              border: `2px solid transparent`,
              borderTopColor: color,
              borderLeftColor: color,
              borderRadius: "50%",
              animation: "toploader-spin 400ms linear infinite",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toploader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

