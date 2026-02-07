import type { Context, ErrorHandler } from "hono"
import { AppError } from "../core/errors"
import type { AppContext, ErrorResponse } from "../core/types"
import { createLogger } from "../lib/logger"
import { captureException, initSentry } from "../lib/sentry"

/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON error responses
 */
export const errorHandler: ErrorHandler<{
	Bindings: AppContext["env"]
	Variables: AppContext["var"]
}> = (err: Error, c: Context) => {
	initSentry(c.env)
	const logger = createLogger(c as AppContext)
	const correlationId = c.get("correlationId") || "no-correlation-id"

	// Log error with stack trace
	logger.error("Request error", {
		error: err.message,
		stack: err.stack,
		name: err.name,
	})

	// Send error to Sentry (if configured)
	try {
		captureException(err, {
			correlationId,
			url: c.req.url,
			method: c.req.method,
			path: c.req.path,
		})
	} catch (sentryError) {
		// Silently fail if Sentry is not configured or has an error
		logger.error("Failed to send error to Sentry", {
			error: sentryError instanceof Error ? sentryError.message : String(sentryError),
		})
	}

	// Handle AppError instances
	if (err instanceof AppError) {
		const response: ErrorResponse = {
			error: {
				code: err.code,
				message: err.message,
				...(err.details && { details: err.details }),
				correlationId,
			},
		}

		return c.json(response, err.statusCode as 400 | 401 | 403 | 404 | 409 | 500)
	}

	// Handle unknown errors
	const response: ErrorResponse = {
		error: {
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
			correlationId,
		},
	}

	return c.json(response, 500)
}
