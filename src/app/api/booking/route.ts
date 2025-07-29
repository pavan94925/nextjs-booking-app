// app/api/booking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {db} from '../../../lib/drizzle/db' // Adjust path to your db instance
import { availability, bookings } from '../../../lib/drizzle/schema' // Adjust path to your schema
import { eq } from 'drizzle-orm'


interface BookingRequest {
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  bookingDate: string
  bookingTime: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    // Validate required fields
    const {
      availabilityId,
      bookedByName,
      bookedByEmail,
      bookingDate,
      bookingTime,
    } = body

    if (
      !availabilityId ||
      !bookedByName ||
      !bookedByEmail ||
      !bookingDate ||
      !bookingTime
    ) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(bookedByEmail)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    console.log('Booking request received:', body)

    // Insert booking into database
    try {
      const newBooking = await db.insert(bookings).values({
        availabilityId: availabilityId,
        bookedByName: bookedByName,
        bookedByEmail: bookedByEmail,
        bookingDate: bookingDate,
        bookingTime: bookingTime,
      }).returning()

      console.log('Booking saved to database:', newBooking[0])

      // Return success response with actual booking data
      return NextResponse.json({
        success: true,
        message: 'Booking confirmed successfully',
        booking: newBooking[0],
      })
    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { message: 'Failed to save booking to database' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
// export async function GET() {
//   return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
// }

export async function GET(request: NextRequest) {
  try {
    // Get user_id from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Fetch bookings for availability slots that belong to this user
    const userBookings = await db
      .select({
        id: bookings.id,
        availabilityId: bookings.availabilityId,
        bookedByName: bookings.bookedByName,
        bookedByEmail: bookings.bookedByEmail,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        createdAt: bookings.created_at,
        // Include availability slot details
        slotDate: availability.date,
        slotStartTime: availability.startTime,
        slotEndTime: availability.endTime,
        slotDescription: availability.description,
      })
      .from(bookings)
      .innerJoin(availability, eq(bookings.availabilityId, availability.id))
      .where(eq(availability.userId, parseInt(userId)))

    // Transform the data to match your frontend interface
    const transformedBookings = userBookings.map((booking) => ({
      id: booking.id,
      availabilityId: booking.availabilityId,
      bookedByName: booking.bookedByName,
      bookedByEmail: booking.bookedByEmail,
      startTime: booking.bookingTime, // Using booking time as startTime
      createdAt: booking.createdAt?.toISOString() || new Date().toISOString(),
      // Additional slot info for reference
      slotInfo: {
        date: booking.slotDate,
        startTime: booking.slotStartTime,
        endTime: booking.slotEndTime,
        description: booking.slotDescription,
      },
    }))

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
