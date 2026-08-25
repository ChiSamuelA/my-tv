import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { MobileTabBar } from "./MobileTabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader />
      {children}
      <MobileTabBar />
    </>
  );
}
