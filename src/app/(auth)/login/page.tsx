// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, ArrowRight, Loader2 } from "lucide-react";
import { AppleButton, AppleInput } from "@/components/ui/apple-components";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to send code");
        return;
      }

      sessionStorage.setItem("otp_email", email.toLowerCase().trim());
      if (data.data?.otp) {
        sessionStorage.setItem("dev_otp", data.data.otp);
      }

      router.push("/verify-otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* App Icon */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-20 w-20 rounded-3xl bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-5">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">
            SocietyOS
          </h1>
          <p className="text-sm text-zinc-400 mt-1 text-center">
            Society Management Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="apple-card p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Enter your email to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AppleInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              error={error}
              required
            />

            <AppleButton
              type="submit"
              loading={isLoading}
              disabled={!email}
              fullWidth
              size="lg"
            >
              Continue
              {!isLoading && <ArrowRight className="h-4 w-4 ml-1" />}
            </AppleButton>
          </form>

          {/* Info */}
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-800 p-4">
            <p className="text-xs text-zinc-400 text-center leading-relaxed">
              We'll send a 6-digit code to your email. No password needed.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-400 text-center mt-6">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
