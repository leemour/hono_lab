CREATE TABLE `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`method` text DEFAULT 'POST' NOT NULL,
	`headers` text NOT NULL,
	`body` text,
	`received_at` integer DEFAULT (unixepoch()) NOT NULL,
	`processed_at` integer
);
