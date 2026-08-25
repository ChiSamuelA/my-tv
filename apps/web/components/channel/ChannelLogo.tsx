"use client";

import { useState } from "react";

function monogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  return name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "TV";
}

export function ChannelLogo({ logo, name, eager = false }: { logo: string | null; name: string; eager?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const canShowImage = Boolean(logo && failedSource !== logo);

  return (
    <span className="channel-logo">
      <span aria-hidden={canShowImage} className="channel-monogram">{monogram(name)}</span>
      {canShowImage ? (
        // Remote IPTV logos span many hosts; a native image avoids an unsafe wildcard image proxy configuration.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`${name} logo`}
          decoding="async"
          loading={eager ? "eager" : "lazy"}
          onError={() => setFailedSource(logo)}
          referrerPolicy="no-referrer"
          src={logo ?? undefined}
        />
      ) : null}
    </span>
  );
}
