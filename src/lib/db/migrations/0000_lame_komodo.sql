CREATE TABLE `gth_audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`category` text,
	`owner` text,
	`repo` text,
	`ip` text,
	`user_agent` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gth_bookmark` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`full_name` text NOT NULL,
	`description` text,
	`language` text,
	`stargazers_count` integer DEFAULT 0 NOT NULL,
	`avatar_url` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gth_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gth_language` (
	`name` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gth_user_pref` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`locale` text DEFAULT 'zh' NOT NULL,
	`per_page` integer DEFAULT 30 NOT NULL,
	`default_category` text DEFAULT 'trending' NOT NULL,
	`default_days` integer DEFAULT 7 NOT NULL,
	`auto_refresh` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
