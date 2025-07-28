import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm"; // Add `and` here

// Handles PUT requests for updating an availability slot by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } } // `params` contains dynamic segments like `id`
) {
  const id = (await params).id; // Await params as recommended by Next.js

  const cookieStore = cookies();
  const userId = cookieStore.get("userId")?.value;

  console.log("PUT Request - Slot ID:", id, "Cookie userId:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No token" }, { status: 401 });
  }

  const slotIdNum = parseInt(id);
  if (isNaN(slotIdNum)) {
    return NextResponse.json({ message: "Invalid slot ID format" }, { status: 400 });
  }

  const body = await req.json();
  const { date, startTime, endTime, description } = body;

  console.log("PUT Request Payload:", { date, startTime, endTime, description });

  // Validate incoming data
  if (!date || !startTime || !endTime || !description) {
    return NextResponse.json(
      { message: 'Missing required fields (date, startTime, endTime, description).' },
      { status: 400 } // Bad Request
    );
  }

  try {
    // Ensure startTime and endTime are in HH:MM:SS format for Drizzle's time() type
    // Frontend's type="time" gives HH:MM, so we append :00
    const formattedStartTime = startTime.includes(':') && startTime.split(':').length === 2
      ? `${startTime}:00`
      : startTime; // Use as is if already HH:MM:SS or other format

    const formattedEndTime = endTime.includes(':') && endTime.split(':').length === 2
      ? `${endTime}:00`
      : endTime; // Use as is

    console.log("PUT - Formatted times for DB:", { formattedStartTime, formattedEndTime });

    // Perform the update operation using Drizzle
    const result = await db
      .update(availability)
      .set({
        date,
        startTime: formattedStartTime, // Use formatted time
        endTime: formattedEndTime,     // Use formatted time
        description,
      })
      .where(eq(availability.id, slotIdNum)) // Match by slot ID
      .where(eq(availability.userId, Number(userId))) // Ensure user owns this slot
      .returning(); // Return the updated row(s)

    if (result.length === 0) {
      // If no row was updated, it means either the ID didn't exist or the userId didn't match
      return NextResponse.json(
        { message: `Availability slot with ID ${id} not found or you don't have permission to edit it.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: `Availability slot ${id} updated successfully!`, updatedSlot: result[0] }, { status: 200 });
  } catch (error) {
    console.error("DB Error (PUT):", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}

// Handles DELETE requests for deleting an availability slot by ID
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = (await params).id; // Get the slot ID from the URL params

  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  console.log("DELETE Request - Slot ID to delete:", id, "User ID from cookie:", userId);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized: No user ID token" }, { status: 401 });
  }

  const slotIdNum = parseInt(id);
  if (isNaN(slotIdNum)) {
    return NextResponse.json({ message: "Invalid slot ID format" }, { status: 400 });
  }

  try {
    // Crucial: Use `and` to combine conditions for both slot ID and user ID
    const result = await db
      .delete(availability)
      .where(
        and(
          eq(availability.id, slotIdNum), // Match the specific slot ID
          eq(availability.userId, Number(userId)) // Ensure it belongs to the current user
        )
      )
      .returning({ id: availability.id }); // Return the ID of the deleted row

    console.log("Drizzle delete result:", result);

    if (result.length === 0) {
      // If no row was deleted, it means either:
      // 1. The slot ID did not exist.
      // 2. The slot existed, but its userId did not match the current authenticated userId.
      return NextResponse.json(
        { message: `Availability slot with ID ${id} not found or you don't have permission to delete it.` },
        { status: 404 } // Not Found or Forbidden
      );
    }

    // If result.length > 0, it means at least one row was deleted successfully
    return NextResponse.json({ message: `Availability slot ${id} deleted successfully!` }, { status: 200 });
  } catch (error) {
    console.error("DB Error (DELETE):", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}