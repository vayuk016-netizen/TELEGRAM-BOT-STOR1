"use client";

import React, { useState } from "react";
import {
  X,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  ShoppingBag,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    order_id: number;
    created_at?: string;
    total_amount: number;
    payment_method?: string;
    product?: {
      title: string;
      price: number;
    };
    delivered_payload?: string | null;
    customer_name?: string;
    telegram_id?: number | string;
  } | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleString("km-KH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : new Date().toLocaleString("km-KH");

  const invoiceNo = `#INV-${String(order.order_id).padStart(6, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[95vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl text-slate-100 overflow-hidden my-auto print:bg-white print:text-black print:border-none print:shadow-none print:max-w-full">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/50 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>វិក្កយបត្រផ្លូវការ / Official Invoice</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-7 text-xs px-2.5 gap-1.5 border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>បោះពុម្ព (Print)</span>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7 space-y-6 print:p-0 print:overflow-visible">
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:border-slate-300">
            <div className="flex items-center gap-3.5">
              <img
                src="/images/sp-shop-logo.jpg"
                alt="SP Shop"
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-lg border border-blue-500/20 flex-shrink-0"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white print:text-black flex items-center gap-2">
                  <span>SP Shop</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Official Store
                  </span>
                </h2>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                  សេវាកម្មឌីជីថល & License Keys គុណភាពខ្ពស់
                </p>
                <p className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                  Telegram: @sopha9926 • Website: sophasok.store
                </p>
              </div>
            </div>

            {/* Invoice Stamp / Paid Badge */}
            <div className="text-left sm:text-right flex-shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm print:bg-emerald-50 print:text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>PAID / បង់រួចរាល់</span>
              </span>
              <div className="mt-2 text-right">
                <div className="font-mono font-black text-sm text-blue-400 print:text-blue-600">
                  {invoiceNo}
                </div>
                <div className="text-[11px] text-slate-400 print:text-slate-600">
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs print:bg-slate-50 print:border-slate-200 print:text-slate-900">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                អតិថិជន (Billed To)
              </span>
              <div className="font-bold text-slate-200 print:text-black">
                {order.customer_name || "Valued Customer"}
              </div>
              {order.telegram_id && (
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  Telegram ID: <code>{order.telegram_id}</code>
                </div>
              )}
            </div>

            <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                វិធីសាស្ត្រទូទាត់ (Payment Method)
              </span>
              <div className="font-bold text-slate-200 print:text-black">
                {order.payment_method?.toUpperCase() || "BAKONG KHQR"} / ABA Mobile
              </div>
              <div className="text-emerald-400 font-semibold text-[11px] mt-0.5">
                Instant Automatic Settlement
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden print:border-slate-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 print:bg-slate-100 print:border-slate-300 print:text-slate-700">
                <tr>
                  <th className="py-2.5 px-3.5 font-bold">ទំនិញ (Item Description)</th>
                  <th className="py-2.5 px-3 font-bold text-center">ចំនួន (Qty)</th>
                  <th className="py-2.5 px-3 font-bold text-right">តម្លៃឯកតា (Unit)</th>
                  <th className="py-2.5 px-3.5 font-bold text-right">សរុប (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 print:divide-slate-200">
                <tr>
                  <td className="py-3 px-3.5">
                    <div className="font-bold text-slate-100 print:text-black">
                      {order.product?.title || "Digital Goods / License Subscription"}
                    </div>
                    <div className="text-[10px] text-slate-400 print:text-slate-600 mt-0.5">
                      Instant Automated Vault Delivery
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono">1</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300 print:text-black">
                    ${(order.product?.price || order.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-400 print:text-emerald-700">
                    ${order.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-950/60 border-t border-slate-800 font-bold print:bg-slate-50 print:border-slate-300">
                <tr>
                  <td colSpan={3} className="py-3 px-3.5 text-right text-slate-400">
                    ទឹកប្រាក់សរុបបានបង់ (Total Paid):
                  </td>
                  <td className="py-3 px-3.5 text-right text-base font-black font-mono text-blue-400 print:text-blue-700">
                    ${order.total_amount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Delivered Keys Box */}
          {order.delivered_payload && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:bg-slate-50 print:border-slate-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 print:text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>កូដទំនិញ / គណនីរបស់អ្នក (Delivered Credentials)</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.delivered_payload || "")}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors print:hidden"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "ចម្លងរួច" : "ចម្លងកូដ"}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-400 print:text-emerald-800 bg-slate-900/80 print:bg-white p-3 rounded-xl border border-slate-800/80 select-all break-all whitespace-pre-wrap leading-relaxed">
                {order.delivered_payload}
              </div>
            </div>
          )}

          {/* Invoice Note & Footer */}
          <div className="text-center space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400 print:border-slate-300 print:text-slate-600">
            <p className="font-medium text-slate-300 print:text-black">
              🙏 សូមអរគុណសម្រាប់ការគាំទ្រ SP Shop!
            </p>
            <p className="text-[11px] text-slate-500">
              រាល់ទំនិញទាំងអស់ត្រូវបានការពារ និងធានាគុណភាពជូនអតិថិជន ២៤/៧។
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Telegram Support: @sopha9926 • Website: https://sophasok.store
            </p>
          </div>
        </div>

        {/* Bottom Actions (Hidden when printing) */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-2.5 print:hidden flex-shrink-0 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs px-3"
          >
            បិទ (Close)
          </Button>

          <div className="flex items-center gap-2">
            <a
              href={`/api/v1/public/invoice/${order.order_id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 text-xs font-semibold px-3 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              title="Download Official Invoice Image"
            >
              <Download className="h-3.5 w-3.5" />
              <span>រូបភាពវិក្កយបត្រ (PNG)</span>
            </a>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-bold gap-1.5 px-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:via-indigo-500 hover:to-rose-500 text-white shadow-md shadow-blue-500/20"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>បោះពុម្ព (Print)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

