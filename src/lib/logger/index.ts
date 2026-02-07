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
		private logLevel: LogLevel = "info",
		private environment: "development" | "test" | "production" = "production"
	) {}

	private shouldLog(level: LogLevel): boolean {
		const levels: LogLevel[] = ["silent", "debug", "info", "warn", "error"]
		const currentLevelIndex = levels.indexOf(this.logLevel)
		const requestedLevelIndex = levels.indexOf(level)
		return requestedLevelIndex >= currentLevelIndex && this.logLevel !== "silent"
	}

	private log(level: LogLevel, message: string, metadata?: LogMetadata): void {
		if (!this.shouldLog(level)) return

		const timestamp = new Date().toISOString()
		const correlationId = this.correlationId

		if (this.environment !== "production") {
			const line = formatKeyValueLine(level, message, {
				timestamp,
				correlation_id: correlationId,
				...(metadata || {}),
			})
			writeConsole(level, line)
			return
		}

		const logEntry = {
			timestamp,
			level,
			message,
			correlation_id: correlationId,
			...(metadata && { metadata }),
		}

		// Use appropriate console method
		writeConsole(level, JSON.stringify(logEntry))
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
	const environment = c.env.ENVIRONMENT || "production"
	return new StructuredLogger(correlationId, logLevel, environment)
}

function writeConsole(level: LogLevel, line: string): void {
	const output = line
	switch (level) {
		case "debug":
			console.debug(output)
			break
		case "info":
			console.info(output)
			break
		case "warn":
			console.warn(output)
			break
		case "error":
			console.error(output)
			break
	}
}

function formatKeyValueLine(
	level: LogLevel,
	message: string,
	fields: Record<string, unknown>
): string {
	const parts: string[] = [message]
	const orderedFields: Record<string, unknown> = {
		timestamp: fields.timestamp,
		level,
		correlation_id: fields.correlation_id,
	}

	for (const [key, value] of Object.entries(fields)) {
		if (key in orderedFields) continue
		orderedFields[key] = value
	}

	for (const [key, value] of Object.entries(orderedFields)) {
		if (value === undefined) continue
		const formattedValue = formatValue(value)
		parts.push(`${colorKey(key)}=${colorValue(formattedValue, level)}`)
	}

	return parts.join(" ")
}

function formatValue(value: unknown): string {
	if (typeof value === "string") {
		if (value === "") return '""'
		if (/\s|=/.test(value)) return JSON.stringify(value)
		return value
	}
	if (typeof value === "number" || typeof value === "boolean" || value === null) {
		return String(value)
	}
	return JSON.stringify(value)
}

function colorKey(value: string): string {
	return `\x1b[2m${value}\x1b[0m`
}

function colorValue(value: string, level: LogLevel): string {
	const color = levelColor(level)
	return `${color}${value}\x1b[0m`
}

function levelColor(level: LogLevel): string {
	switch (level) {
		case "debug":
			return "\x1b[35m"
		case "info":
			return "\x1b[36m"
		case "warn":
			return "\x1b[33m"
		case "error":
			return "\x1b[31m"
		default:
			return "\x1b[0m"
	}
}
