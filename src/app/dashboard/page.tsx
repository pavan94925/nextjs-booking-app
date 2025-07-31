'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface TimeSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isBooked?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  
  interface User {
    id: number;
    full_name?: string;
    // add other user properties if needed
  }
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allTimeSlots, setAllTimeSlots] = useState<TimeSlot[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [slotBeingEdited, setSlotBeingEdited] = useState<TimeSlot | null>(null);
  
  const [inputDate, setInputDate] = useState("");
  const [inputStartTime, setInputStartTime] = useState("");
  const [inputEndTime, setInputEndTime] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<number | null>(null);

  function getFilteredSlots() {
    if (selectedFilter === 'all') {
      return allTimeSlots;
    }
    if (selectedFilter === 'booked') {
      return allTimeSlots.filter(slot => slot.isBooked === true);
    }
    if (selectedFilter === 'available') {
      return allTimeSlots.filter(slot => slot.isBooked !== true);
    }
    return allTimeSlots;
  }

  function changeFilter(newFilter: string) {
    setSelectedFilter(newFilter);
    setIsFilterDropdownOpen(false);
  }

  function toggleFilterDropdown() {
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
  }

  async function getUserTimeSlots(userId: number) {
    try {
      const response = await fetch(`/api/availability?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setAllTimeSlots(data.slots || []);
      
    } catch (error) {
      console.error("Failed to get time slots:", error);
      setAllTimeSlots([]);
    }
  }

  useEffect(() => {
    function checkIfUserLoggedIn() {
      const savedUser = localStorage.getItem("user");
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          console.log("User found:", user);
          
          if (user.id) {
            getUserTimeSlots(user.id);
          }
        } catch (error) {
          console.error("Invalid user data:", error);
          localStorage.removeItem("user");
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
      
      setIsPageLoading(false);
    }

    if (typeof window !== "undefined") {
      checkIfUserLoggedIn();
    }
  }, [router]);

  function logUserOut() {
    localStorage.removeItem("user");
    router.replace("/login");
  }

  function openCreateForm() {
    setSlotBeingEdited(null);
    setInputDate("");
    setInputStartTime("");
    setInputEndTime("");
    setInputDescription("");
    setIsFormOpen(true);
  }

  function openEditForm(slot: TimeSlot) {
    setSlotBeingEdited(slot);
    setInputDate(slot.date);
    setInputStartTime(slot.startTime);
    setInputEndTime(slot.endTime);
    setInputDescription(slot.description);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setSlotBeingEdited(null);
    setInputDate("");
    setInputStartTime("");
    setInputEndTime("");
    setInputDescription("");
  }

  async function saveTimeSlot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isEditing = slotBeingEdited !== null;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
      ? `/api/availability/${slotBeingEdited.id}` 
      : '/api/availability';

    try {
      const dataToSend = {
        date: inputDate,
        startTime: inputStartTime,
        endTime: inputEndTime,
        description: inputDescription,
        user_id: currentUser?.id,
      };

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);

      if (currentUser?.id) {
        await getUserTimeSlots(currentUser.id);
      }

      closeForm();
      
    } catch (error) {
      console.error('Save failed:', error);
      if (error instanceof Error) {
        alert(`Failed to save: ${error.message}`);
      } else {
        alert('Failed to save: An unknown error occurred.');
      }
    }
  }

  function shareBookingLink(userId: number | undefined) {
    if (!userId) {
      alert("User ID not found. Please log in again.");
      return;
    }
    
    const bookingLink = `${window.location.origin}/booking/user/${userId}`;
    
    const tempInput = document.createElement('input');
    tempInput.value = bookingLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    alert(`Booking link copied to clipboard:\n${bookingLink}`);
  }

  function showDeleteConfirmation(slotId: number) {
    setSlotToDelete(slotId);
    setIsDeletePopupOpen(true);
  }

  async function deleteTimeSlot() {
    if (!slotToDelete) return;

    try {
      const response = await fetch(`/api/availability/${slotToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      console.log(`Slot ${slotToDelete} deleted successfully`);
      
      if (currentUser?.id) {
        await getUserTimeSlots(currentUser.id);
      }
      
      setIsDeletePopupOpen(false);
      setSlotToDelete(null);
      
    } catch (error) {
      console.error("Delete failed:", error);
      if (error instanceof Error) {
        alert(`Failed to delete: ${error.message}`);
      } else {
        alert('Failed to delete: An unknown error occurred.');
      }
      setIsDeletePopupOpen(false);
      setSlotToDelete(null);
    }
  }

  function cancelDelete() {
    setIsDeletePopupOpen(false);
    setSlotToDelete(null);
  }

  if (isPageLoading) return null;

  const filteredSlots = getFilteredSlots();

  return (
    <>
      <div className="min-h-screen bg-gray-100 font-sans">
        
        <nav className="bg-white shadow px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
          
          <div className="text-xl font-bold text-blue-600">📅 MyBooking</div>

          <div className="flex gap-3">
          <button
  onClick={openCreateForm}
  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition duration-200 text-sm sm:text-base shadow-md"
>
  Create Availability
</button>

          <button
  onClick={() => router.push("/view-bookings")}
  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-500 transition duration-200 text-sm sm:text-base shadow-md"
>
  View Bookings
</button>

          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">
              {currentUser?.full_name || "User"}
            </span>
  <button
  onClick={logUserOut}
  className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg text-sm sm:text-base"
>
  Logout
</button>

          </div>
        </nav>
        <div className="p-6">
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Your Availability</h2>
            
            <div className="relative">
              <button
                onClick={toggleFilterDropdown}
                className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="text-gray-700 font-medium">
                  {selectedFilter === 'all' && 'All'}
                  {selectedFilter === 'booked' && 'Booked'}
                  {selectedFilter === 'available' && 'Available'}
                </span>
                <span className={`text-gray-500 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`}>
                  Filter
                </span>
              </button>
              
              {isFilterDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => changeFilter('all')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg ${
                      selectedFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => changeFilter('booked')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                      selectedFilter === 'booked' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Booked
                  </button>
                  <button
                    onClick={() => changeFilter('available')}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 last:rounded-b-lg ${
                      selectedFilter === 'available' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    Available
                  </button>
                </div>
              )}
            </div>
          </div>

          {filteredSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSlots.map((slot: TimeSlot) => (
                <div 
                  key={slot.id} 
                  className={`shadow-lg p-6 rounded-lg border relative ${
                    slot.isBooked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                  }`}
                >
                  
                  {slot.isBooked ? (
                    <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      BOOKED
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      AVAILABLE
                    </div>
                  )}
                  
                  <p className="mb-2">
                    <strong className="text-gray-700">Date:</strong> 
                    <span className="text-gray-900"> {slot.date}</span>
                  </p>
                  <p className="mb-2">
                    <strong className="text-gray-700">Start:</strong> 
                    <span className="text-gray-900"> {slot.startTime}</span>
                  </p>
                  <p className="mb-2">
                    <strong className="text-gray-700">End:</strong> 
                    <span className="text-gray-900"> {slot.endTime}</span>
                  </p>
                  <p className="mb-4">
                    <strong className="text-gray-700">Description:</strong> 
                    <span className="text-gray-900"> {slot.description}</span>
                  </p>
                  
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => shareBookingLink(currentUser?.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 text-sm shadow-md"
                    >
                      {slot.isBooked ? 'View Link' : 'Share'}
                    </button>
                    
                    {!slot.isBooked && (
                      <>
                        <button
                          onClick={() => openEditForm(slot)}
                          className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-200 text-sm shadow-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => showDeleteConfirmation(slot.id)}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200 text-sm shadow-md"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-lg">
              {selectedFilter === 'all' 
                ? "No availability slots yet. Click 'Create Availability' to add one!" 
                : `No ${selectedFilter} slots found.`
              }
            </p>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative animate-fade-in-up">
            
            <button
              onClick={closeForm}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-2xl font-bold transition duration-200"
              aria-label="Close"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {slotBeingEdited ? "Edit Availability Slot" : "Set Your Availability"}
            </h2>

            <form onSubmit={saveTimeSlot} className="space-y-5">
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={inputStartTime}
                  onChange={(e) => setInputStartTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={inputEndTime}
                  onChange={(e) => setInputEndTime(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  value={inputDescription}
                  onChange={(e) => setInputDescription(e.target.value)}
                  required
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-200 font-semibold text-lg shadow-md"
              >
                {slotBeingEdited ? "Update Availability" : "Save Availability"}
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm relative animate-fade-in-up">
            
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
              Confirm Deletion
            </h2>
            
            <p className="text-gray-700 mb-6 text-center">
              Are you sure you want to delete this availability slot? This action cannot be visible.
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={deleteTimeSlot}
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