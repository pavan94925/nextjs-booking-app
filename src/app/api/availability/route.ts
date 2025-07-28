import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  console.log("Cookie:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime, description } = body;

  try {
    await db.insert(availability).values({
      userId: Number(userId),
      date,
      startTime,
      endTime,
      description,
    });

    return NextResponse.json({ message: "Availability added successfully" });
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  console.log('GET request received');
  const { searchParams } = new URL(req.url);

  // Accept both user_id and userId for compatibility
  const userId = searchParams.get("user_id") || searchParams.get("userId");

  console.log("Requested userId:", userId);

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id parameter" }, { status: 400 });
  }

  const userIdNum = parseInt(userId);

  if (isNaN(userIdNum)) {
    return NextResponse.json({ error: "Invalid user_id format" }, { status: 400 });
  }

  try {
    // Use userId (property name from schema) not user_id (column name)
    const slots = await db
      .select()
      .from(availability)
      .where(eq(availability.userId, userIdNum));

    console.log("Found slots:", slots);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}