import { handleGatewayRequest } from "@/lib/server/playback/gateway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }): Promise<Response> {
  try {
    const { token } = await context.params;
    const result = await handleGatewayRequest(token, request);
    return new Response(result.body, { status: result.status, headers: result.headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    const classification = /capability|secret/i.test(detail) ? "capability" : /address|hostname|HTTPS upstream|redirect/i.test(detail) ? "network-safety" : /manifest|HLS|size limit/i.test(detail) ? "manifest" : /timed out/i.test(detail) ? "timeout" : "upstream";
    if (process.env.NODE_ENV === "development") console.error(`Playback gateway request failed: ${classification}`);
    return Response.json({ error: "Unable to retrieve this playback resource." }, { status: classification === "capability" ? 401 : 502, headers: { "Cache-Control": "no-store", ...(process.env.NODE_ENV === "development" ? { "X-Playback-Error": classification } : {}) } });
  }
}
