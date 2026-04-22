// src/app/(dashboard)/layout.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { cn, getInitials } from "@/lib/utils";
import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  TrendingUp,
  Users,
  Vote,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Navigation items per role
const residentNav = [
  { href: "/resident", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resident/bills", icon: CreditCard, label: "My Bills" },
  { href: "/resident/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/resident/notices", icon: Bell, label: "Notices" },
  { href: "/resident/bookings", icon: Calendar, label: "Bookings" },
];

const committeeNav = [
  { href: "/committee", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/committee/billing", icon: CreditCard, label: "Billing" },
  { href: "/committee/expenses", icon: TrendingUp, label: "Expenses" },
  { href: "/committee/complaints", icon: MessageSquare, label: "Complaints" },
  { href: "/committee/members", icon: Users, label: "Members" },
  { href: "/committee/notices", icon: Bell, label: "Notices" },
  { href: "/committee/polls", icon: Vote, label: "Polls" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout, isCommittee } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    );
  }

  if (!user) return null;

  const navItems = isCommittee ? committeeNav : residentNav;

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-zinc-950 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-6 border-b border-zinc-800">
        <Building2 className="h-6 w-6" />
        <span className="font-bold text-lg">SocietyOS</span>
      </div>

      {/* Society name */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Society
        </p>
        <p className="text-sm font-medium text-zinc-200 mt-0.5 truncate">
          {user.societyName}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-zinc-800" />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-zinc-900 p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-zinc-700 text-white text-xs font-bold">
              {getInitials(user.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.fullName}
            </p>
            <Badge
              variant="secondary"
              className="mt-0.5 bg-zinc-700 text-zinc-300 text-xs px-1.5 py-0"
            >
              {user.role}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-700 flex-shrink-0"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 h-full">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6 flex-shrink-0">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Page title from pathname */}
          <div className="flex-1">
            <h1 className="text-base font-semibold text-zinc-900">
              {navItems.find((n) => n.href === pathname)?.label || "Dashboard"}
            </h1>
          </div>

          {/* Quick user info on mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-zinc-900 text-white text-xs">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
