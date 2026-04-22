// src/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Bell,
  Users,
  Vote,
  Shield,
  TrendingUp,
  LogOut,
  Building2,
  ChevronRight,
  Home,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { AppleAvatar } from "@/components/ui/apple-components";
import { useTheme } from "next-themes";

// ─── Nav Config ───────────────────────────────────────────────
const residentNav = [
  { href: "/resident", icon: LayoutDashboard, label: "Home", exact: true },
  { href: "/resident/bills", icon: CreditCard, label: "Bills" },
  { href: "/resident/complaints", icon: MessageSquare, label: "Issues" },
  { href: "/resident/notices", icon: Bell, label: "Notices" },
  { href: "/resident/polls", icon: Vote, label: "Polls" },
  { href: "/resident/visitors", icon: Users, label: "Visitors" },
];

const committeeNav = [
  { href: "/committee", icon: LayoutDashboard, label: "Overview", exact: true },
  { href: "/committee/billing", icon: CreditCard, label: "Billing" },
  { href: "/committee/expenses", icon: TrendingUp, label: "Expenses" },
  { href: "/committee/complaints", icon: MessageSquare, label: "Issues" },
  { href: "/committee/members", icon: Users, label: "Members" },
  { href: "/committee/notices", icon: Bell, label: "Notices" },
  { href: "/committee/polls", icon: Vote, label: "Polls" },
  { href: "/committee/security", icon: Shield, label: "Security" },
];

// ─── Sidebar ──────────────────────────────────────────────────
function DesktopSidebar({
  user,
  navItems,
  pathname,
  logout,
  isCommittee,
}: {
  user: any;
  navItems: typeof residentNav;
  pathname: string;
  logout: () => void;
  isCommittee: boolean;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200/60 dark:border-zinc-800">
      {/* App Header */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
              SocietyOS
            </p>
            <p className="text-[10px] text-zinc-400">Management Platform</p>
          </div>
        </div>
      </div>

      {/* Society Card */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-green-500 absolute -top-0.5 -right-0.5 z-10" />
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Home className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {user?.societyName}
              </p>
              <p className="text-[10px] text-zinc-400">
                {isCommittee ? "⚡ Committee" : "🏠 Resident"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 overflow-y-auto">
        <p className="section-header px-2 mb-2 text-[10px]">Menu</p>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                  "text-sm font-medium transition-all duration-150",
                  "group",
                  isActive
                    ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-zinc-800/60",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-all duration-150",
                    isActive
                      ? "text-blue-500"
                      : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="font-medium">
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        {/* User Card */}
        <div className="rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700 p-3">
          <div className="flex items-center gap-3">
            <AppleAvatar name={user?.fullName || "User"} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────
function MobileBottomNav({
  navItems,
  pathname,
}: {
  navItems: typeof residentNav;
  pathname: string;
}) {
  // Show only first 5 items on mobile
  const mobileItems = navItems.slice(0, 5);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800 px-2 py-2 pb-safe">
        <div className="flex items-center justify-around">
          {mobileItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item-apple flex-1", isActive && "active")}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActive ? "text-blue-500 scale-110" : "text-zinc-400",
                    )}
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500" />
                  )}
                </div>
                <span
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-blue-500 font-semibold" : "text-zinc-400",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout, isCommittee } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-5">
          <div className="h-14 w-14 rounded-3xl bg-blue-500 flex items-center justify-center shadow-lg">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = isCommittee ? committeeNav : residentNav;
  const currentPage = navItems.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100/50 dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col flex-shrink-0">
        <DesktopSidebar
          user={user}
          navItems={navItems}
          pathname={pathname}
          logout={logout}
          isCommittee={isCommittee}
        />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="hidden md:flex h-14 items-center justify-between px-6 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-400 font-medium">
              {isCommittee ? "Committee" : "Resident"}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300" />
            <span className="font-semibold text-zinc-900 dark:text-white">
              {currentPage?.label || "Dashboard"}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-2.5 py-1 font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 pulse-dot" />
              Online
            </div>
            <AppleAvatar name={user.fullName} size="sm" />
          </div>
        </header>

        {/* Mobile header */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-blue-500 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="font-bold text-zinc-900 dark:text-white text-sm">
              SocietyOS
            </p>
          </div>
          <AppleAvatar name={user.fullName} size="sm" />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <div className="animate-apple-in">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav navItems={navItems} pathname={pathname} />
    </div>
  );
}
