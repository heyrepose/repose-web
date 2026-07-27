"use client";

import { FormEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  function handle(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handle} className="flex gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a message…"
        className="min-h-[48px] flex-1 rounded-pill border border-card-border bg-surface px-4 text-sm outline-none focus:border-primary"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="h-12 w-12 shrink-0"
        aria-label="Send"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
