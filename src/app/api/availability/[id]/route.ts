import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/drizzle/db";
import { availability } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm"; // Add `and` here

// Handles PUT requests for updating an availability slot by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const userId = (await cookieStore).get('userId')?.value

  console.log('PUT Request - Cookie userId:', userId)
  console.log('PUT Request - Slot ID:', params.id)

  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized: No token' },
      { status: 401 }
    )
  }

  const body = await req.json()
  const { date, startTime, endTime, description } = body

  console.log('PUT Request Payload:', { date, startTime, endTime, description })

  try {
    const slotId = parseInt(params.id)

    if (isNaN(slotId)) {
      return NextResponse.json({ message: 'Invalid slot ID' }, { status: 400 })
    }

    // Format times to HH:MM:SS format for database
    const formattedStartTime =
      startTime.includes(':') && startTime.split(':').length === 2
        ? `${startTime}:00`
        : startTime

    const formattedEndTime =
      endTime.includes(':') && endTime.split(':').length === 2
        ? `${endTime}:00`
        : endTime

    console.log('PUT - Formatted times for DB:', {
      formattedStartTime,
      formattedEndTime,
    })

    // Update the specific slot that belongs to the authenticated user
    const result = await db
      .update(availability)
      .set({
        date,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        description,
      })
      .where(
        and(
          eq(availability.id, slotId),
          eq(availability.userId, Number(userId))
        )
      )

    console.log('PUT - Update result:', result)

    return NextResponse.json(
      { message: 'Availability updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DB Error (PUT):', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific slot
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const userId = (await cookieStore).get('userId')?.value

  console.log('DELETE Request - Cookie userId:', userId)
  console.log('DELETE Request - Slot ID:', params.id)

  if (!userId) {
    return NextResponse.json(
      { message: 'Unauthorized: No token' },
      { status: 401 }
    )
  }

  try {
    const slotId = parseInt(params.id)

    if (isNaN(slotId)) {
      return NextResponse.json({ message: 'Invalid slot ID' }, { status: 400 })
    }

    // Delete the specific slot that belongs to the authenticated user
    const result = await db
      .delete(availability)
      .where(
        and(
          eq(availability.id, slotId),
          eq(availability.userId, Number(userId))
        )
      )

    console.log('DELETE - Delete result:', result)

    return NextResponse.json(
      { message: 'Availability deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DB Error (DELETE):', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}