"use client";

import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive / irreversible styling for confirm */
  destructive?: boolean;
  busy?: boolean;
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      footer={
        <DialogActions>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className="flex-1"
            variant={destructive ? "outline" : "primary"}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? <Spinner className="h-4 w-4" /> : null}
            {confirmLabel}
          </Button>
        </DialogActions>
      }
    >
      {description ? <p className="text-muted">{description}</p> : null}
    </Dialog>
  );
}
