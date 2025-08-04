'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserBookings } from '@/actions/bookingActions'

interface SlotInfo {
  date: string
  startTime: string
  endTime: string
  description: string
}

interface User {
  id: number
  full_name?: string
}

interface Booking {
  id: number
  availabilityId: number
  bookedByName: string
  bookedByEmail: string
  startTime: string
  createdAt: string
  slotInfo?: SlotInfo
}
const formatDisplayDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return isNaN(date.getTime())
      ? 'Not specified'
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
  } catch {
    return 'Not specified'
  }
}

const formatDisplayTime = (timeString: string): string => {
  try {
    const date = new Date(`1970-01-01T${timeString}`) // dummy date with UTC time
    return isNaN(date.getTime())
      ? 'Not specified'
      : date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
  } catch {
    return 'Not specified'
  }
}


export default function ViewBookingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if we're running on client side
        if (typeof window === 'undefined') return

        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
          router.replace('/login')
          return
        }

        const userData: User = JSON.parse(storedUser)
        setUser(userData)

        if (!userData.id) {
          throw new Error('User ID not found')
        }

        const result = await getUserBookings(String(userData.id))
        console.log('API Response:', result) // Debug log

        if (result?.success) {
          setBookings(result.bookings || [])
        } else {
          throw new Error(result?.message || 'Failed to load bookings')
        }
      } catch (err) {
        console.error('Error loading data:', err)
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred'
        setError(`Failed to load bookings: ${errorMessage}`)

        if (errorMessage.includes('User ID not found')) {
          localStorage.removeItem('user')
          router.replace('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
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
            Try Again
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
      <nav className="bg-white shadow px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
        <div className="text-xl font-bold text-blue-600">MyBooking</div>
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
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Bookings for Your Availability
        </h2>
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white shadow-lg p-6 rounded-lg border border-gray-200"
              >
                <h3 className="text-lg font-semibold mb-2">
                  {booking.bookedByName}
                </h3>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Email:</span>{' '}
                  {booking.bookedByEmail}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Date:</span>{' '}
                  {formatDisplayDate(booking.slotInfo?.date || '')}
                </p>
                <p className="text-gray-600 mb-1">
                  <span className="font-medium">Time:</span>{' '}
                  {formatDisplayTime(booking.startTime || '')}
                </p>
                {booking.slotInfo?.description && (
                  <p className="text-gray-600">
                    <span className="font-medium">Description:</span>{' '}
                    {booking.slotInfo.description}
                  </p>
                )}
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


// {
//   "success": true, "bookings":
//   [{
//     "id": 14, "availabilityId": 30,
//     "bookedByName": "naveen", "bookedByEmail": "naveen@gmail.com",
//     "startTime": "02:12:00", "createdAt": "2025-08-04T04:43:01.160Z",
//     "slotInfo": {
//       "date": "2025-08-12",
//       "startTime": "02:39:00",
//       "endTime": "04:39:00",
//       "description": "class"
//     }
//   }, {
//     "id": 15, "availabilityId": 30,
//     "bookedByName": "rakesh", "bookedByEmail": "rakesh@gmail.com",
//     "startTime": "04:39:00", "createdAt": "2025-08-04T04:48:25.847Z",
//     "slotInfo": {
//       "date": "2025-08-12",
//       "startTime": "02:39:00",
//       "endTime": "04:39:00",
//       "description": "class"
//     }
//   }, {
//     "id": 16, "availabilityId": 32,
//     "bookedByName": "sadhik", "bookedByEmail": "sadhik@gmail.com",
//     "startTime": "14:37:00", "createdAt": "2025-08-04T05:08:02.836Z",
//     "slotInfo": {
//       "date": "2025-08-06",
//       "startTime": "14:37:00",
//       "endTime": "15:37:00",
//       "description": "demo"
//     }
//   }]
// }