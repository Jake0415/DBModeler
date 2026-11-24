CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE SCHEMA "iam";
--> statement-breakpoint
CREATE TABLE "audit"."events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"for_id" text,
	"act" text NOT NULL,
	"target" text DEFAULT '' NOT NULL,
	"why" text DEFAULT '' NOT NULL,
	"sys_code" text,
	"kind" text DEFAULT 'work' NOT NULL,
	"result" text DEFAULT 'ok' NOT NULL,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "iam"."reserved_ids" (
	"id" text PRIMARY KEY NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "iam"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"rev" bigint NOT NULL,
	"pw_change_only" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" text,
	"ua" text
);
--> statement-breakpoint
CREATE TABLE "iam"."user_roles" (
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "user_roles_user_id_role_pk" PRIMARY KEY("user_id","role")
);
--> statement-breakpoint
CREATE TABLE "iam"."user_systems" (
	"user_id" text NOT NULL,
	"system_code" text NOT NULL,
	CONSTRAINT "user_systems_user_id_system_code_pk" PRIMARY KEY("user_id","system_code")
);
--> statement-breakpoint
CREATE TABLE "iam"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"company" text DEFAULT '' NOT NULL,
	"org" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"mail" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"kind" text DEFAULT 'in' NOT NULL,
	"project_id" text,
	"until" date,
	"view_scope" text,
	"view_why" text,
	"auth" text DEFAULT 'local' NOT NULL,
	"pw_hash" text,
	"pw_temp" boolean DEFAULT false NOT NULL,
	"pw_temp_until" timestamp with time zone,
	"pw_at" timestamp with time zone,
	"fails" integer DEFAULT 0 NOT NULL,
	"lock_until" timestamp with time zone,
	"sess_rev" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iam"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "iam"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "iam"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "iam"."user_systems" ADD CONSTRAINT "user_systems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "iam"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_at_idx" ON "audit"."events" USING btree ("at");--> statement-breakpoint
CREATE INDEX "events_actor_idx" ON "audit"."events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "iam"."sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_mail_uq" ON "iam"."users" USING btree (lower("mail"));