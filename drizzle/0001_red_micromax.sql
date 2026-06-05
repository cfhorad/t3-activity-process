ALTER TABLE "pg-drizzle_activity" ADD COLUMN "activity_date" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity" ADD COLUMN "activity_memo" text;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity" ADD COLUMN "created_by_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_config" ADD COLUMN "process_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_config" ADD COLUMN "is_checkbox" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_data" ADD COLUMN "process_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process" ADD COLUMN "type" text DEFAULT 'PROCESS' NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process" ADD COLUMN "process_date" text DEFAULT '2024-01-01' NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process" ADD COLUMN "process_memo" text;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user" ADD COLUMN "area" text;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity" ADD CONSTRAINT "pg-drizzle_activity_created_by_id_pg-drizzle_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."pg-drizzle_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_config" ADD CONSTRAINT "pg-drizzle_google_sheet_config_process_id_pg-drizzle_process_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."pg-drizzle_process"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_data" ADD CONSTRAINT "pg-drizzle_google_sheet_data_process_id_pg-drizzle_process_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."pg-drizzle_process"("id") ON DELETE cascade ON UPDATE no action;