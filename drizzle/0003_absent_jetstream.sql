CREATE TABLE IF NOT EXISTS "focus_sessions" (
	"owner_id" text PRIMARY KEY NOT NULL,
	"phase" text DEFAULT 'focus' NOT NULL,
	"running" boolean DEFAULT false NOT NULL,
	"seconds_left" integer NOT NULL,
	"total_duration" integer NOT NULL,
	"focus_count" integer DEFAULT 0 NOT NULL,
	"active_task_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_active_task_id_tasks_id_fk" FOREIGN KEY ("active_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
