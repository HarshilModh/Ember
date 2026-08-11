CREATE TABLE IF NOT EXISTS "mcp_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone,
	CONSTRAINT "mcp_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_tokens_owner_idx" ON "mcp_tokens" USING btree ("owner_id");