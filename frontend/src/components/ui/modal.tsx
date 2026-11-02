import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={cn(
          "relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl text-slate-100",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 mb-3 sm:mb-4 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">{children}</div>
      </div>
    </div>
  );
};
