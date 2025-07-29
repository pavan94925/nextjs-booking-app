'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: number
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  startTime: string // HH:MM
  endTime?: string // Optional, if your bookings table has it
  createdAt: string // ISO string
}

interface AvailabilitySlot {
  id: number
  date: string
  startTime: string
  endTime: string
  description: string
}

export default function ViewBookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id?: number; full_name?: string } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [availabilitySlotsMap, setAvailabilitySlotsMap] = useState<
    Map<number, AvailabilitySlot>
  >(new Map())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUserAndFetchBookings = async () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Fetch bookings
          const bookingsRes = await fetch('/api/bookings', {
            credentials: 'include',
          })
          if (!bookingsRes.ok) {
            throw new Error(
              `Failed to fetch bookings: ${bookingsRes.statusText}`
            )
          }
          const bookingsData = await bookingsRes.json()
          setBookings(bookingsData.bookings || [])

          // Fetch own availability slots to display details
          if (parsedUser.id) {
            const availabilityRes = await fetch(
              `/api/availability?user_id=${parsedUser.id}`
            )
            if (!availabilityRes.ok) {
              throw new Error(
                `Failed to fetch availability: ${availabilityRes.statusText}`
              )
            }
            const availabilityData = await availabilityRes.json()
            const map = new Map<number, AvailabilitySlot>()
            ;(availabilityData.slots || []).forEach(
              (slot: AvailabilitySlot) => {
                map.set(slot.id, slot)
              }
            )
            setAvailabilitySlotsMap(map)
          }
        } catch (err) {
          console.error('Error loading bookings or user data:', err)
          setError(`Failed to load bookings: ${(err as Error).message}`)
          localStorage.removeItem('user') // Clear invalid user data
          router.replace('/login') // Redirect to login
        }
      } else {
        router.replace('/login')
      }
      setLoading(false)
    }

    if (typeof window !== 'undefined') {
      checkUserAndFetchBookings()
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Loading your bookings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-600 text-lg">Error: {error}</p>
        <button
          onClick={() => router.replace('/login')}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div className="text-xl font-bold text-blue-600">📅 MyBooking</div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 text-sm sm:text-base shadow-md"
          >
            My Availability
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-700 font-medium">
            {user?.full_name || 'User'}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition duration-200 text-sm sm:text-base shadow-md"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Bookings section */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Bookings for Your Availability
        </h2>
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const originalSlot = availabilitySlotsMap.get(
                booking.availabilityId
              )
              return (
                <div
                  key={booking.id}
                  className="bg-white shadow-lg p-6 rounded-lg border border-gray-200"
                >
                  <p className="mb-2">
                    <strong className="text-gray-700">Booked By:</strong>{' '}
                    <span className="text-gray-900">
                      {booking.bookedByName}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong className="text-gray-700">Email:</strong>{' '}
                    <span className="text-gray-900">
                      {booking.bookedByEmail}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong className="text-gray-700">Booking Time:</strong>{' '}
                    <span className="text-gray-900">{booking.startTime}</span>
                  </p>
                  {originalSlot && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Original Availability:
                      </p>
                      <p className="text-sm text-gray-800">
                        {originalSlot.date} from {originalSlot.startTime} to{' '}
                        {originalSlot.endTime}
                      </p>
                      <p className="text-sm text-gray-800">
                        Description: {originalSlot.description}
                      </p>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-gray-500">
                    Booked on: {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-600 text-lg">
            No bookings have been made for your availability slots yet.
          </p>
        )}
      </div>
    </div>
  )
}
