"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type ConversationItem = {
  id: string;
  listing: { id: string; title: string; mainImageUrl?: string | null };
  otherUser: { id: string; username: string; avatarUrl?: string | null };
  lastMessage?: { body: string; createdAt: string } | null;
  unreadCount: number;
};

export function ConversationList({
  items,
}: {
  items: ConversationItem[];
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="No messages yet"
        description="Message a seller from any listing to start a chat."
        icon={<MessageCircle className="h-6 w-6" />}
      />
    );
  }

  return (
    <ul className="divide-y divide-card-border overflow-hidden rounded-card border border-card-border bg-surface shadow-card">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex gap-3 p-3 transition-colors hover:bg-accent-soft/40"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-card bg-accent-soft">
              {c.listing.mainImageUrl ? (
                <Image
                  src={c.listing.mainImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">
                  @{c.otherUser.username}
                </p>
                {c.unreadCount > 0 ? (
                  <span className="rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold text-surface">
                    {c.unreadCount}
                  </span>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted">{c.listing.title}</p>
              <p
                className={cn(
                  "mt-0.5 truncate text-xs",
                  c.unreadCount > 0 ? "font-medium text-text" : "text-muted",
                )}
              >
                {c.lastMessage?.body ?? "No messages yet"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
