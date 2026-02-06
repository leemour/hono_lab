import type { AppContext } from "../../core/types"

export type LogLevel = "silent" | "debug" | "info" | "warn" | "error"

export interface LogMetadata {
	[key: string]: unknown
}

export interface Logger {
	debug(message: string, metadata?: LogMetadata): void
	info(message: string, metadata?: LogMetadata): void
	warn(message: string, metadata?: LogMetadata): void
	error(message: string, metadata?: LogMetadata): void
}

/**
 * Structured JSON logger for edge environments
 */
class StructuredLogger implements Logger {
	constructor(
		private correlationId: string,
		private logLevel: LogLevel = "info"
	) {}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ["silent", "debug", "info", "warn", "error"]
		const currentLevelIndex = levels.indexOf(this.logLevel)
		const requestedLevelIndex = levels.indexOf(level)
		return requestedLevelIndex >= currentLevelIndex && this.logLevel !== "silent"
	}

	private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
		if (!this.shouldLog(level)) return

		const logEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			correlationId: this.correlationId,
			...(metadata && { metadata }),
		}

		// Use appropriate console method
		switch (level) {
			case "debug":
				console.debug(JSON.stringify(logEntry))
				break
			case "info":
				console.info(JSON.stringify(logEntry))
				break
			case "warn":
				console.warn(JSON.stringify(logEntry))
				break
			case "error":
				console.error(JSON.stringify(logEntry))
				break
		}
	}

	debug(message: string, metadata?: LogMetadata): void {
		this.log("debug", message, metadata)
	}

	info(message: string, metadata?: LogMetadata): void {
		this.log("info", message, metadata)
	}

	warn(message: string, metadata?: LogMetadata): void {
		this.log("warn", message, metadata)
	}

	error(message: string, metadata?: LogMetadata): void {
		this.log("error", message, metadata)
	}
}

/**
 * Create a logger instance with correlation ID from context
 */
export function createLogger(c: AppContext): Logger {
	const correlationId = c.get("correlationId") || "no-correlation-id"
	const logLevel = (c.env.LOG_LEVEL || "info") as LogLevel
	return new StructuredLogger(correlationId, logLevel)
}
