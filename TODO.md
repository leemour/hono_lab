# TODO Later

## High ROI (do these early)

### 1) Alerts (not just logs)

Logs are useless at 3am unless something pings you.

* **Error rate** alert (5xx > X/min)
* **Latency** alert (p95 > X ms)
* **Queue backlog** alert (if you use Queues)
  If Cloudflare-native alerting isn’t enough for your taste, use Sentry alerts or your APM’s alerting.

### 2) Source maps + release tracking

Without source maps your stack traces are garbage.

* Upload sourcemaps on deploy (Sentry makes this painless)
* Tag releases (git SHA) so you know “this started after deploy X”

### 3) Request IDs / Correlation IDs end-to-end

You already planned correlation IDs—make it *real*:

* accept `x-correlation-id` from clients
* propagate it to downstream `fetch()` calls
* include it in every log and error event

### 4) Rate limiting / abuse protection

Workers are exposed to the internet; you will get scraped and probed.

* Basic per-IP rate limit for sensitive routes (`/auth/*`, `/webhooks/*`)
* For real: use **Durable Objects** or KV-based counters, or Cloudflare WAF rules
  Keep it simple: protect the obvious first.

### 5) Health checks that actually mean something

Not just “returns 200”.

* check D1 connectivity (simple `SELECT 1`)
* check KV/R2 access if you depend on them
  Expose: `/v1/health` (light) and `/v1/health/deep` (heavy; internal only).

## Medium ROI (add when the app becomes real)


### 7) Dead-letter / retry strategy for webhooks & jobs

Webhooks will fail. Plan for it:

* queue message retries
* dead-letter queue or D1 “failed_jobs” table
* admin endpoint to reprocess

<!-- ### 8) Feature flags

Even “poor man’s feature flags” saves releases:

* KV/DB-stored flags per env
* enable/disable risky features instantly -->

<!-- ### 9) Request/response logging **sampling**

Full logging is expensive/noisy.

* log 100% errors
* sample 1–5% of success
* always log slow requests (> N ms) -->

### 10) Security headers + CORS discipline

* strict CORS for your SPA domain only
* security headers for public endpoints
* validate content-type for JSON endpoints

## Later / “grown-up” stack (when you have money or complexity)

<!-- ### 11) OpenTelemetry tracing

If you end up with multiple services:

* OTEL spans per request
* trace IDs across Worker → DB/API calls
  Cloudflare supports OTEL export paths; APMs shine here. -->

<!-- ### 12) Metrics you actually care about (business)

Technical metrics don’t tell you product health.
Track counters like:

* signups
* webhook deliveries success/fail
* task executions
* billing events
  You can ship these as events to your analytics/warehouse. -->

### 13) Secrets management & rotation

* keep all secrets in Workers bindings
* plan rotation for webhook secrets / JWT keys

<!-- ### 14) Backups / data export plan

D1 is managed, but you still want:

* periodic exports
* ability to move to Postgres later if needed -->

---

## My “small team, sane defaults” checklist

If you want one tight list:

**Now**

* structured JSON logs
* correlation ID propagation
* Sentry + sourcemaps + release tags
* basic error/latency alerts
* deep health endpoint

**Soon**

* rate limiting on auth/webhooks
* audit log
* webhook retries + dead-letter

**Later**

* OTEL tracing
* feature flags
* business metrics/events

If you tell me your usage pattern (webhooks-heavy? mostly interactive API for SPA? expected RPS?), I can prioritize this into a 2–3 sprint plan and suggest exactly which parts to implement inside Workers vs offload to third parties.
