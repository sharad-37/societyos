// src/app/page.tsx
import Link from "next/link";
import {
  Building2,
  CreditCard,
  MessageSquare,
  Bell,
  Shield,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Vote,
  Star,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    color: "bg-blue-500",
    title: "Smart Billing",
    desc: "Auto-generate bills, track payments, send reminders automatically.",
  },
  {
    icon: MessageSquare,
    color: "bg-orange-500",
    title: "Complaint Tracking",
    desc: "Raise issues, assign priority, track resolution in real-time.",
  },
  {
    icon: TrendingUp,
    color: "bg-green-500",
    title: "Fund Transparency",
    desc: "Complete expense ledger visible to all residents.",
  },
  {
    icon: Vote,
    color: "bg-purple-500",
    title: "Digital Voting",
    desc: "Tamper-evident polls with SHA-256 hashing. One flat, one vote.",
  },
  {
    icon: Users,
    color: "bg-pink-500",
    title: "Visitor Management",
    desc: "OTP guest passes. Guards verify digitally at the gate.",
  },
  {
    icon: Shield,
    color: "bg-red-500",
    title: "Bank-grade Security",
    desc: "JWT auth, RBAC, rate limiting, full audit trail.",
  },
];

const stats = [
  { value: "500+", label: "Societies" },
  { value: "50K+", label: "Residents" },
  { value: "₹2Cr+", label: "Processed" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/60">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-500 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-zinc-900 tracking-tight">
              SocietyOS
            </span>
          </div>
          <Link href="/login">
            <button className="btn-apple-primary text-xs px-4 py-2">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 text-xs font-semibold text-blue-700 mb-8">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            Built for Indian Housing Societies
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-none mb-6">
            Manage Your Society
            <br />
            <span className="text-blue-500">The Smart Way</span>
          </h1>

          <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10">
            SocietyOS brings billing, complaints, voting, visitor management,
            and transparency — all in one beautiful platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <button className="btn-apple-primary text-base px-8 py-3.5">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
            {[
              "🔐 Bank-grade security",
              "📱 Mobile-first",
              "🇮🇳 Built for India",
            ].map((item) => (
              <span key={item} className="text-sm text-zinc-400 font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-12 bg-zinc-50 border-y border-zinc-200/60">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-zinc-900 tracking-tight">
                  {s.value}
                </p>
                <p className="text-sm text-zinc-400 mt-1 font-medium">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight mb-4">
              Everything your society needs
            </h2>
            <p className="text-zinc-400 text-lg">
              One platform. Complete solution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="apple-card p-6 group cursor-default"
              >
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${f.color} shadow-sm`}
                >
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-zinc-50 border-t border-zinc-200/60">
        <div className="max-w-2xl mx-auto text-center">
          <div className="h-16 w-16 rounded-3xl bg-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight mb-4">
            Ready to modernize?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join hundreds of societies. Free to start.
          </p>
          <Link href="/login">
            <button className="btn-apple-primary text-base px-8 py-3.5">
              Get Started Free
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </Link>
          <div className="flex items-center justify-center gap-6 mt-6">
            {["Free tier available", "No credit card", "Cancel anytime"].map(
              (item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 text-xs text-zinc-400"
                >
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-zinc-200/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg bg-blue-500 flex items-center justify-center">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-zinc-600">SocietyOS</span>
          </div>
          <p>© 2024 SocietyOS. Built for India.</p>
        </div>
      </footer>
    </div>
  );
}
