/**
 * Cloudflare Workers entry point
 * This is the main entry point for the application when deployed to Cloudflare Workers
 */
import { createApp } from "./app"

const app = createApp()

export default app
