"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const sideItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-card-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="relative mx-auto flex max-w-lg items-end justify-between px-1 pt-1">
        {sideItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 1.75}
                  fill={active ? "currentColor" : "none"}
                />
                {label}
              </Link>
            </li>
          );
        })}

        <li className="relative flex w-[72px] shrink-0 justify-center">
          <Link
            href="/sell"
            aria-label="Sell"
            className={cn(
              "absolute -top-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-surface shadow-card transition-transform active:scale-95",
              pathname.startsWith("/sell") && "ring-2 ring-accent-soft ring-offset-2",
            )}
          >
            <Plus className="h-8 w-8" strokeWidth={2.5} />
          </Link>
          <span className="mt-12 text-[10px] font-medium text-primary">Sell</span>
        </li>

        {sideItems.slice(2).map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted",
                )}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={active ? 2.4 : 1.75}
                  fill={active ? "currentColor" : "none"}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
