/**
 * Generic database interface for adapter pattern
 * This interface abstracts away the specific database implementation
 *
 * @template TDrizzle - The Drizzle database instance type
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic default type for database adapter
export interface IDatabase<TDrizzle = any> {
	/**
	 * Get the underlying Drizzle database instance
	 * This allows using Drizzle's query API directly
	 */
	getDrizzle(): TDrizzle

	/**
	 * Get the database adapter type
	 */
	getAdapterType(): "sqlite" | "d1" | "postgres"

	/**
	 * Check if database connection is healthy
	 */
	healthCheck(): Promise<boolean>
}
