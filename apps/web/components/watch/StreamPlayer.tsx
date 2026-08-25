"use client";

import { useEffect, useRef, useState } from "react";
import type Hls from "hls.js";
import type { SelectedPlaybackSource } from "@/lib/server/watch";

type RuntimeState = "loading" | "ready" | "playing" | "error" | "unsupported";

interface StreamPlayerProps {
  channelName: string;
  source: SelectedPlaybackSource;
}

export function StreamPlayer({ channelName, source }: StreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let networkRecoveries = 0;
    let mediaRecoveries = 0;

    const initialize = async () => {
      if (window.location.protocol === "https:" && !source.isSecure) {
        if (!cancelled) setRuntimeState("unsupported");
        return;
      }
      if (source.kind === "direct") {
        video.src = source.url;
        video.load();
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source.url;
        video.load();
        return;
      }
      const { default: HlsPlayer } = await import("hls.js");
      if (cancelled) return;
      if (!HlsPlayer.isSupported()) {
        setRuntimeState("unsupported");
        return;
      }
      const hls = new HlsPlayer({ enableWorker: true });
      hlsRef.current = hls;
      hls.on(HlsPlayer.Events.ERROR, (_event, data) => {
        if (!data.fatal || cancelled) return;
        if (data.type === HlsPlayer.ErrorTypes.NETWORK_ERROR && networkRecoveries < 1) {
          networkRecoveries += 1;
          setRuntimeState("loading");
          hls.startLoad();
          return;
        }
        if (data.type === HlsPlayer.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 1) {
          mediaRecoveries += 1;
          setRuntimeState("loading");
          hls.recoverMediaError();
          return;
        }
        setRuntimeState("error");
      });
      hls.attachMedia(video);
      hls.on(HlsPlayer.Events.MEDIA_ATTACHED, () => {
        if (!cancelled) hls.loadSource(source.url);
      });
    };

    void initialize();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.removeAttribute("src");
      video.load();
    };
  }, [attempt, source]);

  const retry = () => {
    setRuntimeState("loading");
    setAttempt((value) => value + 1);
  };

  return (
    <div className="stream-player">
      <video
        aria-label={`${channelName} playback`}
        controls
        onCanPlay={() => setRuntimeState("ready")}
        onError={() => setRuntimeState("error")}
        onLoadStart={() => setRuntimeState("loading")}
        onPlaying={() => setRuntimeState("playing")}
        playsInline
        preload="metadata"
        ref={videoRef}
      />
      {runtimeState === "loading" ? <div className="player-runtime-state"><span aria-hidden="true" className="player-spinner" /><h2>Loading channel…</h2><p>Connecting to the selected source.</p></div> : null}
      {runtimeState === "error" ? <div className="player-runtime-state"><span aria-hidden="true" className="runtime-icon error">!</span><h2>Unable to play this source</h2><p>The stream may be unavailable or blocked by its server.</p><button className="player-retry" onClick={retry} type="button">Retry</button></div> : null}
      {runtimeState === "unsupported" ? <div className="player-runtime-state"><span aria-hidden="true" className="runtime-icon warning">!</span><h2>{source.isSecure ? "This source is not supported by your browser" : "This source uses an insecure connection"}</h2><p>{source.isSecure ? "Try another source for this channel." : "HTTP media may be blocked when the app uses HTTPS."}</p></div> : null}
      <span className="visually-hidden" aria-live="polite">Playback state: {runtimeState}</span>
    </div>
  );
}
