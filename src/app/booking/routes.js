import { NextResponse } from 'next/server'
import { db } from '@/lib/drizzle/db'
import { bookings, availability } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { availabilityId, bookedByName, bookedByEmail, startTime, endTime } =
      body

    // ✅ Basic validation
    if (
      !availabilityId ||
      !bookedByName ||
      !bookedByEmail ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // ✅ Check if availability exists
    const [slot] = await db
      .select()
      .from(availability)
      .where(eq(availability.id, Number(availabilityId)))

    if (!slot) {
      return NextResponse.json(
        { message: 'Availability slot not found' },
        { status: 404 }
      )
    }

    // ✅ Insert booking
    await db.insert(bookings).values({
      availabilityId: Number(availabilityId),
      bookedByName,
      bookedByEmail,
      startTime,
      endTime,
    })

    return NextResponse.json({ message: 'Booking successful' }, { status: 201 })
  } catch (error) {
    console.error('Booking Error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

