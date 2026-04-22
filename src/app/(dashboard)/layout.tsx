// src/app/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Users,
  Vote,
  Shield,
  Calendar,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

// ─── Nav Config ───────────────────────────────────────────────
const residentNav = [
  {
    href: "/resident",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/resident/bills",
    icon: CreditCard,
    label: "My Bills",
  },
  {
    href: "/resident/complaints",
    icon: MessageSquare,
    label: "Complaints",
  },
  {
    href: "/resident/notices",
    icon: Bell,
    label: "Notices",
  },
  {
    href: "/resident/polls",
    icon: Vote,
    label: "Polls",
  },
  {
    href: "/resident/visitors",
    icon: Users,
    label: "Visitors",
  },
];

const committeeNav = [
  {
    href: "/committee",
    icon: LayoutDashboard,
    label: "Dashboard",
    exact: true,
  },
  {
    href: "/committee/billing",
    icon: CreditCard,
    label: "Billing",
  },
  {
    href: "/committee/expenses",
    icon: TrendingUp,
    label: "Expenses",
  },
  {
    href: "/committee/complaints",
    icon: MessageSquare,
    label: "Complaints",
  },
  {
    href: "/committee/members",
    icon: Users,
    label: "Members",
  },
  {
    href: "/committee/notices",
    icon: Bell,
    label: "Notices",
  },
  {
    href: "/committee/polls",
    icon: Vote,
    label: "Polls",
  },
  {
    href: "/committee/security",
    icon: Shield,
    label: "Security",
  },
];

// ─── Sidebar Component ────────────────────────────────────────
function Sidebar({
  user,
  navItems,
  pathname,
  logout,
  onClose,
  isCommittee,
}: {
  user: any;
  navItems: typeof residentNav;
  pathname: string;
  logout: () => void;
  onClose?: () => void;
  isCommittee: boolean;
}) {
  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800/60">
        <div className="h-8 w-8 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-tight">SocietyOS</span>
          <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
            Management Platform
          </p>
        </div>
      </div>

      {/* Society Info */}
      <div className="mx-3 mt-3 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0 relative">
            <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-50" />
          </div>
          <p className="text-xs text-zinc-300 font-medium truncate">
            {user?.societyName}
          </p>
        </div>
        <p className="text-[10px] text-zinc-600 mt-0.5 pl-4">
          {isCommittee ? "Committee Portal" : "Resident Portal"}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "sidebar-item flex items-center gap-3 rounded-xl px-3 py-2.5",
                "text-sm font-medium transition-all duration-150",
                "group relative",
                isActive
                  ? "active bg-white text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-zinc-900" : "",
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-zinc-500" />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-xs font-bold">
              {getInitials(user?.fullName || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">
              {user?.fullName}
            </p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/50 flex-shrink-0 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Role Badge */}
        <div className="mt-2 flex items-center justify-center">
          <span
            className={cn(
              "text-[10px] font-semibold px-3 py-1 rounded-full",
              isCommittee
                ? "bg-purple-950 text-purple-400 border border-purple-800"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800",
            )}
          >
            {user?.role}
          </span>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-xl gradient-blue flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-zinc-600 animate-bounce"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = isCommittee ? committeeNav : residentNav;

  // Get current page label
  const currentPage = navItems.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col flex-shrink-0 shadow-xl">
        <Sidebar
          user={user}
          navItems={navItems}
          pathname={pathname}
          logout={logout}
          isCommittee={isCommittee}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-72 h-full shadow-2xl">
            <Sidebar
              user={user}
              navItems={navItems}
              pathname={pathname}
              logout={logout}
              onClose={() => setSidebarOpen(false)}
              isCommittee={isCommittee}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-white/80 backdrop-blur-md px-4 sm:px-6 flex-shrink-0 shadow-sm">
          {/* Mobile menu */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-1.5 text-sm">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="font-semibold text-zinc-900">
                {currentPage?.label || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>

            {/* Mobile user avatar */}
            <Avatar className="h-7 w-7 md:hidden">
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-[10px] font-bold">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in-up">
          {children}
        </main>
      </div>
    </div>
  );
}
