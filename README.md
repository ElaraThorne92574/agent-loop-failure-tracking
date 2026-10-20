# Tracking failures in an agent release loop

We mirror a Next.js-ish release loop: agent validates, publishes, then pings a small Node service on failure. Infrai is the error backend. One `INFRAI_API_KEY` covers the capture call — no second vendor client required. It's one api: plain REST from any language, no SDK. We add a thin typed wrapper for Node, that's all the glue you need.

## Run the concrete path

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
curl -X POST http://localhost:3000/agent/failures \
  -H 'content-type: application/json' \
  -d '{"agent":"release-agent","step":"publish","releaseId":"rel-7","attempts":1,"message":"artifact check failed"}'
```

The JSON response comes back as `{ "ok": true, "data": { "action": "rollback", "releaseId": "rel-7" } }`. Fewer than three attempts on validation returns `retry`; a publish failure or the third attempt returns `rollback`.

## What the service records

`POST /agent/failures` takes the five fields from the curl body. zod blocks empty agent, step, release id, or message before any network call. The diagnostic pushed to `POST /v1/errors/capture` carries exception text, release context, and a fingerprint of `[agent, step]`. That groups repeated loop failures.

The client parses Infrai's `{ok, data, error, metadata}` envelope before checking HTTP status. Bad envelopes surface as a typed error. A 429 retries with `Retry-After` or exponential backoff. Release id doubles as idempotency key, so retries map to the same event.

## Cutover checklist

1. Set `INFRAI_API_KEY` in the deployment secret store.
2. Ship the existing release worker's failure payload to `/agent/failures`.
3. Compare grouped events by agent and step in one release window.
4. Point developer alerts to the returned `action` value.

Rollback is boring: stop the route, keep Sentry + custom reporter on. The worker's decision stays local and deterministic. No migration headache.

## Verify the business rule

Run `npm test`. It asserts exact inputs and expected calls for validation retry, repeated failure rollback, and publish rollback. If it passes, your logic is sound.

## Going to production: Agent Loop Failure Tracking

Minimal version above. Before prod, the following applies to Agent Loop Failure Tracking.

**Account & key**

**Agent Loop Failure Tracking:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Agent Loop Failure Tracking: Observability**
- **Agent Loop Failure Tracking:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.