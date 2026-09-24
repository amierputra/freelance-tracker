CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`company` varchar(255) NOT NULL DEFAULT '',
	`email` varchar(255) NOT NULL DEFAULT '',
	`phone` varchar(64) NOT NULL DEFAULT '',
	`notes` varchar(5000) NOT NULL DEFAULT '',
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_number` varchar(64) NOT NULL,
	`client_id` int NOT NULL,
	`project_id` int NOT NULL,
	`payment_id` int,
	`issue_date` varchar(10) NOT NULL,
	`due_date` varchar(10),
	`subtotal` double NOT NULL DEFAULT 0,
	`total` double NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'MYR',
	`line_items` text NOT NULL,
	`status` enum('draft','sent','paid') NOT NULL DEFAULT 'draft',
	`pdf_path` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`label` varchar(255) NOT NULL DEFAULT 'Payment',
	`amount` double NOT NULL,
	`status` enum('pending','sent','paid','overdue') NOT NULL DEFAULT 'pending',
	`due_date` varchar(10),
	`paid_date` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` varchar(5000) NOT NULL DEFAULT '',
	`status` enum('lead','in_progress','review','completed','cancelled') NOT NULL DEFAULT 'lead',
	`pricing_type` enum('fixed','hourly') NOT NULL DEFAULT 'fixed',
	`amount` double NOT NULL DEFAULT 0,
	`start_date` varchar(10),
	`deadline` varchar(10),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`business_name` varchar(255) NOT NULL DEFAULT '',
	`business_email` varchar(255) NOT NULL DEFAULT '',
	`business_phone` varchar(64) NOT NULL DEFAULT '',
	`business_address` varchar(1000) NOT NULL DEFAULT '',
	`bank_name` varchar(255) NOT NULL DEFAULT '',
	`bank_account_name` varchar(255) NOT NULL DEFAULT '',
	`bank_account_number` varchar(64) NOT NULL DEFAULT '',
	`invoice_prefix` varchar(32) NOT NULL DEFAULT 'INV',
	`next_invoice_number` int NOT NULL DEFAULT 1,
	`invoice_notes` varchar(2000) NOT NULL DEFAULT '',
	`onboarding_dismissed_at` varchar(32),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;