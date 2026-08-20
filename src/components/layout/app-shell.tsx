import type { ReactNode } from "react";
import { BottomNav } from "@/components/nav/bottom-nav";
import { SiteFooter } from "@/components/nav/site-footer";
import { TopAppBar } from "@/components/nav/top-app-bar";

export function AppShell({
  children,
  showBottomNav = true,
  showFooter = true,
}: {
  children: ReactNode;
  showBottomNav?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 lg:px-8 py-4 pb-24 md:pb-8">
        {children}
      </main>
      {showFooter ? <SiteFooter /> : null}
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
