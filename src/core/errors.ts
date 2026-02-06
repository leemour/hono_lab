/**
 * Base application error class
 */
export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number = 500,
		public readonly code: string = "INTERNAL_ERROR",
		public readonly details?: Record<string, unknown>
	) {
		super(message)
		this.name = this.constructor.name
		Error.captureStackTrace(this, this.constructor)
	}

	toJSON() {
		return {
			error: {
				code: this.code,
				message: this.message,
				...(this.details && { details: this.details }),
			},
		}
	}
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends AppError {
	constructor(message = "Resource not found", details?: Record<string, unknown>) {
		super(message, 404, "NOT_FOUND", details)
	}
}

/**
 * 400 Bad Request / Validation error
 */
export class ValidationError extends AppError {
	constructor(message = "Validation failed", details?: Record<string, unknown>) {
		super(message, 400, "VALIDATION_ERROR", details)
	}
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized", details?: Record<string, unknown>) {
		super(message, 401, "UNAUTHORIZED", details)
	}
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends AppError {
	constructor(message = "Forbidden", details?: Record<string, unknown>) {
		super(message, 403, "FORBIDDEN", details)
	}
}

/**
 * 409 Conflict error
 */
export class ConflictError extends AppError {
	constructor(message = "Resource conflict", details?: Record<string, unknown>) {
		super(message, 409, "CONFLICT", details)
	}
}
