'use server'

import { db } from '@/lib/drizzle/db'
import { bookings, availability } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { validateEmail } from '@/lib/utils' 


interface BookingData {
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  bookingDate: string
  bookingTime: string
}

interface UserBooking {
  id: number
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  startTime: string
  createdAt: string
  slotInfo: {
    date: string
    startTime: string
    endTime: string
    description: string
  }
}

export async function createBooking(bookingData: BookingData) {
  try {
    // Validate 
    if (!bookingData.availabilityId || isNaN(bookingData.availabilityId)) {
      throw new Error('Invalid availability slot')
    }

    if (!bookingData.bookedByName?.trim()) {
      throw new Error('Name is required')
    }

    if (!validateEmail(bookingData.bookedByEmail)) {
      throw new Error('Please enter a valid email address')
    }

    if (!bookingData.bookingDate || !bookingData.bookingTime) {
      throw new Error('Date and time are required')
    }

    // Check if slot still exists and is available
    const slot = await db
      .select()
      .from(availability)
      .where(eq(availability.id, bookingData.availabilityId))
      .then(res => res[0])

    if (!slot) {
      throw new Error('The selected time slot is no longer available')
    }

    // Create the booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        availabilityId: bookingData.availabilityId,
        bookedByName: bookingData.bookedByName.trim(),
        bookedByEmail: bookingData.bookedByEmail.toLowerCase(),
        bookingDate: bookingData.bookingDate,
        bookingTime: bookingData.bookingTime,
      })
      .returning()

    return {
      success: true,
      booking: newBooking,
      message: 'Booking created successfully'
    }
  } catch (error) {
    console.error('Booking creation failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Booking failed'
    }
  }
}

export async function getUserBookings(userId: string): Promise<{
  success: boolean
  bookings: UserBooking[]
  message?: string
}> {
  try {
    if (!userId || isNaN(parseInt(userId))) {
      throw new Error('Invalid user ID')
    }

    const userBookings = await db
      .select({
        id: bookings.id,
        availabilityId: bookings.availabilityId,
        bookedByName: bookings.bookedByName,
        bookedByEmail: bookings.bookedByEmail,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        createdAt: bookings.created_at,
        slotDate: availability.date,
        slotStartTime: availability.startTime,
        slotEndTime: availability.endTime,
        slotDescription: availability.description,
      })
      .from(bookings)
      .innerJoin(availability, eq(bookings.availabilityId, availability.id))
      .where(eq(availability.userId, parseInt(userId)))

    const formattedBookings = userBookings.map((booking) => ({
      id: booking.id,
      availabilityId: booking.availabilityId,
      bookedByName: booking.bookedByName,
      bookedByEmail: booking.bookedByEmail,
      startTime: booking.bookingTime,
      createdAt: booking.createdAt?.toISOString() || new Date().toISOString(),
      slotInfo: {
        date: booking.slotDate,
        startTime: booking.slotStartTime,
        endTime: booking.slotEndTime,
        description: booking.slotDescription,
      },
    }))

    return {
      success: true,
      bookings: formattedBookings
    }
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
    return {
      success: false,
      bookings: [],
      message: error instanceof Error ? error.message : 'Failed to fetch bookings'
    }
  }
}