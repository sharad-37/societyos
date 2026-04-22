// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in Indian Rupees
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in Indian format
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// Format date short
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Calculate days until due date
export function getDaysUntilDue(dueDate: string | Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get bill status color
export function getBillStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PAID: "text-green-600 bg-green-50 border-green-200",
    PENDING: "text-yellow-600 bg-yellow-50 border-yellow-200",
    OVERDUE: "text-red-600 bg-red-50 border-red-200",
    PARTIALLY_PAID: "text-blue-600 bg-blue-50 border-blue-200",
    WAIVED: "text-gray-600 bg-gray-50 border-gray-200",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}

// Get complaint priority color
export function getComplaintPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    URGENT: "text-red-700 bg-red-100 border-red-300",
    HIGH: "text-orange-600 bg-orange-50 border-orange-200",
    MEDIUM: "text-yellow-600 bg-yellow-50 border-yellow-200",
    LOW: "text-green-600 bg-green-50 border-green-200",
  };
  return colors[priority] || "text-gray-600 bg-gray-50";
}

// Get complaint status color
export function getComplaintStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "text-red-600 bg-red-50 border-red-200",
    ASSIGNED: "text-blue-600 bg-blue-50 border-blue-200",
    IN_PROGRESS: "text-yellow-600 bg-yellow-50 border-yellow-200",
    RESOLVED: "text-green-600 bg-green-50 border-green-200",
    CLOSED: "text-gray-600 bg-gray-50 border-gray-200",
    REJECTED: "text-red-800 bg-red-100 border-red-300",
  };
  return colors[status] || "text-gray-600 bg-gray-50";
}
