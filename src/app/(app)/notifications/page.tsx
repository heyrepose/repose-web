"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { apiFetch, apiFetchWithMeta } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  readAt?: string | null;
  isRead?: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      apiFetchWithMeta<NotificationItem[]>("/notifications?limit=40"),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
      void qc.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
    onError: (e) => toast("Could not mark as read", "error", e),
  });

  const items = data?.data ?? [];

  function hrefFor(n: NotificationItem): string | null {
    const d = n.data ?? {};
    if (typeof d.orderId === "string") return `/orders/${d.orderId}`;
    if (typeof d.conversationId === "string")
      return `/messages/${d.conversationId}`;
    if (typeof d.listingId === "string") return `/listing/${d.listingId}`;
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-1 text-sm text-muted">
          {typeof data?.meta?.unreadCount === "number"
            ? `${data.meta.unreadCount} unread`
            : "Order updates, messages, and more"}
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : !items.length ? (
        <EmptyState
          title="All quiet"
          description="You'll see order and message alerts here."
          icon={<Bell className="h-6 w-6" />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => {
            const unread = !(n.isRead || n.readAt);
            const href = hrefFor(n);
            const content = (
              <div
                className={cn(
                  "rounded-card border border-card-border p-4 shadow-card transition-colors",
                  unread ? "bg-accent-soft/50" : "bg-surface",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {unread ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            );

            return (
              <li key={n.id}>
                {href ? (
                  <Link
                    href={href}
                    onClick={() => {
                      if (unread) markRead.mutate(n.id);
                    }}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (unread) markRead.mutate(n.id);
                    }}
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
