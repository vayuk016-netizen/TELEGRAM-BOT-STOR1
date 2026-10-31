"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  QrCode,
  Layers,
  Save,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  User,
  Calendar,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  paymentService,
  PaymentManagementData,
  CustomerPaymentItem,
  PaymentHistoryResponse,
  PaymentHistoryFilters,
  TokenTestResult,
} from "@/services/payment.service";
import { useLanguageStore } from "@/store/use-language-store";

export default function PaymentsPage() {
  const { language } = useLanguageStore();
  const isKh = language === "km";

  // General Status & Token Pool State
  const [data, setData] = useState<PaymentManagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Token testing state
  const [testingToken, setTestingToken] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ token: string; result: TokenTestResult } | null>(null);

  // Manage Tokens Modal
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenInputs, setTokenInputs] = useState<string[]>([]);
  const [savingTokens, setSavingTokens] = useState(false);
  const [showTokenPool, setShowTokenPool] = useState(false);

  // Customer Payment History Data Table State
  const [historyItems, setHistoryItems] = useState<CustomerPaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [historySummary, setHistorySummary] = useState({
    total_volume_usd: 0,
    completed_count: 0,
    pending_count: 0,
    failed_count: 0,
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Helper to generate page numbers with ellipsis (e.g., 1, 2, 3, 4, 5)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  // Detail Modal & Action Verification
  const [selectedPayment, setSelectedPayment] = useState<CustomerPaymentItem | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch Token Status & Metrics
  const fetchStatus = async () => {
    try {
      setError("");
      const res = await paymentService.getPaymentStatus();
      setData(res);
      setTokenInputs(res.token_pool.tokens.map((t) => t.full_token));
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          (isKh ? "មិនអាចទាញយកទិន្នន័យបានឡើយ" : "Failed to load payment data")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch Customer Payment History with Filters
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const filters: PaymentHistoryFilters = {
        search: searchTerm.trim() || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        payment_type: typeFilter !== "ALL" ? typeFilter : undefined,
        date_range: dateFilter !== "all" ? dateFilter : undefined,
        page: currentPage,
        page_size: pageSize,
      };

      const res = await paymentService.getPaymentHistory(filters);
      setHistoryItems(res.items);
      setTotalRecords(res.total);
      setTotalPages(res.total_pages);
      setHistorySummary(res.summary);
    } catch (err: any) {
      console.error("Failed to load payment history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, dateFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefreshAll = () => {
    setRefreshing(true);
    fetchStatus();
    fetchHistory();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setDateFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm !== "" || statusFilter !== "ALL" || typeFilter !== "ALL" || dateFilter !== "all";

  const handleTestToken = async (fullToken: string) => {
    setTestingToken(fullToken);
    setTestResult(null);
    try {
      const res = await paymentService.testToken(fullToken);
      setTestResult({ token: fullToken, result: res });
    } catch (err: any) {
      setTestResult({
        token: fullToken,
        result: {
          valid: false,
          status: "ERROR",
          message: err.response?.data?.detail || err.message || "Test failed",
        },
      });
    } finally {
      setTestingToken(null);
    }
  };

  const handleSaveTokens = async () => {
    const validTokens = tokenInputs.map((t) => t.trim()).filter(Boolean);
    if (validTokens.length === 0) {
      setError(isKh ? "សូមបញ្ចូល Token យ៉ាងហោចណាស់មួយ!" : "At least one token is required!");
      return;
    }
    setSavingTokens(true);
    try {
      await paymentService.updateTokens(validTokens);
      setSuccessMsg(
        isKh
          ? `បានរក្សាទុក Bakong Token Pool ចំនួន ${validTokens.length} ជោគជ័យ!`
          : `Successfully updated token pool with ${validTokens.length} token(s)!`
      );
      setIsTokenModalOpen(false);
      await fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to update tokens");
    } finally {
      setSavingTokens(false);
    }
  };

  const handleVerifyPayment = async (item: CustomerPaymentItem) => {
    setVerifyingId(item.id);
    try {
      const res = await paymentService.verifyPayment(item.id);
      if (res.success) {
        setSuccessMsg(res.message);
        await fetchHistory();
        await fetchStatus();
        if (selectedPayment && selectedPayment.id === item.id) {
          setSelectedPayment({
            ...selectedPayment,
            status: "COMPLETED",
            raw_status: "COMPLETED",
          });
        }
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Verification failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const copyToClipboard = (text: string, label: string = "text") => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setSuccessMsg(isKh ? `បានចម្លង ${label} ទៅកាន់ Clipboard!` : `Copied ${label} to clipboard!`);
    setTimeout(() => {
      setCopiedText(null);
      setSuccessMsg("");
    }, 2500);
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString(isKh ? "km-KH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-2 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        <span>{isKh ? "កំពុងទាញយកទិន្នន័យការទូទាត់..." : "Loading payment management..."}</span>
      </div>
    );
  }

  const { token_pool } = data || {
    token_pool: {
      total_tokens: 0,
      active_count: 0,
      exhausted_count: 0,
      total_daily_quota: 0,
      used_requests: 0,
      remaining_quota: 0,
      quota_display: "0/0",
      tokens: [],
    },
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            <CreditCard className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            {isKh ? "គ្រប់គ្រងការទូទាត់ និង Bakong KHQR" : "Customer Payment Management & KHQR"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isKh
              ? "តាមដានប្រវត្តិទូទាត់របស់ Customer តាម Data Table ជាមួយ Filter គ្រប់ជ្រុងជ្រោយ និងត្រួតពិនិត្យ Bakong Multi-Token Quota"
              : "Track customer payment history via Data Table with multi-filters and monitor Bakong token quotas"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={refreshing || historyLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing || historyLoading ? "animate-spin" : ""}`} />
            {isKh ? "Refresh ឡើងវិញ" : "Refresh All"}
          </Button>
          <Button
            size="sm"
            onClick={() => setIsTokenModalOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Layers className="h-4 w-4" />
            {isKh ? "កែប្រែ Token Pool" : "Manage Tokens"}
          </Button>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Payment Volume */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isKh ? "ចំណូលទូទាត់ជោគជ័យ" : "Successful Volume"}
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <QrCode className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              ${(historySummary.total_volume_usd || 0).toFixed(2)}
            </span>
            <span className="text-sm text-slate-500">USD</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {historySummary.completed_count} {isKh ? "ប្រតិបត្តិការបានជោគជ័យ" : "completed transactions"}
          </p>
        </div>

        {/* Stat 2: Completed Payments Count */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isKh ? "ការទូទាត់ជោគជ័យ" : "Completed Orders"}
            </span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {historySummary.completed_count}
            </span>
            <span className="text-sm text-slate-500">{isKh ? "លើក" : "payments"}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isKh ? "ទំនិញត្រូវបានបញ្ជូនដោយស្វ័យប្រវត្ត" : "Digital goods delivered automatically"}
          </p>
        </div>

        {/* Stat 3: Pending Payments */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isKh ? "រង់ចាំការទូទាត់ (Pending)" : "Pending Payments"}
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {historySummary.pending_count}
            </span>
            <span className="text-sm text-slate-500">{isKh ? "លើក" : "pending"}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isKh ? "អាចចុច Verify លើតារាងដើម្បីឆែកផ្ទាល់" : "Can be verified manually from table"}
          </p>
        </div>

        {/* Stat 4: Bakong Token Pool & Daily Limit */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {isKh ? "Bakong Quota ប្រចាំថ្ងៃ" : "Bakong Token Quota"}
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold tracking-tight font-mono ${
                (token_pool.remaining_quota ?? 0) === 0
                  ? "text-rose-600 dark:text-rose-400"
                  : (token_pool.remaining_quota ?? 0) < token_pool.total_daily_quota
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {token_pool.quota_display || `${token_pool.remaining_quota ?? token_pool.total_daily_quota}/${token_pool.total_daily_quota}`}
            </span>
            <span className="text-sm text-slate-500">Req/Day</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-xs font-medium ${
                token_pool.active_count === 0
                  ? "text-rose-600 dark:text-rose-400 font-semibold"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {token_pool.active_count} {isKh ? "Token កំពុងដំណើរការ" : "Active Tokens"}
              {token_pool.used_requests > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-1">
                  ({token_pool.used_requests} {isKh ? "ប្រើអស់" : "used"})
                </span>
              )}
            </span>
            <button
              onClick={() => setShowTokenPool(!showTokenPool)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              {showTokenPool ? (isKh ? "បិទ Monitor" : "Hide") : (isKh ? "មើល Monitor" : "View")}
              {showTokenPool ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Collapsible Bakong API Token Pool Monitor Card */}
      {showTokenPool && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {isKh ? "Bakong API Multi-Token Pool Monitor" : "Bakong API Multi-Token Pool"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isKh
                  ? "តាមដានស្ថានភាព Token នីមួយៗ និងធ្វើតេស្តការតភ្ជាប់ទៅកាន់ Bakong Open API"
                  : "Live token statuses, daily limits, and instant connection testing"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTokenModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {isKh ? "បន្ថែម Token ថ្មី" : "Add Token"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowTokenPool(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                {isKh ? "បិទ" : "Close"}
              </Button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {token_pool.tokens.map((tok) => {
              const isTesting = testingToken === tok.full_token;
              const hasTestResult = testResult && testResult.token === tok.full_token;

              return (
                <div
                  key={tok.index}
                  className={`rounded-lg border p-3.5 transition-all ${
                    tok.is_current
                      ? "border-blue-300 bg-blue-50/20 shadow-sm dark:border-blue-900 dark:bg-blue-950/20"
                      : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        #{tok.index}
                      </span>
                      <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        {tok.preview}
                      </span>
                      {tok.is_current && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          {isKh ? "កំពុងប្រើសកម្ម" : "In Active Use"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                          tok.status === "EXHAUSTED"
                            ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                        }`}
                      >
                        {tok.quota_display || `${tok.remaining_requests ?? 100}/100`}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tok.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            tok.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                          }`}
                        />
                        {tok.status_text}
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTestToken(tok.full_token)}
                        disabled={isTesting}
                        className="h-7 text-xs"
                      >
                        {isTesting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          isKh ? "តេស្ត Token" : "Test"
                        )}
                      </Button>
                    </div>
                  </div>

                  {hasTestResult && (
                    <div
                      className={`mt-2.5 rounded p-2 text-xs ${
                        testResult.result.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200"
                          : testResult.result.status === "EXHAUSTED"
                          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200"
                          : "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-300 border border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-medium">
                        {testResult.result.status === "ACTIVE" && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {testResult.result.status === "EXHAUSTED" && <AlertTriangle className="h-3.5 w-3.5" />}
                        {testResult.result.status !== "ACTIVE" && testResult.result.status !== "EXHAUSTED" && (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        <span>{testResult.result.message}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Payment History Data Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Table Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          {hasActiveFilters && (
            <div className="mb-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {isKh ? "កំណត់ Filter ឡើងវិញ" : "Clear Filters"}
              </Button>
            </div>
          )}

          {/* General Filter Toolbar */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filter 1: Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isKh ? "ស្វែងរក: ឈ្មោះ, @user, Telegram ID, MD5..." : "Search: Name, @username, ID, MD5..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter 2: Status Dropdown */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">{isKh ? "📌 គ្រប់ស្ថានភាព (All Statuses)" : "📌 All Statuses"}</option>
                <option value="COMPLETED">{isKh ? "✅ ជោគជ័យ (Completed / Success)" : "✅ Completed / Success"}</option>
                <option value="PENDING">{isKh ? "⏳ កំពុងរង់ចាំ (Pending)" : "⏳ Pending"}</option>
                <option value="FAILED">{isKh ? "❌ បរាជ័យ / បោះបង់ (Failed / Cancelled)" : "❌ Failed / Cancelled"}</option>
              </select>
            </div>

            {/* Filter 3: Payment Type Dropdown */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="ALL">{isKh ? "💳 គ្រប់ប្រភេទ (All Payment Types)" : "💳 All Types"}</option>
                <option value="KHQR">{isKh ? "🇰🇭 KHQR ទាំងអស់ (All KHQR)" : "🇰🇭 All KHQR"}</option>
                <option value="KHQR_ORDER">{isKh ? "📦 KHQR Direct Order (ទិញទំនិញ)" : "📦 KHQR Direct Order"}</option>
                <option value="KHQR_TOPUP">{isKh ? "💰 KHQR Top-up (បញ្ចូលលុយ)" : "💰 KHQR Top-up"}</option>
                <option value="BALANCE">{isKh ? "👛 កាបូបលុយ Balance Order" : "👛 Balance Order"}</option>
              </select>
            </div>

            {/* Filter 4: Date Range Dropdown */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="all">{isKh ? "📅 គ្រប់ពេលវេលា (All Time)" : "📅 All Time"}</option>
                <option value="today">{isKh ? "☀️ ថ្ងៃនេះ (Today)" : "☀️ Today"}</option>
                <option value="7days">{isKh ? "🗓️ ៧ ថ្ងៃចុងក្រោយ (Last 7 Days)" : "🗓️ Last 7 Days"}</option>
                <option value="month">{isKh ? "🗓️ ៣០ ថ្ងៃចុងក្រោយ (Last 30 Days)" : "🗓️ Last 30 Days"}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/75 dark:bg-slate-950/50">
                <TableHead className="font-semibold">{isKh ? "អតិថិជន (Customer)" : "Customer"}</TableHead>
                <TableHead className="font-semibold">{isKh ? "ចំនួនទឹកប្រាក់" : "Amount"}</TableHead>
                <TableHead className="font-semibold">{isKh ? "វិធីទូទាត់" : "Method"}</TableHead>
                <TableHead className="font-semibold">{isKh ? "ស្ថានភាព" : "Status"}</TableHead>
                <TableHead className="font-semibold">{isKh ? "កាលបរិច្ឆេទ" : "Date & Time"}</TableHead>
                <TableHead className="text-right font-semibold">{isKh ? "សកម្មភាព" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-xs">{isKh ? "កំពុងទាញយកទិន្នន័យ Data Table..." : "Loading records..."}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : historyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {isKh ? "មិនមានទិន្នន័យការទូទាត់ត្រូវនឹង Filter នេះឡើយ" : "No payment records match your filters"}
                      </p>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-1 text-xs">
                          {isKh ? "កំណត់ Filter ឡើងវិញ" : "Clear Filters"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                historyItems.map((item) => {
                  const isPending = item.status === "PENDING";
                  const isCompleted = item.status === "COMPLETED" || item.status === "SUCCESS";
                  const isFailed = item.status === "FAILED" || item.status === "CANCELLED";
                  const isVerifying = verifyingId === item.id;

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      {/* Customer */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-slate-900 dark:text-slate-100">
                              {item.customer.name}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              {item.customer.username && <span>@{item.customer.username}</span>}
                              {item.customer.telegram_id && (
                                <button
                                  onClick={() => copyToClipboard(String(item.customer.telegram_id), "Telegram ID")}
                                  className="hover:text-blue-600 flex items-center gap-0.5 ml-1"
                                  title="Copy Telegram ID"
                                >
                                  <span>ID: {item.customer.telegram_id}</span>
                                  <Copy className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Column 3: Amount */}
                      <TableCell className="align-middle">
                        <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                          ${item.amount.toFixed(2)}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">USD</span>
                      </TableCell>

                      {/* Column 4: Payment Method */}
                      <TableCell className="align-middle">
                        <Badge
                          variant={item.payment_method.includes("KHQR") ? "info" : "neutral"}
                          className="text-[11px]"
                        >
                          {item.payment_method.includes("KHQR") ? "🇰🇭 KHQR (ABA)" : item.payment_method}
                        </Badge>
                      </TableCell>

                      {/* Column 5: Status */}
                      <TableCell className="align-middle">
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="h-3 w-3" />
                            {isKh ? "ជោគជ័យ" : "Completed"}
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900 animate-pulse">
                            <AlertTriangle className="h-3 w-3" />
                            {isKh ? "រង់ចាំទូទាត់" : "Pending"}
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
                            <XCircle className="h-3 w-3" />
                            {item.status}
                          </span>
                        )}
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell className="align-middle text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </TableCell>

                      {/* Column 8: Actions */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyPayment(item)}
                              disabled={isVerifying}
                              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                            >
                              {isVerifying ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  {isKh ? "Verify" : "Verify"}
                                </span>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPayment(item)}
                            className="h-7 px-2 text-xs text-slate-600 hover:text-blue-600 dark:text-slate-300"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination & Footer */}
        {(() => {
          const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
          const endRecord = Math.min(currentPage * pageSize, totalRecords);

          return (
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
              {/* Left Column: Showing X to Y of Z payments */}
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center md:text-left">
                {isKh ? (
                  <>
                    បង្ហាញ <strong className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</strong> ដល់{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</strong> នៃ{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalRecords}</strong> កំណត់ត្រា
                  </>
                ) : (
                  <>
                    Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</strong> to{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</strong> of{" "}
                    <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalRecords}</strong> payments
                  </>
                )}
              </div>

              {/* Center Column: < Previous [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] Next > (Centered) */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                {/* Previous button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || historyLoading}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    currentPage <= 1 || historyLoading
                      ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>{isKh ? "Previous" : "Previous"}</span>
                </button>

                {/* Page number buttons */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 select-none">
                          ...
                        </span>
                      );
                    }

                    const pageNum = Number(p);
                    const isActive = pageNum === currentPage;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={historyLoading}
                        className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-2.5 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-red-600 text-white shadow-sm hover:bg-red-700"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next button */}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || historyLoading}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    currentPage >= totalPages || historyLoading
                      ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                  }`}
                >
                  <span>{isKh ? "Next" : "Next"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Right Column: Per Page Selector (Right Aligned) */}
              <div className="flex items-center justify-center md:justify-end gap-1.5 text-xs text-slate-500">
                <span>{isKh ? "ក្នុងមួយទំព័រ:" : "Rows per page:"}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Modal 1: Manage Bakong API Tokens */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" />
                {isKh ? "គ្រប់គ្រង Bakong API Tokens (Multi-Token Pool)" : "Manage Bakong API Tokens"}
              </h3>
              <button onClick={() => setIsTokenModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {isKh
                ? "បន្ថែម Bakong API Developer Tokens ច្រើនដើម្បីកើនចំនួន Requests ប្រចាំថ្ងៃ (Token ១ = ១០០ Requests/ថ្ងៃ)។ ប្រព័ន្ធនឹង Auto-Rotate ដោយស្វ័យប្រវត្ត។"
                : "Add multiple Bakong API tokens to multiply your daily request limit (each token grants +100 requests/day). Failover is 100% automatic."}
            </p>

            <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
              {tokenInputs.map((tok, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-400 w-6">#{idx + 1}</span>
                  <Input
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={tok}
                    onChange={(e) => {
                      const updated = [...tokenInputs];
                      updated[idx] = e.target.value;
                      setTokenInputs(updated);
                    }}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updated = tokenInputs.filter((_, i) => i !== idx);
                      setTokenInputs(updated);
                    }}
                    disabled={tokenInputs.length <= 1}
                    className="text-red-500 hover:text-red-700 h-9 px-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTokenInputs([...tokenInputs, ""])}
                className="gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {isKh ? "បន្ថែម Token មួយទៀត" : "Add Another Token"}
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsTokenModalOpen(false)}>
                  {isKh ? "បោះបង់" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTokens}
                  disabled={savingTokens}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <Save className="h-4 w-4" />
                  {savingTokens ? (isKh ? "កំពុងរក្សាទុក..." : "Saving...") : (isKh ? "រក្សាទុក Token Pool" : "Save Token Pool")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {isKh ? "ព័ត៌មានលម្អិតការទូទាត់" : "Payment Details"} #{selectedPayment.id}
                  </h3>
                  <p className="text-xs text-slate-500">{formatDate(selectedPayment.created_at)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Customer Box */}
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {isKh ? "ព័ត៌មាន Customer" : "Customer Details"}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">{isKh ? "ឈ្មោះ:" : "Name:"} </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPayment.customer.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Username: </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedPayment.customer.username ? `@${selectedPayment.customer.username}` : "-"}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-slate-400">Telegram ID: </span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {selectedPayment.customer.telegram_id || "-"}
                    </span>
                    {selectedPayment.customer.telegram_id && (
                      <button
                        onClick={() => copyToClipboard(String(selectedPayment.customer.telegram_id), "Telegram ID")}
                        className="text-blue-600 hover:text-blue-700 ml-1"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {isKh ? "ព័ត៌មានប្រតិបត្តិការ" : "Transaction Details"}
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isKh ? "ចំនួនទឹកប្រាក់:" : "Amount:"}</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      ${selectedPayment.amount.toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isKh ? "វិធីទូទាត់:" : "Payment Method:"}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{selectedPayment.payment_method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">{isKh ? "ស្ថានភាព:" : "Status:"}</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                        selectedPayment.status === "COMPLETED" || selectedPayment.status === "SUCCESS"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : selectedPayment.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                      }`}
                    >
                      {selectedPayment.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">{isKh ? "ការពិពណ៌នា:" : "Description:"}</span>
                    <p className="mt-1 font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800">
                      {selectedPayment.description}
                    </p>
                  </div>
                  {selectedPayment.khqr_md5 && (
                    <div>
                      <span className="text-slate-400">Bakong KHQR MD5:</span>
                      <div className="mt-1 flex items-center justify-between rounded bg-white dark:bg-slate-900 p-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <span className="break-all">{selectedPayment.khqr_md5}</span>
                        <button
                          onClick={() => copyToClipboard(selectedPayment.khqr_md5!, "MD5")}
                          className="ml-2 text-blue-600 hover:text-blue-700 flex-shrink-0"
                          title="Copy MD5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t pt-4">
              {selectedPayment.status === "PENDING" && (
                <Button
                  size="sm"
                  onClick={() => handleVerifyPayment(selectedPayment)}
                  disabled={verifyingId === selectedPayment.id}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-1 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifyingId === selectedPayment.id ? "animate-spin" : ""}`} />
                  {isKh ? "ផ្ទៀងផ្ទាត់ជាមួយ Bakong ឥឡូវ" : "Verify with Bakong Now"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelectedPayment(null)} className="text-xs">
                {isKh ? "បិទ" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
