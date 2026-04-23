// src/components/billing/PaymentModal.tsx
"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Smartphone,
  Building,
  Banknote,
  CheckCircle,
  Copy,
  ArrowLeft,
  Info,
  QrCode,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
interface Bill {
  id: string;
  bill_number: string;
  billing_month: number;
  billing_year: number;
  total_amount: string;
  due_date: string;
  flat: { flat_number: string; wing: string | null } | null;
}

interface PaymentModalProps {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

const UPI_ID = "society@upi";
const UPI_NAME = "Sunshine Apartments CHS";

const BANK_DETAILS = {
  "Bank Name": "State Bank of India",
  "Account Number": "1234 5678 9012",
  "IFSC Code": "SBIN0001234",
  "Account Name": "Sunshine Apartments CHS",
  "Account Type": "Current Account",
};

const PAYMENT_METHODS = [
  {
    id: "UPI",
    label: "UPI",
    icon: Smartphone,
    color: "bg-purple-500",
    description: "GPay, PhonePe, Paytm",
  },
  {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building,
    color: "bg-blue-500",
    description: "NEFT / IMPS / RTGS",
  },
  {
    id: "CASH",
    label: "Cash",
    icon: Banknote,
    color: "bg-green-500",
    description: "Pay at office",
  },
  {
    id: "CHEQUE",
    label: "Cheque",
    icon: CreditCard,
    color: "bg-orange-500",
    description: "Submit cheque",
  },
];

// ─── Detect Mobile ─────────────────────────────────────────────
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android|iphone|ipad|ipod|windows phone/i.test(navigator.userAgent);
}

