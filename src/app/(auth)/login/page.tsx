// src/app/(auth)/login/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Building2, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Failed to send OTP. Please try again.");
        return;
      }

      // Store email for OTP page
      sessionStorage.setItem("otp_email", email.toLowerCase().trim());

      // In dev mode — store OTP for convenience
      if (data.data?.otp) {
        sessionStorage.setItem("dev_otp", data.data.otp);
      }

      // Navigate to OTP verification page
      router.push("/verify-otp");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-zinc-800 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-zinc-800 opacity-20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <Building2 className="h-8 w-8 text-white" />
            <span className="text-2xl font-bold text-white">SocietyOS</span>
          </div>
          <p className="mt-2 text-zinc-400 text-sm">
            Housing Society Management Platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-zinc-800 bg-zinc-900 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email to receive a secure login code
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500 focus:ring-zinc-500"
                    required
                    autoComplete="email"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-semibold"
                disabled={isLoading || !email}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send Login Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="mt-6 rounded-lg bg-zinc-800 p-4">
              <p className="text-xs text-zinc-400 leading-relaxed">
                🔐 We&apos;ll send a 6-digit code to your email. No password
                needed — your email IS your identity. Code expires in 10
                minutes.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-zinc-600">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
