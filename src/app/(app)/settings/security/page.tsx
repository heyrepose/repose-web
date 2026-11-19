"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError, apiFetch, signOut } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogActions } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Me = {
  id: string;
  email?: string | null;
  phone?: string | null;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  hasPassword?: boolean;
  hasGoogle?: boolean;
};

type Session = {
  id: string;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  ip?: string;
  userAgent?: string;
};

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const PASSWORD_HINT = "At least 8 characters with a letter and a number";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card border border-card-border bg-surface p-4 shadow-card">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Badge({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={
        "rounded-full border px-2 py-0.5 text-xs " +
        (ok ? "border-primary text-primary" : "border-card-border text-muted")
      }
    >
      {children}
    </span>
  );
}

function describeClient(userAgent?: string): string {
  if (!userAgent) return "Unknown device";
  const browser =
    /Edg\//.test(userAgent) ? "Edge"
    : /Chrome\//.test(userAgent) ? "Chrome"
    : /Firefox\//.test(userAgent) ? "Firefox"
    : /Safari\//.test(userAgent) ? "Safari"
    : "Browser";
  const os =
    /Windows/.test(userAgent) ? "Windows"
    : /Android/.test(userAgent) ? "Android"
    : /iPhone|iPad/.test(userAgent) ? "iOS"
    : /Mac OS/.test(userAgent) ? "macOS"
    : /Linux/.test(userAgent) ? "Linux"
    : "";
  return os ? `${browser} on ${os}` : browser;
}

