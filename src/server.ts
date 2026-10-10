import { createServer } from "node:http";
import { recordFailure } from "./agent_failure_service.ts";

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/agent/failures") { response.writeHead(404).end(); return; }
  let body = "";
  for await (const chunk of request) body += chunk;
  try {
    const result = await recordFailure(JSON.parse(body));
    response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, data: result }));
  } catch (error) {
    const status = error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError") ? 400 : 502;
    response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: false, error: { message: (error as Error).message } }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("agent failure service listening"));
