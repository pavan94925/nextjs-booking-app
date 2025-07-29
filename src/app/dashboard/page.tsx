'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Define an interface for your slot data for better type safety
interface Slot {
  id: number; // Assuming your slots have an ID
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  // Add any other properties your slot might have, e.g., userId
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: number; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null); // State for the slot being edited

  // New states for delete functionality
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDeleteId, setSlotToDeleteId] = useState<number | null>(null);

  // Form states
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]); // Use the Slot interface for slots array

  // ✅ Function to fetch user's slots
  const fetchSlots = async (userId: number) => {
    try {
      const res = await fetch(`/api/availability?user_id=${userId}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setSlots([]);
    }
  };

  // ✅ Check user on load
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log("Parsed user:", parsedUser);
          if (parsedUser.id) {
            fetchSlots(parsedUser.id);
          }
        } catch (error) {
          console.error("Invalid user JSON in localStorage:", error);
          localStorage.removeItem("user");
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
      setLoading(false);
    };

    if (typeof window !== "undefined") {
      checkUser();
    }
  }, [router]);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.replace("/login");
  };

  // Handle Edit Button Click
  const handleEdit = (slot: Slot) => {
    setEditingSlot(slot); // Set the slot being edited
    setDate(slot.date);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setDescription(slot.description);
    setShowForm(true); // Open the form
  };

  // Submit availability (handles both creation and editing)
 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()

   // Determine HTTP method and URL based on whether we are editing or creating
   const method = editingSlot ? 'PUT' : 'POST'
   const url = editingSlot
     ? `/api/availability/${editingSlot.id}`
     : '/api/availability'

   try {
     // Create request body - include user_id for both create and edit operations
     const requestBody = {
       date,
       startTime,
       endTime,
       description,
       user_id: user?.id, // Add user_id to ensure we're updating the correct user's slot
     }

     const res = await fetch(url, {
       method: method,
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(requestBody), // Use the requestBody object
       credentials: 'include',
     })

     if (!res.ok) {
       const errorData = await res.json()
       throw new Error(errorData.message || `HTTP error! status: ${res.status}`)
     }

     const data = await res.json()
     console.log('API response:', data)

     // Refresh slots after successful operation
     if (user?.id) {
       await fetchSlots(user.id)
     }

     // Reset form states and close form after successful submission
     setDate('')
     setStartTime('')
     setEndTime('')
     setDescription('')
     setEditingSlot(null) // Clear editing slot state
     setShowForm(false)
   } catch (error) {
     console.error('Error submitting availability:', error)
     alert(`Failed to save availability: ${(error as Error).message}`)
   }
 }
  // Share slot handler
  const handleShare = (userId: number | undefined) => {
    if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
    }
    const bookingUrl = `${window.location.origin}/booking/user/${userId}`;
    const tempInput = document.createElement('input');
    tempInput.value = bookingUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert(`Booking link copied to clipboard:\n${bookingUrl}`);
  };

  // --- NEW: Handle Delete Button Click ---
  const handleDeleteClick = (slotId: number) => {
    setSlotToDeleteId(slotId);
    setShowDeleteConfirm(true); // Show the confirmation modal
  };

  // --- NEW: Confirm Delete Function ---
  const confirmDelete = async () => {
    if (slotToDeleteId === null) return; // Should not happen if modal is shown correctly

    try {
      const res = await fetch(`/api/availability/${slotToDeleteId}`, {
        method: 'DELETE',
        credentials: 'include' // Send userId cookie
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      console.log(`Slot ${slotToDeleteId} deleted successfully.`);
      // Refresh slots after deletion
      if (user?.id) {
        await fetchSlots(user.id);
      }
      setShowDeleteConfirm(false); // Close modal
      setSlotToDeleteId(null); // Clear ID
    } catch (error) {
      console.error("Error deleting availability:", error);
      alert(`Failed to delete availability: ${(error as Error).message}`);
      setShowDeleteConfirm(false); // Close modal even on error
      setSlotToDeleteId(null); // Clear ID
    }
  };

  // --- NEW: Cancel Delete Function ---
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSlotToDeleteId(null);
  };

  if (loading) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-sans">
        {/* Navbar */}
        <nav className="bg-white shadow px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
          <div className="text-xl font-bold text-blue-600">📅 MyBooking</div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingSlot(null); // Ensure no slot is being edited when creating new
                setDate(""); // Clear form fields
                setStartTime("");
                setEndTime("");
                setDescription("");
                setShowForm(true); // Open the form
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 text-sm sm:text-base shadow-md"
            >
              Create Availability
            </button>
            <button
              onClick={() => router.push("/view-bookings")}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition duration-200 text-sm sm:text-base shadow-md"
            >
              View Bookings
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.full_name || "User"}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition duration-200 text-sm sm:text-base shadow-md"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Availability section */}
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Availability</h2>
          {slots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {slots.map((slot: Slot) => (
                <div key={slot.id} className="bg-white shadow-lg p-6 rounded-lg border border-gray-200">
                  <p className="mb-2"><strong className="text-gray-700">Date:</strong> <span className="text-gray-900">{slot.date}</span></p>
                  <p className="mb-2"><strong className="text-gray-700">Start:</strong> <span className="text-gray-900">{slot.startTime}</span></p>
                  <p className="mb-2"><strong className="text-gray-700">End:</strong> <span className="text-gray-900">{slot.endTime}</span></p>
                  <p className="mb-4"><strong className="text-gray-700">Description:</strong> <span className="text-gray-900">{slot.description}</span></p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleShare(user?.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm shadow-md"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleEdit(slot)}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200 text-sm shadow-md"
                    >
                      Edit
                    </button>
                    {/* --- NEW: Delete Button --- */}
                    <button
                      onClick={() => handleDeleteClick(slot.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm shadow-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-lg">No availability slots yet. Click "Create Availability" to add one!</p>
          )}
        </div>
      </div>

      {/* Form Modal (Create/Edit) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative animate-fade-in-up">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingSlot(null); // Clear editing state when closing form
                setDate(""); // Clear form fields
                setStartTime("");
                setEndTime("");
                setDescription("");
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl font-bold transition duration-200"
              aria-label="Close"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {editingSlot ? "Edit Availability Slot" : "Set Your Availability"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-200 font-semibold text-lg shadow-md"
              >
                {editingSlot ? "Update Availability" : "Save Availability"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm relative animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Confirm Deletion</h2>
            <p className="text-gray-700 mb-6 text-center">
              Are you sure you want to delete this availability slot? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 font-semibold shadow-md"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200 font-semibold shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}