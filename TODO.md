Act as a strict staff-level engineer and tech lead. Your job: design and implement a production-ready Cloudflare Workers + Hono template repo, using pnpm, TypeScript, and web-standards-first approach. You MUST create your own phased plan and execute step-by-step, but you must follow the rules below.

Project context:
- Repo already created via `npm create cloudflare@latest`, Framework -> Hono.
- We want to switch to pnpm (and keep it consistent).
- Target runtime: Cloudflare Workers.
- Style target: “FastAPI Lab”-like: clean structure, robust defaults, tests, CI, logging, middleware, error handling, docs.

HARD RULES (do not break):
1) No “node server assumptions”: do not rely on fs/net/tls, child_process, long-lived connections, background daemons. Use Web APIs + Cloudflare bindings (D1/KV/R2/Queues/Durable Objects) where needed.
2) Avoid nodejs_compat unless:
   - you can justify it in one sentence, AND
   - it is required by a specific dependency, AND
   - you propose an alternative without nodejs_compat.
3) Prefer minimal, high-quality dependencies. Every new dependency must be justified briefly (what problem it solves). Avoid “big frameworks”.
4) Code must be TypeScript, strict type checking, and “edge-friendly”.
5) Implement incrementally with small, reviewable commits:
   - each commit: single purpose
   - commit message: conventional commits (feat/fix/chore/test/docs/refactor)
   - never mix formatting-only changes with functional changes unless necessary
6) Provide acceptance criteria for each phase and verify locally (commands + expected output).
7) Do not ask me questions unless absolutely necessary; make reasonable assumptions and proceed.

QUALITY BAR:
- Clean project structure under src/
- API versioning (/v1)
- Consistent JSON error responses
- Structured JSON logging with correlation IDs
- Middleware for request logging + correlation propagation
- Testing in Workers-like environment (vitest + Cloudflare pool or best equivalent)
- Linting/formatting (choose best default: eslint or biome; justify)
- Typecheck script
- Local dev works with wrangler
- Documentation: README with quickstart, commands, and conventions

FEATURE SET (build toward these; order is up to you):
A) Core skeleton
- app composition, router modules, env config typing
- /v1/health endpoint
- notFound + global error handler with AppError

B) Logging & tracing basics
- structured logs (JSON) via console
- correlation-id middleware (request header → context → response header)
- request/response timing logs
- optional: sampling or log-level control via env

C) D1 + ORM + migrations
- Add Cloudflare D1 binding in wrangler
- ORM recommendation: Drizzle
- Schema + migrations + minimal repository/query patterns
- Example entity and endpoints (e.g., webhooks inbox)

D) Webhook inbox + async processing
- Endpoint to receive arbitrary webhooks (store raw + headers + timestamp)
- List/retrieve endpoints with pagination
- Add Queues integration (receive → enqueue → process) as a later phase
- Webhook signature verification example using WebCrypto (optional)

E) Auth (later phase)
- JWT-based auth (edge-friendly)
- Middleware + token issuing endpoint for dev/testing
- Keep simple, but correct

F) CI (later phase)
- GitHub Actions: install, lint, typecheck, test
- cache pnpm store
- fail on errors

G) Optional niceties
- OpenAPI export (only if you can do it cleanly on Workers)
- Rate limiting (Durable Objects / KV-based) if justified
- Basic metrics hooks (if minimal)

SETUP REQUIREMENTS (tell me and implement):
- Convert repo to pnpm:
  - remove package-lock, create pnpm-lock
  - update scripts accordingly
  - ensure wrangler commands still work
- Provide “what to install locally” list:
  - Node version recommendation
  - pnpm installation
  - wrangler login notes (if needed)
- Provide “one-command” local dev and “one-command” tests

DELIVERABLES FOR EACH PHASE:
1) A short phase description (goals)
2) The exact file changes (paths)
3) The exact commands to run
4) How to verify it works
5) What’s next

NOW DO THIS:
1) Inspect current repository files (package.json, wrangler.toml, src/*, tsconfig, etc.).
2) Propose a phased plan (6–10 phases) that reaches the full feature set above.
3) Execute Phase 1 immediately in code:
   - pnpm conversion
   - core skeleton with /v1/health
   - correlation id middleware
   - request logging middleware
   - global error handling + notFound
   - tests framework wired and one test for /v1/health
   - README quickstart with pnpm commands
4) After Phase 1, show me:
   - commands to run
   - expected curl output
   - how to run tests
5) Stop and wait for my “go” to proceed to Phase 2.
