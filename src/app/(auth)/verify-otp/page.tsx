// src/app/(auth)/verify-otp/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { AppleButton } from "@/components/ui/apple-components";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("otp_email");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setEmail(stored);

    const devOtp = sessionStorage.getItem("dev_otp");
    if (devOtp?.length === 6) {
      setOtp(devOtp.split(""));
    }

    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [router]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      const full = [...next].join("");
      if (full.length === 6) handleVerify(full);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpStr?: string) => {
    const final = otpStr || otp.join("");
    if (final.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: final }),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid code");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      login(data.data.user);
      sessionStorage.removeItem("otp_email");
      sessionStorage.removeItem("dev_otp");

      setTimeout(() => router.replace(data.data.redirectTo), 500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.otp) {
          sessionStorage.setItem("dev_otp", data.data.otp);
          setOtp(data.data.otp.split(""));
        } else {
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
        setCountdown(60);
        setCanResend(false);
      }
    } finally {
      setIsResending(false);
    }
  };

  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Back */}
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-1.5 text-sm text-blue-500 font-medium mb-8 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div
            className={cn(
              "h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg mb-5 transition-all duration-500",
              success
                ? "bg-green-500 shadow-green-500/30"
                : "bg-blue-500 shadow-blue-500/30",
            )}
          >
            {success ? (
              <ShieldCheck className="h-10 w-10 text-white animate-scale-pop" />
            ) : (
              <Building2 className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {success ? "Verified!" : "Enter Code"}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-center">
            {success ? "Signing you in..." : `Sent to ${maskedEmail}`}
          </p>
        </div>

        {/* OTP Card */}
        <div className="apple-card p-6 space-y-6">
          {/* Digits */}
          <div className="flex gap-2.5 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                disabled={isLoading || success}
                className={cn(
                  "h-14 w-11 rounded-2xl text-center text-2xl font-bold",
                  "bg-zinc-100 dark:bg-zinc-800",
                  "border-2 outline-none",
                  "transition-all duration-150",
                  digit
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-900 dark:text-white",
                  "focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/20",
                  error && "border-red-400 bg-red-50 dark:bg-red-900/20",
                  success &&
                    "border-green-400 bg-green-50 dark:bg-green-900/20",
                )}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-center">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Verify Button */}
          {!success && (
            <AppleButton
              onClick={() => handleVerify()}
              loading={isLoading}
              disabled={otp.join("").length !== 6}
              fullWidth
              size="lg"
            >
              Verify & Sign In
            </AppleButton>
          )}

          {/* Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="flex items-center gap-2 text-sm text-blue-500 font-medium mx-auto hover:opacity-70 transition-opacity"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isResending && "animate-spin")}
                />
                Resend Code
              </button>
            ) : (
              <p className="text-sm text-zinc-400">
                Resend in{" "}
                <span className="font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                  {countdown}s
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Security note */}
        <p className="text-xs text-zinc-400 text-center mt-6">
          🔐 This code expires in 10 minutes
        </p>
      </div>
    </div>
  );
}
