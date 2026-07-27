"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatAed } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Wallet = {
  balanceAed: string;
  pendingAed?: string;
  onboardingComplete: boolean;
  ledger: Array<{
    type: string;
    amountAed: string;
    referenceOrderId?: string;
    createdAt: string;
  }>;
};

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => apiFetch<Wallet>("/wallet"),
  });

  const onboard = useMutation({
    mutationFn: () =>
      apiFetch<{ onboardingUrl: string }>("/wallet/onboard", {
        method: "POST",
      }),
    onSuccess: (res) => {
      toast("Redirecting to Stripe…", "default");
      window.location.href = res.onboardingUrl;
    },
    onError: (e) =>
      toast(e instanceof ApiError ? e.message : "Onboarding failed", "error"),
  });

  const withdraw = useMutation({
    mutationFn: () =>
      apiFetch("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({ amountAed: amount }),
      }),
    onSuccess: () => {
      setWithdrawOpen(false);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast("Withdrawal submitted", "success");
    },
    onError: (e) =>
      toast(e instanceof ApiError ? e.message : "Withdrawal failed", "error"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>

      <div className="rounded-card bg-primary px-5 py-8 text-surface shadow-card">
        <p className="text-sm text-accent-soft">Available balance</p>
        <p className="mt-2 font-brand text-4xl">
          {formatAed(data?.balanceAed ?? "0")}
        </p>
        {data?.pendingAed ? (
          <p className="mt-3 text-sm text-accent-soft">
            Pending · {formatAed(data.pendingAed)}
          </p>
        ) : null}
      </div>

      {!data?.onboardingComplete ? (
        <div className="rounded-card border border-card-border bg-surface p-4 shadow-card">
          <p className="text-sm font-semibold">Set up payouts</p>
          <p className="mt-1 text-sm text-muted">
            Connect Stripe to withdraw your earnings.
          </p>
          <Button
            className="mt-4 w-full"
            disabled={onboard.isPending}
            onClick={() => onboard.mutate()}
          >
            Continue onboarding
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-card border border-card-border bg-surface p-4 shadow-card">
          <Input
            label="Withdraw amount (AED)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button
            disabled={withdraw.isPending || !amount}
            onClick={() => setWithdrawOpen(true)}
          >
            Withdraw
          </Button>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold">Activity</h2>
        {(data?.ledger ?? []).length === 0 ? (
          <EmptyState
            title="No transactions"
            description="Sale credits and withdrawals will appear here."
            icon={<WalletIcon className="h-6 w-6" />}
          />
        ) : (
          <ul className="space-y-2">
            {data!.ledger.map((row, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-card border border-card-border bg-surface px-4 py-3 text-sm shadow-card"
              >
                <div>
                  <p className="font-medium">{row.type.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted">
                    {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="font-semibold">{formatAed(row.amountAed)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={() => withdraw.mutate()}
        title="Withdraw funds?"
        description={`Submit a withdrawal of ${formatAed(amount || "0")} to your connected payout account.`}
        confirmLabel="Withdraw"
        busy={withdraw.isPending}
      />
    </div>
  );
}
