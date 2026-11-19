import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help",
  description: "Help and guidance for buying and selling on Repose.",
};

export default function HelpPage() {
  return (
    <article className="mx-auto max-w-2xl py-4">
      <h1 className="text-2xl font-semibold text-text">Help</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Repose is a peer-to-peer marketplace for pre-loved fashion in the UAE.
        Browse freely; sign in only when you save, message a seller, or check
        out.
      </p>

      <section id="selling" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-text">Selling guide</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Start a listing and add at least one clear photo.</li>
          <li>Choose category, condition, and price in AED.</li>
          <li>Review and publish — brand and description are optional.</li>
          <li>Ship when an order is paid; buyers confirm delivery.</li>
        </ol>
        <Link
          href="/sell"
          className="mt-4 inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
        >
          Start selling →
        </Link>
      </section>

      <section id="conditions" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-text">Item conditions</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="font-medium text-text">New with tags</span> —
            Unworn, original tags attached.
          </li>
          <li>
            <span className="font-medium text-text">New without tags</span> —
            Unworn, tags removed.
          </li>
          <li>
            <span className="font-medium text-text">Very good</span> — Light wear,
            no major flaws.
          </li>
          <li>
            <span className="font-medium text-text">Good</span> — Visible wear,
            still fully wearable.
          </li>
          <li>
            <span className="font-medium text-text">Satisfactory</span> —
            Heavily worn or minor repairs; defects disclosed.
          </li>
        </ul>
      </section>

      <section id="safety" className="mt-10 scroll-mt-24">
        <h2 className="text-lg font-semibold text-text">Safety</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Pay only through Repose checkout. Never send money off-platform. Report
          suspicious listings or messages from the listing or conversation. Meet
          or ship using the flow your order provides — never share OTPs or
          payment details in chat.
        </p>
      </section>

      <p className="mt-10 text-sm text-muted">
        Need more help?{" "}
        <a href="mailto:hello@repose.ae" className="font-medium text-primary">
          hello@repose.ae
        </a>
      </p>
    </article>
  );
}
