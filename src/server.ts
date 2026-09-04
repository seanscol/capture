/**
 * Local HTTP server: `npm run dev`. Not used in production — Vercel serves
 * api/parse.ts. This exists so the endpoint can be exercised over real HTTP
 * without deploying, and so the auth order can be checked the way a caller
 * would meet it.
 */
import { createServer } from "node:http";
import { loadEnvLocal } from "./env.ts";
import { handle } from "./handler.ts";
import { liveModel } from "./model.ts";

loadEnvLocal();

const port = Number(process.env.PORT ?? 3100);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);

  const { status, body } = await handle(
    {
      method: req.method ?? "GET",
      headers: req.headers as Record<string, string | undefined>,
      body: Buffer.concat(chunks).toString("utf8"),
    },
    { model: liveModel(), token: process.env.CAPTURE_TOKEN }
  );

  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}).listen(port, () => {
  // The token is not printed. Read it from .env.local if you need it.
  console.log(`capture listening on http://localhost:${port}/api/parse`);
});