export default function SecurityPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<Me>("/users/me"),
  });
  const refreshMe = () => qc.invalidateQueries({ queryKey: ["users", "me"] });

  // ── Email ──────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const sendVerification = useMutation({
    mutationFn: () => apiFetch("/auth/email/verify/request", { method: "POST" }),
    onSuccess: () => toast("Verification email sent", "success"),
    onError: (e) => toast("Could not send the email", "error", e),
  });

  const changeEmail = useMutation({
    mutationFn: () =>
      apiFetch("/auth/email/change", {
        method: "POST",
        body: JSON.stringify({
          email: newEmail.trim(),
          ...(me?.hasPassword ? { currentPassword: emailPassword } : {}),
        }),
      }),
    onSuccess: () => {
      toast("Check your new email to confirm the change", "success");
      setNewEmail("");
      setEmailPassword("");
    },
    onError: (e) => toast("Could not change email", "error", e),
  });

  // ── Phone ──────────────────────────────────────────────
  const [newPhone, setNewPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"enter" | "code">("enter");

  const requestPhone = useMutation({
    mutationFn: () =>
      apiFetch("/auth/phone/change/request", {
        method: "POST",
        body: JSON.stringify({ phone: newPhone.trim() }),
      }),
    onSuccess: () => {
      setPhoneStep("code");
      toast("Code sent. In local MVP, read it from the API logs.", "success");
    },
    onError: (e) => toast("Could not send a code", "error", e),
  });

  const verifyPhone = useMutation({
    mutationFn: () =>
      apiFetch("/auth/phone/change/verify", {
        method: "POST",
        body: JSON.stringify({ phone: newPhone.trim(), code: phoneCode.trim() }),
      }),
    onSuccess: () => {
      setPhoneStep("enter");
      setNewPhone("");
      setPhoneCode("");
      void refreshMe();
      toast("Phone number updated", "success");
    },
    onError: (e) => toast("That code didn't work", "error", e),
  });

  // ── Password ───────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const passwordValid = PASSWORD_RULE.test(nextPassword);

  const changePassword = useMutation({
    mutationFn: () =>
      apiFetch<{ accessToken: string }>("/auth/password/change", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword: nextPassword }),
      }),
    onSuccess: (res) => {
      // Every other session was ended; this one continues on the fresh token.
      setSession({ accessToken: res.accessToken });
      setCurrentPassword("");
      setNextPassword("");
      void qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast("Password updated. Other devices were signed out.", "success");
    },
    onError: (e) => toast("Could not change password", "error", e),
  });

  // ── Sessions ───────────────────────────────────────────
  const { data: sessions } = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiFetch<Session[]>("/auth/sessions"),
  });

  const revokeSession = useMutation({
    mutationFn: (id: string) => apiFetch(`/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast("Device signed out", "success");
    },
    onError: (e) => toast("Could not sign that device out", "error", e),
  });

  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const logoutAll = useMutation({
    mutationFn: () => apiFetch("/auth/logout-all", { method: "POST" }),
    onSuccess: async () => {
      await signOut();
      window.location.href = "/login";
    },
    onError: (e) => toast("Could not sign out everywhere", "error", e),
  });

  // ── Data export & deletion ─────────────────────────────
  const exportData = useMutation({
    mutationFn: () => apiFetch<unknown>("/users/me/export"),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "repose-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => toast("Could not export your data", "error", e),
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteBlockers, setDeleteBlockers] = useState<string[]>([]);

  const requestDeleteCode = useMutation({
    mutationFn: () =>
      apiFetch("/auth/otp/request", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ phone: me?.phone, purpose: "LOGIN" }),
      }),
    onSuccess: () => toast("Code sent to your phone", "success"),
    onError: (e) => toast("Could not send a code", "error", e),
  });

  const deleteAccount = useMutation({
    mutationFn: () =>
      apiFetch("/users/me", {
        method: "DELETE",
        body: JSON.stringify(
          me?.hasPassword ? { password: deletePassword } : { code: deleteCode },
        ),
      }),
    onSuccess: async () => {
      await signOut();
      window.location.href = "/";
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errorCode === "USER_DELETE_BLOCKED") {
        setDeleteBlockers((e.details?.reasons as string[] | undefined) ?? []);
        return;
      }
      toast(
        e instanceof ApiError && e.errorCode === "AUTH_PASSWORD_INCORRECT"
          ? "Password is incorrect"
          : "Could not delete your account",
        "error",
        e,
      );
    },
  });

  function onSubmit(handler: () => void) {
    return (ev: FormEvent) => {
      ev.preventDefault();
      handler();
    };
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <header>
        <Link href="/settings" className="text-xs text-muted">
          ← Settings
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Security &amp; account</h1>
      </header>

      <Section title="Email">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm">{me?.email ?? "No email on this account"}</span>
          {me?.email ? (
            <Badge ok={Boolean(me.isEmailVerified)}>
              {me.isEmailVerified ? "Verified" : "Not verified"}
            </Badge>
          ) : null}
        </div>
        {me?.email && !me.isEmailVerified ? (
          <Button
            variant="outline"
            disabled={sendVerification.isPending}
            onClick={() => sendVerification.mutate()}
          >
            Send verification email
          </Button>
        ) : null}
        <form onSubmit={onSubmit(() => changeEmail.mutate())} className="flex flex-col gap-3">
          <Input
            label={me?.email ? "New email" : "Add an email"}
            type="email"
            autoComplete="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          {me?.hasPassword ? (
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
          ) : null}
          <Button
            type="submit"
            variant="outline"
            disabled={
              changeEmail.isPending ||
              !newEmail.includes("@") ||
              (Boolean(me?.hasPassword) && !emailPassword)
            }
          >
            {me?.email ? "Change email" : "Add email"}
          </Button>
          <p className="text-xs text-muted">
            We&apos;ll send a confirmation link to the new address. Nothing changes until you
            click it.
          </p>
        </form>
      </Section>

      <Section title="Phone">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">{me?.phone ?? "No phone on this account"}</span>
          {me?.phone ? (
            <Badge ok={Boolean(me.isPhoneVerified)}>
              {me.isPhoneVerified ? "Verified" : "Not verified"}
            </Badge>
          ) : null}
        </div>
        {phoneStep === "enter" ? (
          <form onSubmit={onSubmit(() => requestPhone.mutate())} className="flex flex-col gap-3">
            <Input
              label={me?.phone ? "New phone number" : "Add a phone number"}
              placeholder="+971…"
              inputMode="tel"
              autoComplete="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <Button
              type="submit"
              variant="outline"
              disabled={requestPhone.isPending || newPhone.trim().length < 6}
            >
              Send verification code
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmit(() => verifyPhone.mutate())} className="flex flex-col gap-3">
            <Input
              label={`6-digit code sent to ${newPhone}`}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPhoneStep("enter")}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={verifyPhone.isPending || phoneCode.trim().length !== 6}
              >
                Verify
              </Button>
            </div>
          </form>
        )}
      </Section>

      <Section title="Password">
        {me?.hasPassword === false ? (
          <>
            <p className="text-sm text-muted">
              {me.hasGoogle
                ? "You sign in with Google. You can also add a password to log in with your email."
                : "Your account signs in with phone codes only. You can add a password too."}
            </p>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Set a password
            </Link>
          </>
        ) : (
          <form
            onSubmit={onSubmit(() => changePassword.mutate())}
            className="flex flex-col gap-3"
          >
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder={PASSWORD_HINT}
              error={nextPassword && !passwordValid ? PASSWORD_HINT : undefined}
              value={nextPassword}
              onChange={(e) => setNextPassword(e.target.value)}
            />
            <Button
              type="submit"
              disabled={changePassword.isPending || !currentPassword || !passwordValid}
            >
              Change password
            </Button>
            <Link
              href="/forgot-password"
              className="text-center text-xs text-muted underline-offset-2 hover:underline"
            >
              Forgot your current password?
            </Link>
          </form>
        )}
      </Section>

      <Section
        title="Where you're signed in"
        description="Sign out any device you don't recognise."
      >
        {sessions?.length ? (
          <ul className="flex flex-col gap-3">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {describeClient(s.userAgent)}
                    {s.current ? <span className="ml-2 text-xs text-primary">This device</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {s.ip ? `${s.ip} · ` : ""}
                    Active {new Date(s.lastUsedAt).toLocaleString()}
                  </p>
                </div>
                {!s.current ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revokeSession.isPending}
                    onClick={() => revokeSession.mutate(s.id)}
                  >
                    Sign out
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No other active sessions.</p>
        )}
        <Button variant="outline" onClick={() => setLogoutAllOpen(true)}>
          Log out of all devices
        </Button>
      </Section>

      <Section
        title="Your data"
        description="Download a copy of the personal data we hold, or permanently close your account."
      >
        <Button
          variant="outline"
          disabled={exportData.isPending}
          onClick={() => exportData.mutate()}
        >
          {exportData.isPending ? "Preparing…" : "Download my data"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setDeleteBlockers([]);
            setDeleteOpen(true);
          }}
        >
          Delete my account
        </Button>
      </Section>

      <ConfirmDialog
        open={logoutAllOpen}
        onClose={() => setLogoutAllOpen(false)}
        onConfirm={() => logoutAll.mutate()}
        busy={logoutAll.isPending}
        title="Log out of all devices?"
        description="You'll be signed out here too and need to log in again everywhere."
        confirmLabel="Log out everywhere"
        destructive
      />

      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleteAccount.isPending) setDeleteOpen(false);
        }}
        title="Delete your account?"
        footer={
          <DialogActions>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={deleteAccount.isPending}
              onClick={() => setDeleteOpen(false)}
            >
              Keep account
            </Button>
            <Button
              type="button"
              className="flex-1"
              variant="outline"
              disabled={
                deleteAccount.isPending ||
                (me?.hasPassword ? !deletePassword : deleteCode.trim().length !== 6)
              }
              onClick={() => deleteAccount.mutate()}
            >
              Delete permanently
            </Button>
          </DialogActions>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-muted">
            This removes your listings and personal details and signs you out everywhere. It
            can&apos;t be undone. Past orders stay visible to the other person without your
            details.
          </p>
          {me?.hasPassword ? (
            <Input
              label="Confirm with your password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          ) : (
            <>
              {!me?.phone ? (
                <p className="text-sm text-muted">
                  To confirm it&apos;s you, first add a password under{" "}
                  <Link href="/forgot-password" className="text-primary">
                    Set a password
                  </Link>
                  , then come back here.
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                disabled={requestDeleteCode.isPending || !me?.phone}
                onClick={() => requestDeleteCode.mutate()}
              >
                Send me a confirmation code
              </Button>
              <Input
                label="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
              />
            </>
          )}
          {deleteBlockers.length ? (
            <div className="rounded-card border border-card-border bg-accent-soft/40 p-3 text-sm">
              <p className="font-medium">You can&apos;t delete your account yet:</p>
              <ul className="mt-1 list-disc pl-5 text-muted">
                {deleteBlockers.includes("OPEN_ORDERS") ? (
                  <li>
                    You have orders in progress. <Link href="/orders" className="text-primary">View orders</Link>
                  </li>
                ) : null}
                {deleteBlockers.includes("WALLET_BALANCE") ? (
                  <li>
                    Your wallet still has a balance. <Link href="/profile/wallet" className="text-primary">Withdraw it</Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}
