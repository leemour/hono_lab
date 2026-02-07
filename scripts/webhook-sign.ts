#!/usr/bin/env node
/**
 * Generate signed webhook request command
 * Usage: tsx scripts/webhook-sign.ts '{"message":"Hello, world!"}'
 */
import { readFileSync } from "node:fs"
import { createHmac } from "node:crypto"
import { resolve } from "node:path"

// Load environment variables from .env.development
function loadEnv(filePath: string): Record<string, string> {
	const env: Record<string, string> = {}
	try {
		const content = readFileSync(filePath, "utf-8")
		for (const line of content.split("\n")) {
			const trimmed = line.trim()
			// Skip comments and empty lines
			if (!trimmed || trimmed.startsWith("#")) {
				continue
			}
			// Parse KEY=VALUE
			const match = trimmed.match(/^([^=]+)=(.*)$/)
			if (match) {
				const key = match[1].trim()
				let value = match[2].trim()
				// Remove quotes if present
				if ((value.startsWith('"') && value.endsWith('"')) ||
				    (value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1)
				}
				env[key] = value
			}
		}
	} catch (error) {
		console.error(`Error loading env file: ${error}`)
		process.exit(1)
	}
	return env
}

// Generate HMAC-SHA256 signature
function generateSignature(payload: string, secret: string): string {
	const hmac = createHmac("sha256", secret)
	hmac.update(payload)
	return hmac.digest("hex")
}

// Main
const args = process.argv.slice(2)
if (args.length === 0) {
	console.error("Usage: tsx scripts/webhook-sign.ts '<JSON payload>'")
	console.error('Example: tsx scripts/webhook-sign.ts \'{"message":"Hello, world!"}\'')
	process.exit(1)
}

const payload = args[0]

// Validate JSON
try {
	JSON.parse(payload)
} catch (error) {
	console.error("Error: Payload must be valid JSON")
	process.exit(1)
}

// Load environment variables
const envFile = process.env.NODE_ENV === "development" ? ".env.development" : ".env"
const envPath = resolve(process.cwd(), envFile)
const env = loadEnv(envPath)

const webhookSecret = env.WEBHOOK_SECRET
if (!webhookSecret) {
	console.error(`Error: WEBHOOK_SECRET not found in ${envFile}`)
	process.exit(1)
}

// Generate signature
const signature = generateSignature(payload, webhookSecret)

// Get port from env or default
const port = env.PORT || "8787"

// Generate and print http command
// Note: We need to pipe the exact payload to ensure byte-for-byte match
console.log(`echo -n '${payload}' | http POST localhost:${port}/v1/webhooks/receive \\`)
console.log(`  x-webhook-signature:${signature} \\`)
console.log(`  content-type:application/json`)
