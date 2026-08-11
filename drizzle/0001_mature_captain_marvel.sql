ALTER TABLE "problems" DROP CONSTRAINT "problems_slug_unique";--> statement-breakpoint
ALTER TABLE "tags" DROP CONSTRAINT "tags_name_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "attempts_problem_attempted_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "problems_next_review_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tasks_status_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tasks_due_at_idx";--> statement-breakpoint
ALTER TABLE "attempts" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "owner_id" text;--> statement-breakpoint
-- Existing rows predate multi-user support entirely; they all belong to
-- whoever was using this single-user instance before today.
UPDATE "tasks" SET "owner_id" = 'harshilmodh77@gmail.com' WHERE "owner_id" IS NULL;--> statement-breakpoint
UPDATE "tags" SET "owner_id" = 'harshilmodh77@gmail.com' WHERE "owner_id" IS NULL;--> statement-breakpoint
UPDATE "logs" SET "owner_id" = 'harshilmodh77@gmail.com' WHERE "owner_id" IS NULL;--> statement-breakpoint
UPDATE "problems" SET "owner_id" = 'harshilmodh77@gmail.com' WHERE "owner_id" IS NULL;--> statement-breakpoint
UPDATE "attempts" SET "owner_id" = 'harshilmodh77@gmail.com' WHERE "owner_id" IS NULL;--> statement-breakpoint
ALTER TABLE "attempts" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "logs" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attempts_owner_problem_attempted_idx" ON "attempts" USING btree ("owner_id","problem_id","attempted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "logs_owner_idx" ON "logs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_owner_next_review_idx" ON "problems" USING btree ("owner_id","next_review_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_owner_status_idx" ON "tasks" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_owner_due_at_idx" ON "tasks" USING btree ("owner_id","due_at");--> statement-breakpoint
ALTER TABLE "problems" ADD CONSTRAINT "problems_owner_slug_unique" UNIQUE("owner_id","slug");--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_owner_name_unique" UNIQUE("owner_id","name");
