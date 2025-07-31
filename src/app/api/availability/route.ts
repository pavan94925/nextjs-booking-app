import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability, bookings } from "@/lib/drizzle/schema";
import { eq, inArray } from "drizzle-orm";


export async function POST(req: Request) {
  const cookieStore = cookies();
  const userId = (await cookieStore).get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime, description } = body;

  const formattedStartTime = startTime.includes(":") && startTime.split(":").length === 2
    ? `${startTime}:00`
    : startTime;

  const formattedEndTime = endTime.includes(":") && endTime.split(":").length === 2
    ? `${endTime}:00`
    : endTime;

  try {
    // Save the availability in database
    await db.insert(availability).values({
      userId: Number(userId),
      date,
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      description,
    });

    return NextResponse.json({ message: "Availability added successfully" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET service call fetch data from availability slots
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id") || searchParams.get("userId");
  const excludeBooked = searchParams.get("exclude_booked") === "true";

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id parameter" }, { status: 400 });
  }

  const userIdNum = parseInt(userId);
  if (isNaN(userIdNum)) {
    return NextResponse.json({ error: "Invalid user_id format" }, { status: 400 });
  }

  try {
    const slots = await db
      .select()
      .from(availability)
      .where(eq(availability.userId, userIdNum));

    const slotIds = slots.map(slot => slot.id);

    // Find booked slot IDs
    let bookedSlotIds: number[] = [];
    if (slotIds.length > 0) {
      const booked = await db
        .select({ availabilityId: bookings.availabilityId })
        .from(bookings)
        .where(inArray(bookings.availabilityId, slotIds));

      bookedSlotIds = booked.map(item => item.availabilityId);
    }

    let formattedSlots = slots.map(slot => ({
      ...slot,
      startTime: slot.startTime?.substring(0, 5) || "",
      endTime: slot.endTime?.substring(0, 5) || "",
      isBooked: bookedSlotIds.includes(slot.id),
    }));

    if (excludeBooked) {
      formattedSlots = formattedSlots.filter(slot => !slot.isBooked);
    }

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch availability", details: (error as Error).message },
      { status: 500 }
    );
  }
}
