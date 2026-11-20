CREATE TABLE `artists` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text NOT NULL,
	`slug` text NOT NULL,
	`password_hash` text NOT NULL,
	`draft` text NOT NULL,
	`publication` text,
	`revision` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `artists_email_unique` ON `artists` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `artists_slug_unique` ON `artists` (`slug`);--> statement-breakpoint
CREATE TABLE `request_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`expires` integer NOT NULL,
	`attempts` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`digest` text PRIMARY KEY NOT NULL,
	`artist_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON UPDATE no action ON DELETE cascade
);
