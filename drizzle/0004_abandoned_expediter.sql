ALTER TABLE "attempts" ADD COLUMN "approach" text;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "pinned_for_revisit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "problems_owner_pinned_idx" ON "problems" USING btree ("owner_id","pinned_for_revisit");