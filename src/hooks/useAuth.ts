// src/hooks/useAuth.ts
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  societyId: string;
  societyName: string;
  flatId: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("societyos_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({ user, isLoading: false, isAuthenticated: true });
      } catch {
        localStorage.removeItem("societyos_user");
        setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback((user: User) => {
    localStorage.setItem("societyos_user", JSON.stringify(user));
    setAuthState({ user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("societyos_user");
      setAuthState({ user: null, isLoading: false, isAuthenticated: false });
      router.push("/login");
    }
  }, [router]);

  const isCommittee = ["SECRETARY", "TREASURER", "PRESIDENT", "ADMIN"].includes(
    authState.user?.role || "",
  );

  const isAdmin = authState.user?.role === "ADMIN";

  return {
    ...authState,
    login,
    logout,
    isCommittee,
    isAdmin,
  };
}
