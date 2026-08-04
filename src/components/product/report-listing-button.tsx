"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  { value: "COUNTERFEIT_SUSPECTED", label: "Suspected counterfeit" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "MISLEADING", label: "Misleading description" },
  { value: "SPAM", label: "Spam" },
  { value: "OTHER", label: "Other" },
];

export function ReportListingButton({ listingId }: { listingId: string }) {
  const requireAuth = useRequireAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/listings/${listingId}/report`, {
        method: "POST",
        body: JSON.stringify({
          reason: note.trim() ? `${reason}: ${note.trim()}` : reason,
        }),
      }),
    onSuccess: () => {
      toast("Thanks — we received your report", "success");
      setOpen(false);
      setNote("");
    },
    onError: (e) =>
      toast("Could not report", "error", e),
  });

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted underline"
        onClick={() => {
          if (!requireAuth()) return;
          setOpen(true);
        }}
      >
        <Flag className="h-3 w-3" />
        Report listing
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Report listing"
        footer={
          <Button
            className="w-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Submit report
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={REASONS}
          />
          <Textarea
            label="Details (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>
      </Sheet>
    </>
  );
}
