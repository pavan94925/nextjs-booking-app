import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle/db";
import { bookings, availability } from "@/lib/drizzle/schema"; // Import bookings and availability schema
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      availabilityId, // The ID of the specific availability slot being booked
      bookedByName,
      bookedByEmail,
      bookingDate,    // The date the booking is made for
      bookingTime,    // The time the booking is made for
    } = body;

    console.log("Booking POST Request Payload:", {
      availabilityId, bookedByName, bookedByEmail, bookingDate, bookingTime
    });

    // Basic validation
    if (!availabilityId || !bookedByName || !bookedByEmail || !bookingDate || !bookingTime) {
      return NextResponse.json({ message: "Missing required booking fields." }, { status: 400 });
    }

    // Optional: You might want to fetch the availability slot here
    // to ensure it exists and is still available before booking.
    const existingSlot = await db.select()
                                 .from(availability)
                                 .where(eq(availability.id, Number(availabilityId)));

    if (existingSlot.length === 0) {
      return NextResponse.json({ message: "Availability slot not found." }, { status: 404 });
    }

    // Ensure bookingTime is in HH:MM:SS format for Drizzle's time() type
    const formattedBookingTime = bookingTime.includes(':') && bookingTime.split(':').length === 2
      ? `${bookingTime}:00`
      : bookingTime;

    console.log("Booking - Formatted bookingTime for DB:", formattedBookingTime);

    // Insert the new booking into the 'bookings' table
    const result = await db.insert(bookings).values({
      availabilityId: Number(availabilityId),
      bookedByName,
      bookedByEmail,
      startTime: formattedBookingTime, // Use startTime as the booking's specific time
      // Note: Your bookings table schema has start_time and end_time.
      // If a booking is for a specific point in time, you might only need one.
      // Or, if it's booking a portion of an availability slot, you'd need both.
      // For now, I'm using bookingTime for startTime, and you can adjust endTime as needed.
      // If bookingDate is meant for a date column in bookings, use it directly.
      // Assuming bookingDate is part of the context, but not a direct column in 'bookings' for now.
      // If you need a 'booking_date' column, add it to your drizzle schema and here.
      // For simplicity, I'm mapping bookingTime to startTime in the bookings table.
      // If your `bookings` table has `booking_date` and `booking_time` columns, adjust accordingly.
    }).returning(); // Return the inserted booking data

    return NextResponse.json({ message: "Booking confirmed successfully!", booking: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Booking API Error:", error);
    return NextResponse.json({ message: "Failed to confirm booking.", error: (error as Error).message }, { status: 500 });
  }
}