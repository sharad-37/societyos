// src/app/page.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle,
  CreditCard,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

// ─── Features Data ───────────────────────────────────────────
const features = [
  {
    icon: CreditCard,
    title: "Smart Billing",
    description:
      "Auto-generate monthly maintenance bills. Track payments, send reminders, and apply late fees automatically.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: MessageSquare,
    title: "Complaint Management",
    description:
      "Raise and track complaints with priority levels. Committee assigns and resolves with full audit trail.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: TrendingUp,
    title: "Fund Transparency",
    description:
      "Complete expense ledger visible to all residents. Upload receipts, track spending by category.",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Bell,
    title: "Notice Board",
    description:
      "Post urgent notices, meeting updates, and announcements. Track who has read each notice.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: Shield,
    title: "Visitor Management",
    description:
      "OTP-based guest passes for secure visitor entry. Guards verify digitally — no paper registers.",
    color: "bg-red-100 text-red-700",
  },
  {
    icon: Users,
    title: "Digital Voting",
    description:
      "Tamper-evident polls with one-flat-one-vote rule. Anonymous options. SHA-256 vote hashing.",
    color: "bg-yellow-100 text-yellow-700",
  },
];

const stats = [
  { value: "500+", label: "Societies" },
  { value: "50K+", label: "Residents" },
  { value: "₹2Cr+", label: "Collected" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-7 w-7 text-zinc-900" />
              <span className="text-xl font-bold tracking-tight">
                SocietyOS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, zinc 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge
            variant="secondary"
            className="mb-6 bg-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            🏢 Built for Indian Housing Societies
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Manage Your Society
            <span className="block text-zinc-400">The Smart Way</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            SocietyOS is a complete RWA management platform. Handle billing,
            complaints, notices, voting, and visitor management — all in one
            place. Transparent. Secure. Simple.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-zinc-100 font-semibold px-8"
              >
                Start Managing Your Society
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────── */}
      <section className="py-24 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything Your Society Needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From billing to security — one platform handles it all
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white border p-8 hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`inline-flex rounded-xl p-3 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Started in Minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Register Your Society",
                desc: "Admin sets up society, adds wings, floors, and flats. Takes under 10 minutes.",
              },
              {
                step: "02",
                title: "Add Residents",
                desc: "Import residents via CSV or add manually. Each gets email OTP login — no passwords.",
              },
              {
                step: "03",
                title: "Start Managing",
                desc: "Generate bills, handle complaints, post notices. Everything works from day one.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white font-bold text-lg">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────── */}
      <section className="bg-zinc-950 py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to modernize your society?
          </h2>
          <p className="mt-4 text-zinc-400">
            Join hundreds of societies already using SocietyOS. Free to start.
            No credit card required.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 font-semibold"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Free tier available
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              No setup fees
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold text-foreground">SocietyOS</span>
          </div>
          <p>© 2024 SocietyOS. Built for Indian Housing Societies.</p>
        </div>
      </footer>
    </div>
  );
}
