import type { ReactNode } from "react";
import { BottomNav } from "@/components/nav/bottom-nav";
import { TopAppBar } from "@/components/nav/top-app-bar";

export function AppShell({
  children,
  showBottomNav = true,
}: {
  children: ReactNode;
  showBottomNav?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopAppBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-screen py-4 pb-24 md:pb-8">
        {children}
      </main>
      {showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
