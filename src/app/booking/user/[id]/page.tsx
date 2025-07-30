'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface AvailabilitySlot {
  id: number
  date: string
  startTime: string // HH:MM
  endTime: string // HH:MM
  description: string
}

export default function BookUserPage() {
  const params = useParams()
  // --- CRITICAL DEBUGGING LOG ---
  // This MUST show { id: '1' } in your browser console when you visit /booking/user/1
  console.log('useParams() result:', params)

  // Safely extract userId. If params.id is not a string, it will be null.
  const userId = params && typeof params.id === 'string' ? params.id : null

  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form states for booking
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<
    number | null
  >(null)
  const [bookedByName, setBookedByName] = useState('')
  const [bookedByEmail, setBookedByEmail] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')

  useEffect(() => {
    // This guard checks if userId is null/undefined.
    // If the console.log above shows { id: '1' }, but this still triggers,
    // it means userId is somehow not being set correctly from params.id.
    if (!userId) {
      console.log(
        'useEffect: userId is not yet available or valid. Skipping fetch.'
      )
      setError('User ID not provided in the URL or could not be extracted.')
      setLoading(false)
      return
    }

    console.log('useEffect: Valid userId found:', userId) // This should now log if the above console.log worked

    const fetchAvailableSlots = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/availability?user_id=${userId}&exclude_booked=true`)
        if (!res.ok) {
          const errorText = await res.text()
          throw new Error(
            `Failed to fetch availability: ${res.status} - ${errorText}`
          )
        }
        const data = await res.json()
        setAvailableSlots(data.slots || [])
      } catch (err) {
        console.error('Error fetching available slots:', err)
        setError(`Failed to load available slots: ${(err as Error).message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [userId]) // Dependency array: re-runs when userId changes (i.e., when it becomes available)

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAvailabilityId) {
      alert('Please select an availability slot to book.')
      return
    }

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        body: JSON.stringify({
          availabilityId: selectedAvailabilityId,
          bookedByName,
          bookedByEmail,
          bookingDate,
          bookingTime,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(
          errorData.message || `HTTP error! status: ${res.status}`
        )
      }

      const data = await res.json()
      console.log('Booking successful:', data)
      alert('Your booking has been confirmed!')

      // Clear the form
      setSelectedAvailabilityId(null)
      setBookedByName('')
      setBookedByEmail('')
      setBookingDate('')
      setBookingTime('')
    } catch (err) {
      console.error('Booking submission error:', err)
      alert(`Failed to confirm booking: ${(err as Error).message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading available slots...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Book a Time Slot
        </h1>

        {availableSlots.length > 0 ? (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Available Slots:
            </h2>
            <ul className="list-disc list-inside mb-6 space-y-2">
              {availableSlots.map((slot) => (
                <li key={slot.id} className="text-gray-700">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="availabilitySlot"
                      value={slot.id}
                      checked={selectedAvailabilityId === slot.id}
                      onChange={() => {
                        setSelectedAvailabilityId(slot.id)
                        setBookingDate(slot.date) // Pre-fill date from selected slot
                      }}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">
                      {slot.date} from {slot.startTime} to {slot.endTime} -{' '}
                      {slot.description}
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="bookedByName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="bookedByName"
                  value={bookedByName}
                  onChange={(e) => setBookedByName(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="bookedByEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  id="bookedByEmail"
                  value={bookedByEmail}
                  onChange={(e) => setBookedByEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="bookingDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Booking Date
                </label>
                <input
                  type="date"
                  id="bookingDate"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label
                  htmlFor="bookingTime"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Booking Time
                </label>
                <input
                  type="time"
                  id="bookingTime"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-200 font-semibold text-lg shadow-md"
              >
                Confirm Booking
              </button>
            </form>
          </>
        ) : (
          <p className="text-gray-600 text-center">
            No availability slots found for this user.
          </p>
        )}
      </div>
    </div>
  )
}
