import type { Context } from "hono"
import type { Bindings } from "./config"
import type { IDatabase } from "../lib/db"

/**
 * Extended Hono context with our custom variables
 */
export type AppContext = Context<{
	Bindings: Bindings
	Variables: {
		correlationId: string
		requestStartTime: number
		db?: IDatabase
	}
}>

/**
 * Standard JSON error response format
 */
export interface ErrorResponse {
	error: {
		code: string
		message: string
		details?: Record<string, unknown>
		correlationId?: string
	}
}

/**
 * Standard health check response
 */
export interface HealthResponse {
	status: "healthy" | "unhealthy"
	timestamp: string
	version: string
	environment: string
	database?: {
		adapter: "sqlite" | "d1" | "postgres"
		connected: boolean
	}
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
	limit: number
	offset: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
	data: T[]
	pagination: {
		limit: number
		offset: number
		total: number
	}
}
