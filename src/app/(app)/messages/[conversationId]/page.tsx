"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/hooks";
import { getChatSocket } from "@/lib/socket";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";

type Message = {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
};

type ConversationMeta = {
  id: string;
  listing: {
    id: string;
    title: string;
    mainImageUrl?: string | null;
  };
  otherUser: { username: string };
};

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiFetch<ConversationMeta[]>("/conversations?limit=40"),
  });

  const meta = conversations?.find((c) => c.id === conversationId);

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () =>
      apiFetch<Message[]>(
        `/conversations/${conversationId}/messages?limit=50`,
      ),
  });

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };
    socket.on("message:new", handler);
    return () => {
      socket.off("message:new", handler);
    };
  }, [conversationId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (text: string) => {
      return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
    },
    onError: (e) =>
      toast(
        e instanceof ApiError ? e.message : "Could not send message",
        "error",
      ),
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-lg flex-col">
      {meta ? (
        <Link
          href={`/listing/${meta.listing.id}`}
          className="mb-3 flex items-center gap-3 rounded-card border border-card-border bg-surface p-2.5 shadow-card"
        >
          <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-card bg-accent-soft">
            {meta.listing.mainImageUrl ? (
              <Image
                src={meta.listing.mainImageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {meta.listing.title}
            </p>
            <p className="text-xs text-muted">@{meta.otherUser.username}</p>
          </div>
        </Link>
      ) : (
        <h1 className="mb-3 text-xl font-semibold">Chat</h1>
      )}

      <div className="flex-1 space-y-2.5 overflow-y-auto rounded-card border border-card-border bg-surface p-3 shadow-card">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : !messages?.length ? (
          <p className="py-8 text-center text-sm text-muted">
            Say hello to start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              body={m.body}
              mine={m.senderId === user?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 pb-[env(safe-area-inset-bottom)]">
        <ChatInput
          value={body}
          onChange={setBody}
          disabled={send.isPending}
          onSubmit={() => {
            const text = body.trim();
            if (!text) return;
            send.mutate(text);
          }}
        />
      </div>
    </div>
  );
}
