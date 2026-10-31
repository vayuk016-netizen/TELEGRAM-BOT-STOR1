"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  QrCode,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Upload,
  ArrowLeft,
  Clock,
  Sparkles,
  Zap,
  ShieldCheck,
  Send,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
import { storeService, StoreProduct, OrderDetail } from "@/services/store.service";
import { useCustomerStore } from "@/store/use-customer-store";
import { useLanguageStore } from "@/store/use-language-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const StoreCheckoutPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const { customer, token } = useCustomerStore();

  const qtyParam = Number(searchParams.get("qty")) || 1;
  const [quantity, setQuantity] = useState(qtyParam);
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState<"khqr" | "manual" | "balance">("khqr");
  const [telegramIdInput, setTelegramIdInput] = useState<string>(
    customer?.telegram_id ? String(customer.telegram_id) : ""
  );
  const [customerNameInput, setCustomerNameInput] = useState<string>(
    customer?.first_name || ""
  );

  // Order state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  // Polling state
  const [isPolling, setIsPolling] = useState(false);

  // 1. Load product
  useEffect(() => {
    if (!id) return;
    const fetchProd = async () => {
      try {
        setLoadingProduct(true);
        const data = await storeService.getProduct(Number(id));
        setProduct(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProduct(false);
      }
    };
    fetchProd();
  }, [id]);

  // Sync customer if logged in
  useEffect(() => {
    if (customer?.telegram_id) {
      setTelegramIdInput(String(customer.telegram_id));
      setCustomerNameInput(customer.first_name);
    }
  }, [customer]);

  // 2. Automated status polling when order is active and PENDING
  useEffect(() => {
    if (!activeOrder?.order_id || orderDetail?.status === "COMPLETED") return;

    let intervalId: any = null;

    const pollStatus = async () => {
      try {
        const detail = await storeService.getOrderStatus(activeOrder.order_id, true);
        setOrderDetail(detail);
        if (detail.status === "COMPLETED" || detail.status === "PAID") {
          setIsPolling(false);
        }
      } catch (err) {
        // silent
      }
    };

    setIsPolling(true);
    intervalId = setInterval(pollStatus, 3500);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeOrder, orderDetail?.status]);

  // 3. Create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const telegramId = telegramIdInput ? parseInt(telegramIdInput.replace(/\D/g, ""), 10) : undefined;
      const res = await storeService.createOrder({
        product_id: product.id,
        quantity,
        payment_method: paymentMethod,
        telegram_id: telegramId,
        customer_name: customerNameInput || undefined,
      });

      setActiveOrder(res);

      if (res.status === "COMPLETED") {
        setOrderDetail({
          order_id: res.order_id,
          status: "COMPLETED",
          total_amount: res.total_amount,
          source: "website",
          created_at: new Date().toISOString(),
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            image_url: product.image_url,
          },
          delivered_payload: res.delivered_payload,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Verify payment manually
  const handleVerifyPayment = async () => {
    if (!activeOrder?.order_id) return;
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const res = await storeService.verifyKhqrPayment(activeOrder.order_id);
      if (res.status === "COMPLETED") {
        setOrderDetail((prev) => (prev ? { ...prev, status: "COMPLETED", delivered_payload: res.delivered_payload } : null));
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Could not confirm payment yet. Please ensure you completed your scan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Upload Receipt
  const handleUploadReceipt = async () => {
    if (!activeOrder?.order_id || !receiptFile) return;
    setUploadingReceipt(true);
    setErrorMsg("");
    try {
      await storeService.uploadReceipt(activeOrder.order_id, receiptFile);
      setReceiptUploaded(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to upload receipt file.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  if (loadingProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-pulse space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded-lg mx-auto" />
        <div className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Product Not Found</h2>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </div>
    );
  }

  const totalPrice = product.price * quantity;
  const isDelivered = orderDetail?.status === "COMPLETED" || orderDetail?.status === "PAID";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-slate-100">
      
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/products/${product.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Product</span>
        </Link>
        <div className="text-xs font-mono font-bold text-slate-400">
          SECURE CHECKOUT
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUCCESS: Delivered Subscription Keys Screen             */}
      {/* ======================================================== */}
      {isDelivered && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-6 sm:p-10 space-y-6 text-center animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
              {t("status_completed")}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your order <span className="font-mono font-bold text-blue-500">#{orderDetail?.order_id}</span> has been confirmed. Your digital credentials are ready below:
            </p>
          </div>

          {/* Delivered Keys Box */}
          <div className="text-left space-y-2 max-w-xl mx-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-100">
                {t("delivered_keys")}
              </span>
              <button
                onClick={() => handleCopy(orderDetail?.delivered_payload || "")}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copyStatus ? t("key_copied") : t("copy_key")}</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-sm border border-slate-800 shadow-inner select-all whitespace-pre-wrap break-all leading-relaxed">
              {orderDetail?.delivered_payload || "Digital key delivered. Please check your Telegram."}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/products">
              <Button className="text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PAYMENT IN PROGRESS: KHQR or Manual ABA Slip Screen      */}
      {/* ======================================================== */}
      {!isDelivered && activeOrder && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-8">
          
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>{t("status_pending")}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Order #{activeOrder.order_id} Created
            </h2>
            <p className="text-xs text-slate-400">
              Total Due: <span className="font-bold text-blue-500 font-mono text-base">${activeOrder.total_amount?.toFixed(2)}</span>
            </p>
          </div>

          {/* Option A: Bakong KHQR QR Code Screen */}
          {activeOrder.payment_method === "khqr" && (
            <div className="max-w-md mx-auto space-y-5 text-center">
              <div className="p-4 sm:p-6 rounded-3xl bg-white text-slate-900 shadow-2xl border border-slate-200 inline-block mx-auto">
                {activeOrder.khqr_qr_data_url || activeOrder.khqr_qr_url ? (
                  <img
                    src={activeOrder.khqr_qr_data_url || activeOrder.khqr_qr_url}
                    alt="Bakong KHQR"
                    className="w-64 h-64 mx-auto rounded-xl object-contain shadow-sm"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded-xl">
                    <QrCode className="h-16 w-16 text-slate-400" />
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 px-2">
                  <span>Bakong KHQR</span>
                  <span className="text-blue-600 font-mono">${activeOrder.total_amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Quick Action Buttons: Download & Copy & DeepLink */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(activeOrder.khqr_qr_data_url || activeOrder.khqr_qr_url) && (
                  <a
                    href={activeOrder.khqr_qr_data_url || activeOrder.khqr_qr_url}
                    download={`KHQR_Order_${activeOrder.order_id}.png`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download QR</span>
                  </a>
                )}
                {activeOrder.khqr_string && (
                  <button
                    onClick={() => handleCopy(activeOrder.khqr_string)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copyStatus ? "Copied!" : "Copy KHQR"}</span>
                  </button>
                )}
                {activeOrder.deep_link && (
                  <a
                    href={activeOrder.deep_link}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-semibold transition-colors border border-blue-500/30"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open in Bakong</span>
                  </a>
                )}
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {t("scan_qr_desc")}
              </p>

              {/* Status Indicator */}
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("auto_verifying")}</span>
              </div>

              <Button
                onClick={handleVerifyPayment}
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 gap-2"
              >
                <span>{t("verify_now")}</span>
              </Button>
            </div>
          )}

          {/* Option B: Manual ABA / Wing Transfer Details */}
          {activeOrder.payment_method === "manual" && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  ABA Bank Direct Transfer
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Name:</span>
                    <span className="font-bold text-slate-100">{activeOrder.aba?.account_name || "HAK HAK"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Account No:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-blue-500">{activeOrder.aba?.account_number || "000 111 222"}</span>
                      <button
                        onClick={() => handleCopy(activeOrder.aba?.account_number || "000 111 222")}
                        className="text-slate-400 hover:text-slate-100"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Receipt Slip */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  {t("upload_receipt")}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="h-11 bg-slate-950 border-slate-800 text-xs rounded-xl"
                  />
                  <Button
                    onClick={handleUploadReceipt}
                    disabled={!receiptFile || uploadingReceipt}
                    className="h-11 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex-shrink-0"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    <span>{uploadingReceipt ? "Uploading..." : "Upload"}</span>
                  </Button>
                </div>
                {receiptUploaded && (
                  <p className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Receipt submitted. Our admin is verifying your order!</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* FORM: Step 1 Checkout Options (Shown before order created) */}
      {/* ======================================================== */}
      {!activeOrder && (
        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Customer details & Payment Selector */}
          <div className="md:col-span-7 space-y-6">
            
            {/* Telegram User Integration */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-500" />
                  <span>Telegram Delivery Details</span>
                </h3>
                {customer ? (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ✓ Connected
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Instant Telegram Key Sync
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Telegram User ID / Username (Optional)
                  </label>
                  <Input
                    type="text"
                    value={telegramIdInput}
                    onChange={(e) => setTelegramIdInput(e.target.value)}
                    placeholder="e.g. 123456789 or @username"
                    className="h-10 bg-slate-950 border-slate-800 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Enter your Telegram ID so our bot sends your purchased keys directly to your Telegram chat.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100">
                {t("select_payment")}
              </h3>

              <div className="space-y-2.5">
                {/* Method 1: Bakong KHQR */}
                <label
                  onClick={() => setPaymentMethod("khqr")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "khqr"
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs border border-red-500/20">
                      KHQR
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100">
                        {t("pay_khqr")}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Scan from ABA, ACLEDA, Wing, Sathapana, etc.
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "khqr"}
                    onChange={() => setPaymentMethod("khqr")}
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                {/* Method 2: Manual ABA / Wing */}
                <label
                  onClick={() => setPaymentMethod("manual")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "manual"
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs border border-blue-500/20">
                      ABA
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-100">
                        {t("pay_manual")}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Transfer to ABA account & upload payment slip
                      </span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "manual"}
                    onChange={() => setPaymentMethod("manual")}
                    className="h-4 w-4 text-blue-600"
                  />
                </label>

                {/* Method 3: Account Balance (If logged in) */}
                {customer && (
                  <label
                    onClick={() => setPaymentMethod("balance")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === "balance"
                        ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-100">
                          {t("pay_balance")}
                        </div>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          Available: ${customer.balance?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "balance"}
                      onChange={() => setPaymentMethod("balance")}
                      className="h-4 w-4 text-blue-600"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="md:col-span-5 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
                {t("order_summary")}
              </h3>

              {/* Product Info */}
              <div className="flex items-center gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">
                    {product.category?.icon || "📦"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-100 truncate">
                    {product.title}
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Unit: ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-400">{t("quantity")}:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-7 w-7 rounded-lg border border-slate-800 text-slate-100 hover:bg-slate-800 font-bold"
                  >
                    -
                  </button>
                  <span className="font-bold font-mono px-1 text-slate-100">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock_count, quantity + 1))}
                    className="h-7 w-7 rounded-lg border border-slate-800 text-slate-100 hover:bg-slate-800 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Subtotal and Total */}
              <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-100">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-500 font-bold">FREE ($0.00)</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
                  <span className="font-bold text-slate-100">Total</span>
                  <span className="text-xl font-black text-blue-500 font-mono">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isSubmitting || product.stock_count < quantity}
                className="w-full h-12 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing Order...</span>
                  </span>
                ) : (
                  <span>Confirm & Proceed to Payment (${totalPrice.toFixed(2)})</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

