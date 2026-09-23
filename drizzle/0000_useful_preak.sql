CREATE TYPE "public"."calculation_mode" AS ENUM('PAYMENT', 'TERM');--> statement-breakpoint
CREATE TYPE "public"."financing_status" AS ENUM('ACTIVE', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('CONFIRMED', 'VOIDED');--> statement-breakpoint
CREATE TABLE "financings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"owner_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"buyer_name" text,
	"initial_capital" numeric(14, 2) NOT NULL,
	"current_balance" numeric(14, 2) NOT NULL,
	"annual_interest_rate" numeric(8, 4) NOT NULL,
	"calculation_mode" "calculation_mode" NOT NULL,
	"target_payment" numeric(14, 2) NOT NULL,
	"target_end_date" date NOT NULL,
	"start_date" date NOT NULL,
	"first_payment_date" date NOT NULL,
	"expected_payment_day" integer NOT NULL,
	"status" "financing_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"financing_id" varchar(64) NOT NULL,
	"payment_date" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"previous_payment_date" date NOT NULL,
	"days_elapsed" integer NOT NULL,
	"opening_balance" numeric(14, 2) NOT NULL,
	"interest_amount" numeric(14, 2) NOT NULL,
	"principal_amount" numeric(14, 2) NOT NULL,
	"closing_balance" numeric(14, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'CONFIRMED' NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_financing_id_financings_id_fk" FOREIGN KEY ("financing_id") REFERENCES "public"."financings"("id") ON DELETE no action ON UPDATE no action;