// ─── Component ────────────────────────────────────────────────
export function PaymentModal({
  bill,
  open,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<"method" | "details" | "confirm">("method");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState("");
  const [upiApps, setUpiApps] = useState<
    { name: string; package: string; icon: string }[]
  >([]);

  const [form, setForm] = useState({
    transaction_id: "",
    upi_ref_number: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Detect device on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());

    // Popular UPI apps
    setUpiApps([
      {
        name: "Google Pay",
        package: "com.google.android.apps.nbu.paisa.user",
        icon: "🟢",
      },
      {
        name: "PhonePe",
        package: "com.phonepe.app",
        icon: "🟣",
      },
      {
        name: "Paytm",
        package: "net.one97.paytm",
        icon: "🔵",
      },
      {
        name: "BHIM",
        package: "in.org.npci.upiapp",
        icon: "🟠",
      },
    ]);
  }, []);

  if (!bill) return null;

  const amount = Number(bill.total_amount);
  const flatLabel = bill.flat?.wing
    ? `${bill.flat.wing}-${bill.flat.flat_number}`
    : bill.flat?.flat_number || "N/A";

  // Build UPI payment string
  const upiString = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&tn=${encodeURIComponent(bill.bill_number)}&cu=INR`;

  // ── Handlers ────────────────────────────────────────────────
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleUPIApp = (appName: string) => {
    if (isMobile) {
      // Try to open UPI deep link on mobile
      window.location.href = upiString;
      toast.success(`Opening ${appName}...`);
    } else {
      // On desktop — copy UPI ID instead
      handleCopy(UPI_ID, "UPI ID");
      toast(`Please open ${appName} on your phone and pay to: ${UPI_ID}`, {
        icon: "📱",
        duration: 5000,
      });
    }
  };

  const handleSubmitPayment = async () => {
    if (!bill) return;

    // Validate reference for non-cash payments
    if (
      selectedMethod !== "CASH" &&
      !form.transaction_id &&
      !form.upi_ref_number
    ) {
      toast.error("Please enter transaction ID or UPI reference number");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bill_id: bill.id,
          amount,
          payment_method: selectedMethod,
          payment_date: form.payment_date,
          transaction_id: form.transaction_id || undefined,
          upi_ref_number: form.upi_ref_number || undefined,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStep("confirm");
        toast.success("Payment submitted! ✅");
      } else {
        toast.error(data.message || "Failed to submit payment");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    const wasConfirmed = step === "confirm";
    setStep("method");
    setSelectedMethod("");
    setForm({
      transaction_id: "",
      upi_ref_number: "",
      payment_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    onClose();
    if (wasConfirmed) onSuccess();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === "method" && "💳 Pay Maintenance Bill"}
            {step === "details" && "📋 Enter Payment Details"}
            {step === "confirm" && "✅ Payment Submitted!"}
          </DialogTitle>
          <DialogDescription>
            {bill.bill_number} • {MONTHS[bill.billing_month - 1]}{" "}
            {bill.billing_year} • Flat {flatLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Amount Card */}
        <div className="rounded-2xl bg-zinc-950 p-5 text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Amount Due
          </p>
          <p className="text-4xl font-black text-white tracking-tight">
            {formatINR(amount)}
          </p>
          <p className="text-xs text-zinc-500 mt-2">
            Due by{" "}
            {new Date(bill.due_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        {/* ── STEP 1: SELECT METHOD ─────────────────────────── */}
        {step === "method" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              How would you like to pay?
            </p>

            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "rounded-2xl border-2 p-4 text-left transition-all duration-150",
                    selectedMethod === method.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center mb-3",
                      method.color,
                    )}
                  >
                    <method.icon className="h-[18px] w-[18px] text-white" />
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {method.label}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {method.description}
                  </p>
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedMethod}
              onClick={() => setStep("details")}
            >
              Continue →
            </Button>
          </div>
        )}

        {/* ── STEP 2: PAYMENT DETAILS ───────────────────────── */}
        {step === "details" && (
          <div className="space-y-4">
            {/* UPI Section */}
            {selectedMethod === "UPI" && (
              <div className="space-y-3">
                {/* Device-aware UPI info */}
                {isMobile ? (
                  // MOBILE — Show UPI app buttons
                  <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 p-4 space-y-3">
                    <p className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                      📱 Pay using UPI App
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Tap to open your preferred UPI app
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {upiApps.map((app) => (
                        <button
                          key={app.name}
                          onClick={() => handleUPIApp(app.name)}
                          className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <span className="text-xl">{app.icon}</span>
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {app.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // DESKTOP — Show UPI ID + instructions
                  <div className="rounded-2xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-purple-700 dark:text-purple-400">
                        UPI apps only work on mobile. Open your UPI app on your
                        phone and pay to the UPI ID below.
                      </p>
                    </div>

                    {/* UPI ID copy box */}
                    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 p-3">
                      <p className="text-xs text-zinc-400 mb-1">
                        UPI ID — Copy and pay on your phone
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-black font-mono text-purple-700 dark:text-purple-400">
                          {UPI_ID}
                        </p>
                        <button
                          onClick={() => handleCopy(UPI_ID, "UPI ID")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            copied === "UPI ID"
                              ? "bg-green-500 text-white"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200",
                          )}
                        >
                          {copied === "UPI ID" ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Amount copy */}
                    <div className="rounded-xl bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800 p-3">
                      <p className="text-xs text-zinc-400 mb-1">
                        Amount to pay
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-base font-black text-zinc-900 dark:text-white">
                          {formatINR(amount)}
                        </p>
                        <button
                          onClick={() => handleCopy(String(amount), "Amount")}
                          className={cn(
                            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            copied === "Amount"
                              ? "bg-green-500 text-white"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200",
                          )}
                        >
                          {copied === "Amount" ? (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-1.5">
                      {[
                        "Open Google Pay / PhonePe / Paytm on your phone",
                        `Pay to UPI ID: ${UPI_ID}`,
                        `Enter amount: ${formatINR(amount)}`,
                        "Copy the UPI reference number",
                        "Enter it below and submit",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="h-4 w-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-purple-700 dark:text-purple-400">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* UPI Reference Input */}
                <div className="space-y-2">
                  <Label>UPI Reference / Transaction ID *</Label>
                  <Input
                    placeholder="e.g. 123456789012"
                    value={form.upi_ref_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        upi_ref_number: e.target.value,
                      })
                    }
                    className="font-mono"
                  />
                  <p className="text-xs text-zinc-400">
                    Find in your UPI app → Transaction History → copy the
                    12-digit reference
                  </p>
                </div>
              </div>
            )}

            {/* Bank Transfer Section */}
            {selectedMethod === "BANK_TRANSFER" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">
                    🏦 Bank Transfer Details
                  </p>
                  {Object.entries(BANK_DETAILS).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-xl p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-400">{key}</p>
                        <p className="text-sm font-bold font-mono truncate">
                          {value}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(value, key)}
                        className={cn(
                          "ml-2 flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                          copied === key
                            ? "bg-green-500 text-white"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200",
                        )}
                      >
                        {copied === key ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Transaction Reference ID *</Label>
                  <Input
                    placeholder="e.g. SBIN00012345678"
                    value={form.transaction_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        transaction_id: e.target.value,
                      })
                    }
                    className="font-mono"
                  />
                  <p className="text-xs text-zinc-400">
                    Find in your bank app or SMS after transfer
                  </p>
                </div>
              </div>
            )}

            {/* Cash Section */}
            {selectedMethod === "CASH" && (
              <div className="rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4 space-y-3">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  💵 Cash Payment Instructions
                </p>
                <div className="space-y-2">
                  {[
                    "Visit the society office during working hours",
                    `Pay Rs. ${amount.toLocaleString("en-IN")} in cash`,
                    "Collect physical receipt from treasurer",
                    "Submit online confirmation below",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full bg-green-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-green-700 dark:text-green-400">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-3">
                  <p className="text-xs text-zinc-400">Office Hours</p>
                  <p className="text-sm font-semibold">
                    Mon – Sat: 10:00 AM – 6:00 PM
                  </p>
                </div>
              </div>
            )}

            {/* Cheque Section */}
            {selectedMethod === "CHEQUE" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 p-4 space-y-2">
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                    📝 Cheque Details
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    Make cheque payable to:
                  </p>
                  <div className="bg-white dark:bg-zinc-900 rounded-xl p-3">
                    <p className="text-sm font-bold">{UPI_NAME}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Submit cheque at society office
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cheque Number *</Label>
                  <Input
                    placeholder="e.g. 123456"
                    value={form.transaction_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        transaction_id: e.target.value,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            )}

            {/* Payment Date — always shown */}
            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={form.payment_date}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_date: e.target.value,
                  })
                }
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional information..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            {/* Pending confirmation notice */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                ⏳ After submitting, your payment will be verified by the
                treasurer within 24 hours. You'll receive a PDF receipt once
                confirmed.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("method")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitPayment}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRMATION ──────────────────────────── */}
        {step === "confirm" && (
          <div className="space-y-5 text-center py-2">
            {/* Success icon */}
            <div className="relative mx-auto w-20 h-20">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Payment Submitted!
              </h3>
              <p className="text-sm text-zinc-500 mt-1">
                Your payment of{" "}
                <span className="font-bold text-zinc-900 dark:text-white">
                  {formatINR(amount)}
                </span>{" "}
                has been recorded
              </p>
            </div>

            {/* Summary */}
            <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 text-left space-y-2.5">
              {[
                ["Bill", bill.bill_number],
                ["Amount", formatINR(amount)],
                ["Method", selectedMethod.replace(/_/g, " ")],
                [
                  "Reference",
                  form.upi_ref_number || form.transaction_id || "Submitted",
                ],
                ["Status", "⏳ Pending Confirmation"],
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

            {/* Next steps */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                What happens next?
              </p>
              {[
                "Treasurer reviews your payment",
                "Confirmation within 24 hours",
                "PDF receipt sent to your email",
                "Bill status updates to PAID",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={handleClose}>
              Done ✓
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
