ALTER TABLE `invoices` DROP INDEX `invoices_invoice_number_unique`;--> statement-breakpoint
ALTER TABLE `clients` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `invoices` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `payments` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `projects` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `settings` ADD `user_id` int;--> statement-breakpoint
UPDATE `clients` SET `user_id` = (SELECT MIN(`id`) FROM `users`);--> statement-breakpoint
UPDATE `invoices` SET `user_id` = (SELECT MIN(`id`) FROM `users`);--> statement-breakpoint
UPDATE `payments` SET `user_id` = (SELECT MIN(`id`) FROM `users`);--> statement-breakpoint
UPDATE `projects` SET `user_id` = (SELECT MIN(`id`) FROM `users`);--> statement-breakpoint
UPDATE `settings` SET `user_id` = (SELECT MIN(`id`) FROM `users`);--> statement-breakpoint
DELETE FROM `settings` WHERE `user_id` IS NULL OR `id` > (SELECT `id` FROM (SELECT MIN(`id`) AS `id` FROM `settings`) s);--> statement-breakpoint
ALTER TABLE `clients` MODIFY `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` MODIFY `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `payments` MODIFY `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` MODIFY `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `settings` MODIFY `user_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_user_number_unique` UNIQUE(`user_id`,`invoice_number`);--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_user_id_unique` UNIQUE(`user_id`);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `settings` ADD CONSTRAINT `settings_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
