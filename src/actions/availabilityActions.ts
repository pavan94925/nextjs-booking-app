'use server';
import { db } from '@/lib/drizzle/db'
import { availability, bookings } from '@/lib/drizzle/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { getUserSession } from '@/lib/drizzle/session'

export async function getAvailabilitySlots(
  userId: string,
  excludeBooked = false
) {
  const userIdNum = parseInt(userId)
  if (isNaN(userIdNum)) {
    throw new Error('Invalid user_id format')
  }

  const slots = await db
    .select()
    .from(availability)
    .where(eq(availability.userId, userIdNum))

  const slotIds = slots.map((slot) => slot.id)

  // Find booked slot IDs
  let bookedSlotIds: number[] = []
  if (slotIds.length > 0) {
    const booked = await db
      .select({ availabilityId: bookings.availabilityId })
      .from(bookings)
      .where(inArray(bookings.availabilityId, slotIds))

    bookedSlotIds = booked.map((item) => item.availabilityId)
  }

  let formattedSlots = slots.map((slot) => ({
    ...slot,
    startTime: slot.startTime?.substring(0, 5) || '',
    endTime: slot.endTime?.substring(0, 5) || '',
    isBooked: bookedSlotIds.includes(slot.id),
  }))

  if (excludeBooked) {
    formattedSlots = formattedSlots.filter((slot) => !slot.isBooked)
  }

  return formattedSlots
}

export async function createAvailabilitySlot(
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
  description: string
) {
  const formattedStartTime =
    startTime.includes(':') && startTime.split(':').length === 2
      ? `${startTime}:00`
      : startTime

  const formattedEndTime =
    endTime.includes(':') && endTime.split(':').length === 2
      ? `${endTime}:00`
      : endTime

  await db.insert(availability).values({
    userId: Number(userId),
    date,
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    description,
  })
}

export async function updateAvailabilitySlot(
  slotId: number,
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
  description: string
) {
  let newStartTime = startTime
  let newEndTime = endTime

  if (startTime.includes(':') && startTime.split(':').length === 2) {
    newStartTime = `${startTime}:00`
  }

  if (endTime.includes(':') && endTime.split(':').length === 2) {
    newEndTime = `${endTime}:00`
  }

  await db
    .update(availability)
    .set({
      date: date,
      startTime: newStartTime,
      endTime: newEndTime,
      description: description,
    })
    .where(
      and(eq(availability.id, slotId), eq(availability.userId, Number(userId)))
    )
}

export async function deleteAvailabilitySlot(slotId: number, userId: string) {
  await db
    .delete(availability)
    .where(
      and(eq(availability.id, slotId), eq(availability.userId, Number(userId)))
    )
}

export async function getBookedSlots(userId: string) {
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

  return userBookings.map((booking) => ({
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
}
