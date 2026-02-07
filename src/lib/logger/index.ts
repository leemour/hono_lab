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

		const timestamp = new Date()
		const correlationId = this.correlationId

		if (this.environment !== "production") {
			const line = formatKeyValueLine(message, level, {
				timestamp: formatShortTimestamp(timestamp),
				correlation_id: correlationId,
				...(metadata || {}),
			})
			writeConsole(level, line)
			return
		}

		const logEntry = {
			timestamp: timestamp.toISOString(),
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
	message: string,
	level: LogLevel,
	fields: Record<string, unknown>
): string {
	const prefixParts: string[] = []
	const timestamp = fields.timestamp
	const method = fields.method
	const status = fields.status
	const path = fields.path
	const note = typeof fields.note === "string" ? fields.note : undefined
	const durationValue = fields.duration

	if (typeof timestamp === "string") {
		prefixParts.push(colorDim(`${timestamp} ${levelEmoji(level)}`))
	}
	if (typeof method === "string") {
		prefixParts.push(` ${method}`)
	}
	if (typeof status === "number" || typeof status === "string") {
		prefixParts.push(colorStatus(String(status)))
	}
	if (typeof path === "string") {
		prefixParts.push(colorPath(path))
	}

	const parts: string[] = [prefixParts.join(" ") || message]
	if (note) {
		prefixParts.push(note)
	}
	const orderedFields: Record<string, unknown> = {
		correlation_id: fields.correlation_id,
	}

	for (const [key, value] of Object.entries(fields)) {
		if (key in orderedFields) continue
		if (
			key === "timestamp" ||
			key === "method" ||
			key === "status" ||
			key === "path" ||
			key === "note" ||
			key === "duration"
		) {
			continue
		}
		orderedFields[key] = value
	}

	for (const [key, value] of Object.entries(orderedFields)) {
		if (value === undefined) continue
		const formattedValue = formatValue(value)
		parts.push(`${colorKey(key)}=${colorValue(formattedValue, level)}`)
	}

	const duration = formatDuration(durationValue)
	if (duration) {
		parts.push(colorDim(`[${duration}]`))
	}

	return parts.join(" ")
}

function formatValue(value: unknown): string {
	if (typeof value === "string") {
		if (value === "") return "\"\""
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

function colorDim(value: string): string {
	return `\x1b[2m${value}\x1b[0m`
}

function colorStatus(value: string): string {
	const status = Number(value)
	if (Number.isNaN(status)) {
		return value
	}
	if (status >= 200 && status < 300) {
		return `\x1b[32m${status}\x1b[0m`
	}
	if (status >= 300 && status < 400) {
		return `\x1b[33m${status}\x1b[0m`
	}
	if (status >= 400 && status < 500) {
		return `\x1b[38;5;208m${status}\x1b[0m`
	}
	if (status >= 500 && status < 600) {
		return `\x1b[31m${status}\x1b[0m`
	}
	return value
}

function levelEmoji(level: LogLevel): string {
	switch (level) {
		case "debug":
			return "🧪"
		case "info":
			return "ℹ️"
		case "warn":
			return "⚠️"
		case "error":
			return "❌"
		default:
			return "•"
	}
}

function colorPath(value: string): string {
	return `\x1b[34m${value}\x1b[0m`
}

function formatDuration(value: unknown): string | undefined {
	if (typeof value === "number") {
		return `${Math.round(value)}ms`
	}
	if (typeof value === "string" && value.length > 0) {
		return value
	}
	return undefined
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

function formatShortTimestamp(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	const hours = String(date.getHours()).padStart(2, "0")
	const minutes = String(date.getMinutes()).padStart(2, "0")
	const seconds = String(date.getSeconds()).padStart(2, "0")
	const millis = String(date.getMilliseconds()).padStart(3, "0")
	return `${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`
}
