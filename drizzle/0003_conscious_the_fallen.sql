CREATE TABLE "pg-drizzle_activity_editor" (
	"activity_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "pg-drizzle_activity_editor_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "pg-drizzle_area" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pg-drizzle_process_checker" (
	"process_id" integer NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "pg-drizzle_process_checker_process_id_user_id_pk" PRIMARY KEY("process_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "pg-drizzle_user_area" (
	"user_id" text NOT NULL,
	"area_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by_id" text,
	"approved_at" timestamp,
	"rejected_reason" text,
	CONSTRAINT "pg-drizzle_user_area_user_id_area_id_pk" PRIMARY KEY("user_id","area_id")
);
--> statement-breakpoint
ALTER TABLE "pg-drizzle_process" ALTER COLUMN "process_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process" ALTER COLUMN "process_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity" ADD COLUMN "area_id" text;--> statement-breakpoint
ALTER TABLE "pg-drizzle_google_sheet_config" ADD COLUMN "is_visible" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity_editor" ADD CONSTRAINT "pg-drizzle_activity_editor_activity_id_pg-drizzle_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."pg-drizzle_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity_editor" ADD CONSTRAINT "pg-drizzle_activity_editor_user_id_pg-drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pg-drizzle_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process_checker" ADD CONSTRAINT "pg-drizzle_process_checker_process_id_pg-drizzle_process_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."pg-drizzle_process"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_process_checker" ADD CONSTRAINT "pg-drizzle_process_checker_user_id_pg-drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pg-drizzle_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user_area" ADD CONSTRAINT "pg-drizzle_user_area_user_id_pg-drizzle_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pg-drizzle_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user_area" ADD CONSTRAINT "pg-drizzle_user_area_area_id_pg-drizzle_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."pg-drizzle_area"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user_area" ADD CONSTRAINT "pg-drizzle_user_area_approved_by_id_pg-drizzle_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."pg-drizzle_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_activity" ADD CONSTRAINT "pg-drizzle_activity_area_id_pg-drizzle_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."pg-drizzle_area"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pg-drizzle_user" DROP COLUMN "area";