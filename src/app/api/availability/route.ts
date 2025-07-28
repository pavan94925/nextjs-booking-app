import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const cookieStore = cookies(); // No need to await cookies() directly
  const userId = cookieStore.get("userId")?.value;

  console.log("POST Request - Cookie userId:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime, description } = body;

  console.log("POST Request Payload:", { date, startTime, endTime, description });

  try {
    // Ensure startTime and endTime are in HH:MM:SS format for Drizzle's time() type
    // Frontend's type="time" gives HH:MM, so we append :00
    const formattedStartTime = startTime.includes(':') && startTime.split(':').length === 2
      ? `${startTime}:00`
      : startTime; // Use as is if already HH:MM:SS or other format

    const formattedEndTime = endTime.includes(':') && endTime.split(':').length === 2
      ? `${endTime}:00`
      : endTime; // Use as is

    console.log("POST - Formatted times for DB:", { formattedStartTime, formattedEndTime });

    await db.insert(availability).values({
      userId: Number(userId),
      date,
      startTime: formattedStartTime, // Use formatted time
      endTime: formattedEndTime,     // Use formatted time
      description,
    });

    return NextResponse.json({ message: "Availability added successfully" }, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("DB Error (POST):", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  console.log('GET request received');
  const { searchParams } = new URL(req.url);

  // Accept both user_id and userId for compatibility
  const userId = searchParams.get("user_id") || searchParams.get("userId");

  console.log("GET Request - Requested userId:", userId);

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

    console.log("Found slots from DB:", slots);

    // Format startTime and endTime from DB (HH:MM:SS) to frontend's expected HH:MM
    const formattedSlots = slots.map(slot => ({
      ...slot,
      startTime: slot.startTime ? slot.startTime.substring(0, 5) : '', // Trim to HH:MM
      endTime: slot.endTime ? slot.endTime.substring(0, 5) : '',       // Trim to HH:MM
    }));

    console.log("Formatted slots for frontend:", formattedSlots);

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    console.error("Database Error (GET):", error);
    return NextResponse.json({ error: "Failed to fetch availability", details: (error as Error).message }, { status: 500 });
  }
}