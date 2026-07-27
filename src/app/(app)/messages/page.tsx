"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";
import {
  ConversationList,
  type ConversationItem,
} from "@/components/chat/conversation-list";

export default function MessagesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<ConversationItem[]>("/conversations?limit=40"),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Messages</h1>
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm text-muted">Could not load conversations.</p>
        ) : (
          <ConversationList items={data ?? []} />
        )}
      </div>
    </div>
  );
}
