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
  { icon: Smartphone, label: "UPI", desc: "GPay, PhonePe, Paytm" },
  { icon: Building, label: "Net Banking", desc: "All major banks" },
  { icon: Wallet, label: "Wallets", desc: "Paytm, Amazon Pay" },
];

// ─── Load Razorpay Script ─────────────────────────────────────
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    transactionId: string;
    amount: number;
  } | null>(null);

  const handlePayNow = useCallback(async () => {
    if (!bill) return;

    setIsProcessing(true);

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Payment gateway failed to load");
        setIsProcessing(false);
        return;
      }

      // 2. Create order from backend
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bill_id: bill.id }),
      });

      const orderData = await orderRes.json();

      if (!orderData.success) {
        toast.error(orderData.message || "Failed to create order");
        setIsProcessing(false);
        return;
      }

      const { orderId, amount, currency, keyId, prefill, billNumber } =
        orderData.data;

      // 3. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: "SocietyOS",
        description: `Maintenance Bill — ${billNumber}`,
        order_id: orderId,
        image: "/favicon.ico",

        // Prefill user info
        prefill: {
          name: prefill.name,
          email: prefill.email,
          contact: prefill.contact,
        },

        // Theme
        theme: {
          color: "#0071e3",
          backdrop_color: "rgba(0,0,0,0.7)",
        },

        // Notes
        notes: {
          bill_number: billNumber,
        },

        // Handle successful payment
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Verify payment on backend
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
              setPaymentData({
                transactionId: response.razorpay_payment_id,
                amount: Number(bill.total_amount),
              });
              setPaymentSuccess(true);
              toast.success("Payment successful! 🎉");
            } else {
              toast.error(verifyData.message || "Payment verification failed");
            }
          } catch {
            toast.error("Payment verification error. Contact support.");
          } finally {
            setIsProcessing(false);
          }
        },

        // Handle modal close without payment
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast("Payment cancelled", {
              icon: "⚠️",
            });
          },
          escape: true,
          backdropclose: false,
        },

        // Retry
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  }, [bill]);

  const handleDownloadReceipt = async () => {
    if (!bill || !paymentData) return;

    try {
      await generateReceiptPDF({
        receiptNumber: `RCP-${Date.now().toString().slice(-8)}`,
        billNumber: bill.bill_number,
        residentName: "Resident",
        flatNumber: bill.flat?.wing
          ? `${bill.flat.wing}-${bill.flat.flat_number}`
          : bill.flat?.flat_number || "N/A",
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
    } catch {
      toast.error("Failed to generate receipt");
    }
  };

  const handleClose = () => {
    if (paymentSuccess) onSuccess();
    setPaymentSuccess(false);
    setPaymentData(null);
    setIsProcessing(false);
    onClose();
  };

  if (!bill) return null;

  const amount = Number(bill.total_amount);
  const flatLabel = bill.flat?.wing
    ? `${bill.flat.wing}-${bill.flat.flat_number}`
    : bill.flat?.flat_number || "N/A";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {paymentSuccess
              ? "✅ Payment Successful!"
              : "💳 Pay Maintenance Bill"}
          </DialogTitle>
          <DialogDescription>
            {bill.bill_number} • {MONTHS[bill.billing_month - 1]}{" "}
            {bill.billing_year} • Flat {flatLabel}
          </DialogDescription>
        </DialogHeader>

        {!paymentSuccess ? (
          <div className="space-y-5">
            {/* Amount */}
            <div className="rounded-2xl bg-zinc-950 p-6 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Total Amount
              </p>
              <p className="text-4xl font-black text-white tracking-tight">
                {formatINR(amount)}
              </p>

              {/* Breakdown */}
              {Number(bill.late_fee) > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-center gap-4 text-xs">
                  <span className="text-zinc-400">
                    Base: {formatINR(Number(bill.amount))}
                  </span>
                  <span className="text-red-400">
                    Late Fee: {formatINR(Number(bill.late_fee))}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {feature.label}
                    </p>
                    <p className="text-[10px] text-zinc-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 py-2">
              <Shield className="h-4 w-4 text-green-500" />
              <p className="text-xs text-zinc-500 font-medium">
                Secured by Razorpay • 256-bit SSL Encrypted
              </p>
            </div>

            {/* Test Mode Banner */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Test Mode Active
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                    Use test card:{" "}
                    <span className="font-mono font-bold">
                      4111 1111 1111 1111
                    </span>
                    <br />
                    Expiry: Any future date • CVV: Any 3 digits
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

            <p className="text-[10px] text-zinc-400 text-center">
              By paying, you agree to the payment terms. Refunds processed
              within 5-7 business days.
            </p>
          </div>
        ) : (
          /* ── SUCCESS SCREEN ─────────────────────────────── */
          <div className="space-y-5 text-center py-2">
            {/* Animated check */}
            <div className="relative mx-auto w-20 h-20">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Payment Successful!
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Your bill has been paid
              </p>
            </div>

            {/* Receipt Summary */}
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border p-4 text-left space-y-2.5">
              {[
                ["Amount Paid", formatINR(paymentData?.amount || 0)],
                ["Bill Number", bill.bill_number],
                ["Transaction ID", paymentData?.transactionId || "—"],
                ["Payment Method", "Online (Razorpay)"],
                ["Status", "✅ Confirmed"],
                [
                  "Date",
                  new Date().toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white text-right max-w-[180px] truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadReceipt}
              >
                📄 Download PDF Receipt
              </Button>

              <Button className="w-full" onClick={handleClose} size="lg">
                Done ✓
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
