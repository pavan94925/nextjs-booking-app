import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle/db";
import { bookings, availability } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, time, notes, bookedByName, bookedByEmail, hostUserId } = body;

    console.log("Booking request:", body);

    // Validation
    if (!date || !time || !bookedByName || !bookedByEmail || !hostUserId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find matching availability slot
    const availableSlot = await db
      .select()
      .from(availability)
      .where(eq(availability.userId, parseInt(hostUserId)))
      .then(slots => 
        slots.find(slot => 
          slot.date === date && 
          time >= slot.startTime && 
          time <= slot.endTime
        )
      );

    if (!availableSlot) {
      return NextResponse.json(
        { message: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Create booking
    const newBooking = await db.insert(bookings).values({
      availabilityId: availableSlot.id,
      bookedByName,
      bookedByEmail,
      startTime: time,
      endTime: time, // You might want to calculate end time based on duration
    }).returning();

    console.log("Booking created:", newBooking);

    return NextResponse.json({ 
      message: "Booking confirmed successfully",
      booking: newBooking[0]
    });

  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// GET method to fetch all bookings for a user (for the dashboard)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Get all bookings for this user's availability slots
    const userBookings = await db
      .select({
        id: bookings.id,
        bookedByName: bookings.bookedByName,
        bookedByEmail: bookings.bookedByEmail,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        createdAt: bookings.created_at,
        date: availability.date,
        description: availability.description,
      })
      .from(bookings)
      .innerJoin(availability, eq(bookings.availabilityId, availability.id))
      .where(eq(availability.userId, parseInt(userId)));

    return NextResponse.json({ bookings: userBookings });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}