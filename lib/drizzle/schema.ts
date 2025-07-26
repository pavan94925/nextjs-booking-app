import {
  pgTable,
  serial,
  varchar,
  timestamp,
  date,
  time,
  integer,
} from "drizzle-orm/pg-core";

// 1️⃣ User Profile Table (Extra info for Supabase Auth user)
export const user_profiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(), // Supabase auth.users.id
  fullName: varchar("full_name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2️⃣ Availability Table (Time slots created by user)
export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(), // FK to user_profiles.userId
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

// 3️⃣ Bookings Table (When someone books a slot)
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  availabilityId: integer("availability_id").notNull(), // FK to availability.id
  bookedByName: varchar("booked_by_name", { length: 255 }).notNull(),
  bookedByEmail: varchar("booked_by_email", { length: 255 }).notNull(),
  bookedTime: timestamp("booked_time").defaultNow(),
});
