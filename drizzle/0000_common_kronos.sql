CREATE TABLE IF NOT EXISTS "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" SERIAL PRIMARY KEY,
  "availability_id" INTEGER NOT NULL REFERENCES availability("id") ON DELETE CASCADE,
  "booked_by_name" VARCHAR(255) NOT NULL,
  "booked_by_email" VARCHAR(255) NOT NULL,
  "booking_date" DATE NOT NULL,
  "booking_time" TIME NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
