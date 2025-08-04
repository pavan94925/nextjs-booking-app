'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAvailabilitySlots } from '@/actions/availabilityActions'
import { createBooking } from '@/actions/bookingActions'
import { validateEmail } from '@/lib/utils' 

interface AvailabilitySlot {
  id: number
  date: string
  startTime: string 
  endTime: string 
  description: string
}

export default function BookUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params?.id as string | undefined

  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<number | null>(null)
  const [bookedByName, setBookedByName] = useState('')
  const [bookedByEmail, setBookedByEmail] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')

  useEffect(() => {
    if (!userId) {
      setError('Invalid user ID')
      setLoading(false)
      return
    }

    const fetchAvailableSlots = async () => {
      try {
        const slots = await getAvailabilitySlots(userId, true)
        setAvailableSlots(slots)
      } catch (err) {
        console.error('Error fetching slots:', err)
        setError('Failed to load available slots. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [userId])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!selectedAvailabilityId) {
      errors.availability = 'Please select a time slot'
    }
    if (!bookedByName.trim()) {
      errors.name = 'Name is required'
    }
    if (!validateEmail(bookedByEmail)) {
      errors.email = 'Please enter a valid email'
    }
    if (!bookingDate) {
      errors.date = 'Date is required'
    }
    if (!bookingTime) {
      errors.time = 'Time is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      await createBooking({
        availabilityId: selectedAvailabilityId!,
        bookedByName,
        bookedByEmail,
        bookingDate,
        bookingTime
      })

      alert('Booking confirmed successfully!')
      router.refresh() // Refresh to show updated availability
      
      setSelectedAvailabilityId(null)
      setBookedByName('')
      setBookedByEmail('')
      setBookingDate('')
      setBookingTime('')
    } catch (err) {
      console.error('Booking error:', err)
      alert(`Booking failed: ${err instanceof Error ? err.message : 'Please try again'}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading available slots...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Book a Time Slot
        </h1>

        {availableSlots.length > 0 ? (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Available Slots
              </h2>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {availableSlots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={`p-3 rounded-md border ${
                      selectedAvailabilityId === slot.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="availabilitySlot"
                        checked={selectedAvailabilityId === slot.id}
                        onChange={() => {
                          setSelectedAvailabilityId(slot.id)
                          setBookingDate(slot.date)
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium">
                          {slot.date} • {slot.startTime} - {slot.endTime}
                        </p>
                        {slot.description && (
                          <p className="text-sm text-gray-600 mt-1">{slot.description}</p>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {formErrors.availability && (
                <p className="mt-1 text-sm text-red-500">{formErrors.availability}</p>
              )}
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label htmlFor="bookedByName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="bookedByName"
                  value={bookedByName}
                  onChange={(e) => setBookedByName(e.target.value)}
                  className={`w-full border ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  } p-3 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="bookedByEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email
                </label>
                <input
                  type="email"
                  id="bookedByEmail"
                  value={bookedByEmail}
                  onChange={(e) => setBookedByEmail(e.target.value)}
                  className={`w-full border ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  } p-3 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="bookingDate"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className={`w-full border ${
                      formErrors.date ? 'border-red-500' : 'border-gray-300'
                    } p-3 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.date && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.date}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="bookingTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    id="bookingTime"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className={`w-full border ${
                      formErrors.time ? 'border-red-500' : 'border-gray-300'
                    } p-3 rounded-md focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {formErrors.time && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.time}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition duration-200 shadow-md"
              >
                Confirm Booking
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No available slots found for this user.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              Go back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}