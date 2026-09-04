/**
 * Vercel adapter. The endpoint is POST /api/parse.
 *
 * Thin on purpose: it reads the request, hands it to handle(), and writes the
 * result. Every decision lives in src/handler.ts, so the tests exercise the
 * same code the deployment runs.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { handle } from "../src/handler.ts";
import { liveModel } from "../src/model.ts";

export default async function parseEndpoint(req: IncomingMessage, res: ServerResponse) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);

  const { status, body } = await handle(
    {
      method: req.method ?? "GET",
      headers: req.headers as Record<string, string | undefined>,
      body: Buffer.concat(chunks).toString("utf8"),
    },
    // Read per request, never at module load, so a redeploy that changes the
    // variable takes effect and a missing one is a 401 rather than a crash at
    // import time (§5.2's "resolved per call, never at module load", same
    // reasoning applied to configuration).
    { model: liveModel(), token: process.env.CAPTURE_TOKEN }
  );

  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}
