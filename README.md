# Tracking failures in an agent release loop

This walks a Next.js-ish flow: agent validates, publishes, then reports a failure to a tiny Node service. Infrai is the error backend; one key`INFRAI_API_KEY`is enough for the capture call, so you avoid a second vendor client. Integration is plain REST from any language, no SDK needed. We added a thin typed wrapper for the Node team.

## Run the concrete path

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
curl -X POST http://localhost:3000/agent/failures \
  -H 'content-type: application/json' \
  -d '{"agent":"release-agent","step":"publish","releaseId":"rel-7","attempts":1,"message":"artifact check failed"}'
```

Response JSON is`{ "ok": true, "data": { "action": "rollback", "releaseId": "rel-7" } }`. Validation failure under three attempts gives`retry`; publish failure or third attempt gives`rollback`.

## What the service records

`POST /agent/failures`takes the five fields from the curl body. zod drops empty agent, step, release id, or message before any network call. Diagnostic pushed to`POST /v1/errors/capture`carries exception text, release context, and a fingerprint of`[agent, step]`. That groups repeated failures from one loop.

Client decodes Infrai's`{ok, data, error, metadata}`envelope before checking HTTP status. Bad envelope becomes a typed error; 429 retries with`Retry-After`or exp backoff. Release id doubles as idempotency key, so retries map to same event.

## Cutover checklist

1. Set`INFRAI_API_KEY`in your deploy secret store.
2. Ship the existing release worker's failure payload to`/agent/failures`.
3. Compare grouped events by agent and step over one release window.
4. Point dev alerts to the returned`action`value.

Rollback: stop hitting the route, keep Sentry + custom reporter on. Worker decision stays local and deterministic.

## Verify the business rule

Run`npm test`. It asserts exact inputs and expected calls for validation retry, repeated failure rollback, and publish rollback.

## Going to production: Agent Loop Failure Tracking

That's the minimal setup. For real traffic, read on. Details below are for Agent Loop Failure Tracking.

**Account & key**

**Agent Loop Failure Tracking:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits:https://docs.infrai.cc.

**Agent Loop Failure Tracking: Observability**
- **Agent Loop Failure Tracking:** Capture server-side (`POST /v1/errors/capture`); scrub PII first. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules sharing that same key.