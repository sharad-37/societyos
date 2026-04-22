// src/app/(auth)/verify-otp/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Building2, Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("otp_email");
    if (!storedEmail) {
      router.replace("/login");
      return;
    }
    setEmail(storedEmail);

    // Dev mode: auto-fill OTP
    const devOtp = sessionStorage.getItem("dev_otp");
    if (devOtp && devOtp.length === 6) {
      setOtp(devOtp.split(""));
    }
  }, [router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle OTP input
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only last digit
    setOtp(newOtp);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (value && index === 5) {
      const fullOtp = [...newOtp].join("");
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
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

  // Verify OTP
  const handleVerify = async (otpString?: string) => {
    const finalOtp = otpString || otp.join("");
    if (finalOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: finalOtp }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // Save user to auth state
      login(data.data.user);

      // Clear session storage
      sessionStorage.removeItem("otp_email");
      sessionStorage.removeItem("dev_otp");

      // Redirect based on role
      router.replace(data.data.redirectTo);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setIsResending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data?.otp) {
          sessionStorage.setItem("dev_otp", data.data.otp);
          setOtp(data.data.otp.split(""));
        }
        setCountdown(60);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Mask email for display
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : "";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Building2 className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">SocietyOS</span>
          </div>
        </div>

        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Check your email
            </CardTitle>
            <CardDescription className="text-zinc-400">
              We sent a 6-digit code to{" "}
              <span className="text-zinc-200 font-medium">{maskedEmail}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input Grid */}
            <div>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`
                      h-14 w-12 rounded-xl border text-center text-2xl font-bold
                      bg-zinc-800 text-white
                      focus:outline-none focus:ring-2 focus:ring-zinc-500
                      transition-all duration-150
                      ${digit ? "border-zinc-500" : "border-zinc-700"}
                      ${error ? "border-red-500 shake" : ""}
                    `}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 rounded-lg bg-red-950 border border-red-800 px-4 py-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Verify Button */}
            <Button
              onClick={() => handleVerify()}
              className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-semibold"
              disabled={isLoading || otp.join("").length !== 6}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            {/* Resend */}
            <div className="text-center">
              {canResend ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-zinc-400 hover:text-white"
                >
                  {isResending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-zinc-500">
                  Resend code in{" "}
                  <span className="text-zinc-300 font-mono font-medium">
                    {countdown}s
                  </span>
                </p>
              )}
            </div>

            {/* Back to login */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/login")}
              className="w-full text-zinc-500 hover:text-zinc-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
