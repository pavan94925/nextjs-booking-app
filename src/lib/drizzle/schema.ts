import {
  pgTable,
  serial,
  varchar,
  timestamp,
  date,
  time,
  integer,
} from 'drizzle-orm/pg-core'

// 1️ User Profiles Table
export const user_profiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(), 
  full_name: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
})

// 2️Availability Table
export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user_profiles.id, { onDelete: 'cascade' }), 
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
})

// 3️ Bookings Table
  export const bookings = pgTable('bookings', {
    id: serial('id').primaryKey(),
    availabilityId: integer('availability_id')
      .notNull()
      .references(() => availability.id, { onDelete: 'cascade' }),
    bookedByName: varchar('booked_by_name', { length: 255 }).notNull(),
    bookedByEmail: varchar('booked_by_email', { length: 255 }).notNull(),
    bookingDate: date('booking_date').notNull(),
    bookingTime: time('booking_time').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  })
