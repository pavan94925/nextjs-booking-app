// app/api/booking/route.ts
import { NextRequest, NextResponse } from 'next/server'

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

    // TODO: Add your database logic here
    // For now, we'll simulate a successful booking

    // Example database operations you might do:
    // 1. Check if the availability slot exists and is still available
    // 2. Create a new booking record
    // 3. Update the availability slot to mark it as booked
    // 4. Send confirmation email

    // Simulated database operation
    const bookingId = Math.floor(Math.random() * 10000)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking confirmed successfully',
      bookingId,
      booking: {
        id: bookingId,
        availabilityId,
        bookedByName,
        bookedByEmail,
        bookingDate,
        bookingTime,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
