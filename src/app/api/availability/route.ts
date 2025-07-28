import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";



export async function POST(req: Request) {
  const cookieStore = await cookies(); // ✅ Get cookie store
  const userId = cookieStore.get("userId")?.value; // ✅ Correct way to get cookie

  console.log("Cookie:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
  }

  const body = await req.json();
  const { date, startTime, endTime,description } = body;

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
    console.error(" DB Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
  
export async function GET(req: Request) {
    console.log('searchParams',req);
  const { searchParams } = new URL(req.url);

  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }


  const userIdNum = parseInt(userId);

  // 1️ Get availability for that user_id
  const slots = await db
    .select()
    .from(availability)
    .where(eq(availability.user_id, userIdNum)); //  use userId not user_id

  return NextResponse.json({ slots });
}
