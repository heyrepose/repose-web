import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Repose handles personal data.",
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl py-4">
      <h1 className="text-2xl font-semibold text-text">Privacy</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Repose is built for trusted peer-to-peer fashion in the UAE. We collect
        only what is needed to run your account, listings, orders, chat, and
        payments — for example name, contact details, delivery addresses, and
        payment status from our payment provider.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        We do not sell your personal data. Sellers and buyers see the profile
        information required to complete a transaction. You can update profile
        details from Settings. For privacy requests, contact{" "}
        <a href="mailto:hello@repose.ae" className="font-medium text-primary">
          hello@repose.ae
        </a>
        .
      </p>
      <p className="mt-4 text-xs text-muted">
        This summary is for product clarity. Full legal terms will be published
        before public launch.
      </p>
    </article>
  );
}
