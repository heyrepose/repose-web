import Link from "next/link";
import { Instagram } from "lucide-react";

const exploreLinks = [
  { href: "/category/women", label: "Women" },
  { href: "/category/men", label: "Men" },
  { href: "/category/shoes", label: "Shoes" },
  { href: "/category/bags", label: "Bags" },
  { href: "/category/accessories", label: "Accessories" },
] as const;

const sellLinks = [
  { href: "/sell", label: "Start Selling" },
  { href: "/help#selling", label: "Selling Guide" },
  { href: "/help#conditions", label: "Item Conditions" },
] as const;

const supportLinks = [
  { href: "/help", label: "Help" },
  { href: "/help#safety", label: "Safety" },
  { href: "mailto:hello@repose.ae", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
] as const;

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-surface">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-accent-soft/90 transition-colors hover:text-surface"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Spacious multi-column site footer — Deep Forest Green band. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-primary pb-24 text-surface md:pb-0">
      <div className="mx-auto w-full max-w-6xl px-screen py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link
              href="/"
              className="font-brand text-[1.85rem] leading-none text-surface"
            >
              Repose
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-accent-soft/90">
              Pre-loved fashion for the UAE. Peer-to-peer closets, curated
              pieces, and circular style you can trust.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Repose on Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface/30 text-surface transition-colors hover:border-surface hover:bg-surface/10"
              >
                <Instagram className="h-5 w-5" strokeWidth={1.75} />
              </a>
              <a
                href="https://x.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Repose on X"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface/30 text-surface transition-colors hover:border-surface hover:bg-surface/10"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-8 md:gap-6">
            <FooterLinkGroup title="Explore" links={exploreLinks} />
            <FooterLinkGroup title="Sell" links={sellLinks} />
            <FooterLinkGroup title="Support" links={supportLinks} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-surface/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-accent-soft/80">
            © {year} Repose. All rights reserved. AED marketplace · UAE
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-accent-soft/80">
            <Link href="/privacy" className="hover:text-surface">
              Privacy
            </Link>
            <Link href="/help#safety" className="hover:text-surface">
              Safety
            </Link>
            <a href="mailto:hello@repose.ae" className="hover:text-surface">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
