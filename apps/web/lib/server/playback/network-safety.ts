import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface SafeNetworkTarget { url: URL; address: string; family: 4 | 6 }

function ipv4Number(address: string): number {
  return address.split(".").reduce((value, part) => (value * 256 + Number(part)) >>> 0, 0);
}

function inV4Range(value: number, base: number, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (value & mask) === (base & mask);
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) {
    const value = ipv4Number(address);
    const denied: Array<[string, number]> = [
      ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
      ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
      ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
      ["224.0.0.0", 4], ["240.0.0.0", 4],
    ];
    return !denied.some(([base, bits]) => inV4Range(value, ipv4Number(base), bits));
  }
  if (family === 6) {
    const normalized = address.toLowerCase();
    if (normalized.startsWith("::ffff:")) return isPublicIpAddress(normalized.slice(7));
    if (normalized === "::" || normalized === "::1") return false;
    const first = Number.parseInt(normalized.split(":")[0] || "0", 16);
    if ((first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80 || (first & 0xff00) === 0xff00) return false;
    if (normalized.startsWith("2001:db8:")) return false;
    return true;
  }
  return false;
}

export async function validateNetworkTarget(value: string): Promise<SafeNetworkTarget> {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Malformed upstream URL"); }
  if (url.protocol !== "https:") throw new Error("Only HTTPS upstream resources are allowed");
  if (url.username || url.password) throw new Error("Credentialed upstream URLs are forbidden");
  if (!url.hostname || url.hostname.toLowerCase() === "localhost") throw new Error("Unsafe upstream hostname");
  const records = await lookup(url.hostname, { all: true, verbatim: true });
  if (records.length === 0 || records.some((record) => !isPublicIpAddress(record.address))) throw new Error("Unsafe upstream address");
  const record = records[0];
  return { url, address: record.address, family: record.family as 4 | 6 };
}
