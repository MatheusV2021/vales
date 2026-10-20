CREATE TABLE `vouchers` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`expires` text NOT NULL,
	`created` text NOT NULL,
	`used` text,
	FOREIGN KEY (`wallet`) REFERENCES `wallets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`token` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `wallets_owner_unique` ON `wallets` (`owner`);--> statement-breakpoint
CREATE UNIQUE INDEX `wallets_token_unique` ON `wallets` (`token`);