// src/components/billing/RazorpayPayment.tsx
"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Shield,
  CheckCircle,
  Loader2,
  Zap,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/receipt-pdf";

// ─── Types ────────────────────────────────────────────────────
interface Bill {
  id: string;
  bill_number: string;
  billing_month: number;
  billing_year: number;
  amount: string;
  late_fee: string;
  total_amount: string;
  due_date: string;
  flat: { flat_number: string; wing: string | null } | null;
}

interface RazorpayPaymentProps {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Extend Window for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

// ─── Constants ────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAYMENT_FEATURES = [
  {
    icon: CreditCard,
    label: "Credit/Debit Cards",
    desc: "Visa, Mastercard, RuPay",
  },
  {
    icon: Smartphone,
    label: "UPI",
    desc: "GPay, PhonePe, Paytm",
  },
  {
    icon: Building,
    label: "Net Banking",
    desc: "All major banks",
  },
  {
    icon: Wallet,
    label: "Wallets",
    desc: "Paytm, Amazon Pay",
  },
];

// ─── Load Razorpay Script ─────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    // Already loaded
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────
export function RazorpayPayment({
  bill,
  open,
  onClose,
  onSuccess,
}: RazorpayPaymentProps) {
  // ── State ──────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    transactionId: string;
    amount: number;
  } | null>(null);

  // ── Derived values ─────────────────────────────────────────
  if (!bill) return null;

  const amount = Number(bill.total_amount);
  const flatLabel = bill.flat?.wing
    ? `${bill.flat.wing}-${bill.flat.flat_number}`
    : bill.flat?.flat_number || "N/A";
  const periodLabel = `${MONTHS[bill.billing_month - 1]} ${bill.billing_year}`;

  // ── Handle Pay Now ─────────────────────────────────────────
  const handlePayNow = useCallback(async () => {
    if (!bill) return;

    setIsProcessing(true);

    try {
      // 1. Load Razorpay checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error(
          "Payment gateway failed to load. Please refresh and try again.",
        );
        setIsProcessing(false);
        return;
      }

      // 2. Create Razorpay order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: bill.id }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        toast.error(orderData.message || "Failed to create payment order");
        setIsProcessing(false);
        return;
      }

      const {
        orderId,
        amount: orderAmount,
        currency,
        keyId,
        prefill,
        billNumber,
      } = orderData.data;

      // 3. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: "SocietyOS",
        description: `Maintenance Bill — ${billNumber}`,
        order_id: orderId,

        // Prefill user details
        prefill: {
          name: prefill.name,
          email: prefill.email,
          contact: prefill.contact,
        },

        // UI customization
        theme: {
          color: "#0071e3",
          backdrop_color: "rgba(0,0,0,0.7)",
        },

        // Notes for reference
        notes: {
          bill_number: billNumber,
          flat: flatLabel,
        },

        // ── Payment Success Handler ──────────────────────────
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Verify payment signature on server
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bill_id: bill.id,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              // Payment verified successfully
              setPaymentData({
                transactionId: response.razorpay_payment_id,
                amount: Number(bill.total_amount),
              });
              setPaymentSuccess(true);
              toast.success("Payment successful! 🎉");

              // Immediately refresh parent bills list
              onSuccess();
            } else {
              toast.error(
                verifyData.message ||
                  "Payment verification failed. Contact support.",
              );
            }
          } catch (error) {
            console.error("Verify error:", error);
            toast.error("Payment verification error. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },

        // ── Modal Dismiss Handler ────────────────────────────
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast("Payment cancelled", { icon: "⚠️" });
          },
          escape: true,
          backdropclose: false,
          animation: true,
        },

        // ── Retry Config ─────────────────────────────────────
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      // 5. Open Razorpay checkout
      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (failedResponse: any) => {
        console.error("Payment failed:", failedResponse.error);
        toast.error(
          `Payment failed: ${failedResponse.error.description || "Unknown error"}`,
        );
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment flow error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  }, [bill, flatLabel, onSuccess]);

  // ── Download Receipt ───────────────────────────────────────
  const handleDownloadReceipt = async () => {
    if (!bill || !paymentData) return;

    try {
      await generateReceiptPDF({
        receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
        billNumber: bill.bill_number,
        residentName: "Resident",
        flatNumber: flatLabel,
        societyName: "Sunshine Apartments CHS",
        billingMonth: MONTHS[bill.billing_month - 1],
        billingYear: bill.billing_year,
        amount: Number(bill.amount),
        lateFee: Number(bill.late_fee),
        totalAmount: paymentData.amount,
        paymentMethod: "Online (Razorpay)",
        paymentDate: new Date().toISOString(),
        transactionId: paymentData.transactionId,
        status: "PAID",
      });
      toast.success("Receipt downloaded! 📄");
    } catch (error) {
      console.error("Receipt error:", error);
      toast.error("Failed to generate receipt");
    }
  };

  // ── Handle Close ───────────────────────────────────────────
  const handleClose = () => {
    const wasSuccess = paymentSuccess;

    // Reset state
    setPaymentSuccess(false);
    setPaymentData(null);
    setIsProcessing(false);

    // Close modal
    onClose();

    // Refresh bills if payment was successful
    if (wasSuccess) {
      setTimeout(() => onSuccess(), 300);
    }
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>
            {paymentSuccess
              ? "✅ Payment Successful!"
              : "💳 Pay Maintenance Bill"}
          </DialogTitle>
          <DialogDescription>
            {bill.bill_number} • {periodLabel} • Flat {flatLabel}
          </DialogDescription>
        </DialogHeader>

        {/* ── PRE-PAYMENT VIEW ─────────────────────────────── */}
        {!paymentSuccess && (
          <div className="space-y-5">
            {/* Amount Display */}
            <div className="rounded-2xl bg-zinc-950 p-6 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Total Amount
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {formatINR(amount)}
              </p>

              {/* Amount breakdown if late fee */}
              {Number(bill.late_fee) > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-center gap-6 text-xs">
                  <span className="text-zinc-400">
                    Base: {formatINR(Number(bill.amount))}
                  </span>
                  <span className="text-red-400">
                    Late Fee: {formatINR(Number(bill.late_fee))}
                  </span>
                </div>
              )}

              {/* Due date */}
              <p className="text-xs text-zinc-500 mt-3">
                Due by{" "}
                {new Date(bill.due_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Accepted Methods Grid */}
            <div>
              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-3">
                Accepted Payment Methods
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {PAYMENT_FEATURES.map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {feature.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 py-1">
              <Shield className="h-4 w-4 text-green-500" />
              <p className="text-xs text-zinc-500 font-medium">
                Secured by Razorpay • 256-bit SSL
              </p>
            </div>

            {/* Test Mode Notice */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Test Mode Active
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 leading-relaxed">
                    Use test card:{" "}
                    <span className="font-mono font-bold">
                      4111 1111 1111 1111
                    </span>
                    <br />
                    Expiry: Any future date • CVV: Any 3 digits
                    <br />
                    UPI: Enter any UPI ID → auto-succeeds
                  </p>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handlePayNow}
              disabled={isProcessing}
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Pay {formatINR(amount)} Now
                </div>
              )}
            </Button>

            {/* Terms */}
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              By paying, you agree to the payment terms. Refunds processed
              within 5-7 business days if applicable.
            </p>
          </div>
        )}

        {/* ── POST-PAYMENT SUCCESS VIEW ────────────────────── */}
        {paymentSuccess && paymentData && (
          <div className="space-y-5 text-center py-2">
            {/* Success Animation */}
            <div className="relative mx-auto w-20 h-20">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
            </div>

            {/* Title */}
            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Payment Successful!
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Your bill has been paid instantly
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-5 text-left space-y-3">
              {[
                ["Amount Paid", formatINR(paymentData.amount)],
                ["Bill Number", bill.bill_number],
                ["Period", periodLabel],
                ["Flat", flatLabel],
                ["Transaction ID", paymentData.transactionId],
                ["Payment Method", "Online (Razorpay)"],
                ["Status", "✅ Confirmed"],
                [
                  "Date",
                  new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <span
                    className={cn(
                      "text-xs font-semibold text-right max-w-[180px] truncate",
                      label === "Status"
                        ? "text-green-600"
                        : "text-zinc-900 dark:text-white",
                    )}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* What happens next */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 text-left">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">
                What happens now?
              </p>
              <div className="space-y-1.5">
                {[
                  "Bill marked as PAID automatically",
                  "PDF receipt available for download",
                  "Receipt sent to your email",
                  "Transaction logged in audit trail",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadReceipt}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF Receipt
              </Button>

              <Button className="w-full" size="lg" onClick={handleClose}>
                Done ✓
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
