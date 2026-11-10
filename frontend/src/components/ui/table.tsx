import React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("border-b border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-900/90 [&_tr]:border-b-0", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
);
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-gray-200/80 dark:border-slate-800/60 transition-all duration-150",
        // 🌟 Blue shape when scrolling, touching, hovering, or active
        "hover:bg-blue-50/80 active:bg-blue-100/90 dark:hover:bg-blue-950/40 dark:active:bg-blue-900/50",
        "hover:shadow-[inset_4px_0_0_0_#2563eb] dark:hover:shadow-[inset_4px_0_0_0_#38bdf8]",
        "active:shadow-[inset_4px_0_0_0_#2563eb] dark:active:shadow-[inset_4px_0_0_0_#38bdf8]",
        "data-[state=selected]:bg-blue-50/90 dark:data-[state=selected]:bg-blue-950/60 data-[state=selected]:shadow-[inset_4px_0_0_0_#2563eb]",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-bold text-gray-700 dark:text-slate-300 text-xs uppercase tracking-wider whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle text-[#0f172a] dark:text-slate-200 [&:has([role=checkbox])]:pr-0", className)} {...props} />
  )
);
TableCell.displayName = "TableCell";
