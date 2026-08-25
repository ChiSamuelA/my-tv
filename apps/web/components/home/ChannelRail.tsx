"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function ChannelRail({ children, label }: { children: ReactNode; label: string }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanGoBack(rail.scrollLeft > 4);
    setCanGoForward(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateControls();
    window.addEventListener("resize", updateControls);
    return () => window.removeEventListener("resize", updateControls);
  }, [updateControls]);

  function scroll(direction: -1 | 1) {
    const rail = railRef.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * 0.82, behavior: "smooth" });
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const cards = [...event.currentTarget.querySelectorAll<HTMLElement>(".channel-card")];
    const current = cards.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    const next = event.key === "ArrowRight" ? current + 1 : current - 1;
    if (!cards[next]) return;
    event.preventDefault();
    cards[next].focus();
    cards[next].scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }

  return (
    <div className="rail-shell">
      <button aria-label={`Previous ${label} channels`} className="rail-button rail-previous" disabled={!canGoBack} onClick={() => scroll(-1)}>←</button>
      <div aria-label={label} className="channel-rail" onKeyDown={handleKeys} onScroll={updateControls} ref={railRef} role="list">{children}</div>
      <button aria-label={`Next ${label} channels`} className="rail-button rail-next" disabled={!canGoForward} onClick={() => scroll(1)}>→</button>
    </div>
  );
}
