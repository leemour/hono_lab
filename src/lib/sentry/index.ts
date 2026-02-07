type SentryEnv = {
	SENTRY_DSN?: string
	SENTRY_ENVIRONMENT?: string
	SENTRY_RELEASE?: string
}

type SentryConfig = {
	endpoint?: string
	key?: string
	environment?: string
	release?: string
}

let config: SentryConfig = {}

function parseDsn(dsn: string): { endpoint: string; key: string } | null {
	try {
		const url = new URL(dsn)
		const key = url.username
		const projectId = url.pathname.replace(/^\/+/, "").split("/")[0]
		if (!key || !projectId) return null
		return {
			endpoint: `${url.protocol}//${url.host}/api/${projectId}/store/`,
			key,
		}
	} catch {
		return null
	}
}

function generateEventId(): string {
	return crypto.randomUUID()
}

function sendEvent(event: Record<string, unknown>) {
	if (!config.endpoint || !config.key) return
	const url = `${config.endpoint}?sentry_key=${encodeURIComponent(
		config.key
	)}&sentry_version=7&sentry_client=hono-lab`
	void fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(event),
	})
}

/**
 * Initialize Sentry using direct HTTP requests (no SDK).
 */
export function initSentry(env: SentryEnv) {
	if (!env.SENTRY_DSN) {
		config = {}
		return
	}

	const parsed = parseDsn(env.SENTRY_DSN)
	if (!parsed) {
		config = {}
		return
	}

	config = {
		...parsed,
		environment: env.SENTRY_ENVIRONMENT || "development",
		release: env.SENTRY_RELEASE,
	}
}

/**
 * Capture an exception in Sentry
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
	if (!config.endpoint || !config.key) return
	const event = {
		event_id: generateEventId(),
		timestamp: new Date().toISOString(),
		platform: "javascript",
		level: "error",
		environment: config.environment,
		release: config.release,
		exception: {
			values: [
				{
					type: error.name || "Error",
					value: error.message,
				},
			],
		},
		extra: {
			...context,
			stack: error.stack,
		},
	}

	sendEvent(event)
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
	if (!config.endpoint || !config.key) return
	const event = {
		event_id: generateEventId(),
		timestamp: new Date().toISOString(),
		platform: "javascript",
		level,
		environment: config.environment,
		release: config.release,
		message,
	}

	sendEvent(event)
}
