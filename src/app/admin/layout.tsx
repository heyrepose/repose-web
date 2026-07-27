"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { Spinner } from "@/components/ui/spinner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { hydrated, isAuthenticated } = useAuth();
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  const { data: me, isLoading, isError } = useQuery({
    queryKey: ["me-role"],
    enabled: hydrated && isAuthenticated,
    queryFn: () =>
      apiFetch<{
        id: string;
        role: string;
        fullName?: string;
        username?: string | null;
      }>("/users/me"),
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/login?redirect=/admin");
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (me && accessToken) {
      setSession({
        accessToken,
        user: {
          id: me.id,
          role: me.role,
          fullName: me.fullName,
          username: me.username,
        },
      });
    }
  }, [me, accessToken, setSession]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || isLoading) return;
    if (isError || (me && me.role !== "ADMIN")) {
      router.replace("/");
    }
  }, [hydrated, isAuthenticated, isLoading, isError, me, router]);

  if (
    !hydrated ||
    !isAuthenticated ||
    isLoading ||
    !me ||
    me.role !== "ADMIN"
  ) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="text-sm text-muted">Checking admin access…</p>
      </div>
    );
  }

  return (
    <div>
      <nav className="mb-6 flex flex-wrap gap-4 border-b border-card-border pb-4 text-sm font-medium">
        <a href="/admin" className="text-primary">
          Dashboard
        </a>
        <a href="/admin/reports" className="text-muted hover:text-primary">
          Reports
        </a>
        <a href="/admin/categories" className="text-muted hover:text-primary">
          Categories
        </a>
      </nav>
      {children}
    </div>
  );
}
