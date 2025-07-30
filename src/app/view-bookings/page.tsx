'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: number
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  startTime: string
  createdAt: string
  slotInfo?: {
    date: string
    startTime: string
    endTime: string
    description: string
  }
}

export default function ViewBookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id?: number; full_name?: string } | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUserAndFetchBookings = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          router.replace('/login')
          return
        }

        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)

        if (!parsedUser.id) {
          throw new Error('User ID not found')
        }

        // Fetch bookings for this user's availability slots
        const bookingsRes = await fetch(
          `/api/booking?user_id=${parsedUser.id}`,
          {
            credentials: 'include',
          }
        )

        if (!bookingsRes.ok) {
          throw new Error(
            `Failed to fetch bookings: ${bookingsRes.status} ${bookingsRes.statusText}`
          )
        }

        const bookingsData = await bookingsRes.json()
        console.log('Bookings data received:', bookingsData) // Debug log

        setBookings(bookingsData.bookings || [])
      } catch (err) {
        console.error('Error loading bookings or user data:', err)
        setError(`Failed to load bookings: ${(err as Error).message}`)

        // Only redirect to login if it's an auth issue
        if ((err as Error).message.includes('User ID not found')) {
          localStorage.removeItem('user')
          router.replace('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    checkUserAndFetchBookings()
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
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mr-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
          <button
            onClick={() => router.replace('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
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

        {/* Debug info - remove in production */}
        <div className="mb-4 p-3 bg-yellow-100 rounded-md">
          <p className="text-sm text-gray-700">
            Debug: Found {bookings.length} bookings for user {user?.id}
          </p>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white shadow-lg p-6 rounded-lg border border-gray-200"
              >
                <p className="mb-2">
                  <strong className="text-gray-700">Booked By:</strong>{' '}
                  <span className="text-gray-900">{booking.bookedByName}</span>
                </p>
                <p className="mb-2">
                  <strong className="text-gray-700">Email:</strong>{' '}
                  <span className="text-gray-900">{booking.bookedByEmail}</span>
                </p>
                <p className="mb-2">
                  <strong className="text-gray-700">Booking Time:</strong>{' '}
                  <span className="text-gray-900">{booking.startTime}</span>
                </p>

                {booking.slotInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Original Availability Slot:
                    </p>
                    <p className="text-sm text-gray-800">
                      📅 {booking.slotInfo.date}
                    </p>
                    <p className="text-sm text-gray-800">
                      ⏰ {booking.slotInfo.startTime} -{' '}
                      {booking.slotInfo.endTime}
                    </p>
                    <p className="text-sm text-gray-800">
                      📝 {booking.slotInfo.description}
                    </p>
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-500">
                  Booked on: {new Date(booking.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg mb-4">
              No bookings have been made for your availability slots yet.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Manage Your Availability
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
