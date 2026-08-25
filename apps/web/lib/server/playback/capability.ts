import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { PlaybackCapability } from "./types";

const VERSION = "v1";
export const CAPABILITY_LIFETIME_SECONDS = 2 * 60 * 60;

function key(secret = process.env.PLAYBACK_GATEWAY_SECRET): Buffer {
  if (!secret || secret.length < 32) throw new Error("PLAYBACK_GATEWAY_SECRET must contain at least 32 characters");
  return createHash("sha256").update(secret).digest();
}

export function createPlaybackCapability(
  input: Omit<PlaybackCapability, "version" | "expiresAt"> & { expiresAt?: number },
  options: { secret?: string; now?: number } = {},
): string {
  const now = options.now ?? Date.now();
  const payload: PlaybackCapability = {
    ...input,
    version: 1,
    expiresAt: input.expiresAt ?? now + CAPABILITY_LIFETIME_SECONDS * 1000,
  };
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(options.secret), nonce);
  cipher.setAAD(Buffer.from(VERSION));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [VERSION, nonce.toString("base64url"), encrypted.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
}

export function verifyPlaybackCapability(
  token: string,
  options: { secret?: string; now?: number } = {},
): PlaybackCapability {
  try {
    const [version, nonceValue, encryptedValue, tagValue, extra] = token.split(".");
    if (version !== VERSION || !nonceValue || !encryptedValue || !tagValue || extra) throw new Error("Malformed capability");
    const decipher = createDecipheriv("aes-256-gcm", key(options.secret), Buffer.from(nonceValue, "base64url"));
    decipher.setAAD(Buffer.from(VERSION));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const raw = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
    const value = JSON.parse(raw) as Partial<PlaybackCapability>;
    if (value.version !== 1 || typeof value.channelId !== "string" || !value.channelId || typeof value.sourceId !== "string" || !value.sourceId) throw new Error("Malformed capability payload");
    if (!["root-manifest", "manifest", "media", "key"].includes(value.resourceKind ?? "")) throw new Error("Malformed resource kind");
    if (typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt)) throw new Error("Malformed expiration");
    if ((options.now ?? Date.now()) >= value.expiresAt) throw new Error("Expired capability");
    if (value.resourceKind !== "root-manifest" && (typeof value.resourceUrl !== "string" || !value.resourceUrl)) throw new Error("Missing resource reference");
    if (value.resourceKind === "root-manifest" && value.resourceUrl !== undefined) throw new Error("Root capability cannot contain a resource URL");
    return value as PlaybackCapability;
  } catch (error) {
    if (error instanceof Error && ["Expired capability", "PLAYBACK_GATEWAY_SECRET must contain at least 32 characters"].includes(error.message)) throw error;
    throw new Error("Invalid playback capability");
  }
}

export function gatewayPath(token: string): string {
  return `/api/playback/${encodeURIComponent(token)}`;
}
