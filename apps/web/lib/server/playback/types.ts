export type PlaybackResourceKind = "root-manifest" | "manifest" | "media" | "key";

export interface PlaybackCapability {
  version: 1;
  channelId: string;
  sourceId: string;
  resourceKind: PlaybackResourceKind;
  resourceUrl?: string;
  expiresAt: number;
}

export interface GatewayResponse {
  body: BodyInit | null;
  headers: Headers;
  status: number;
}
