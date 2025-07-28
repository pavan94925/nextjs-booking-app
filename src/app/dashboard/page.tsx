'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id?: number; full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [slots, setSlots] = useState([]);

  // ✅ Function to fetch user's slots
  const fetchSlots = async (userId: number) => {
    try {
      const res = await fetch(`/api/availability?user_id=${userId}`);
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
          fetchSlots(parsedUser.id);
        } catch (error) {
          console.error("Invalid user JSON");
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

  // ✅ Submit availability
  const handleSubmit = async (e: any) => {
    e.preventDefault();

   const res = await fetch("/api/availability", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ date, startTime, endTime, description }),
  credentials: "include" // ✅ sends the userId cookie to backend
});

    const data = await res.json();
    console.log(data);

    if (user?.id) {
      await fetchSlots(user.id); // refresh slots
    }

    setShowForm(false);
  };

  // ✅ Share slot handler
  const handleShare = () => {
  const bookingUrl = `${window.location.origin}/booking/user/${user?.id}`;
  navigator.clipboard.writeText(bookingUrl);
  alert(`Booking link copied to clipboard:\n${bookingUrl}`);
};

  if (loading) return null;

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Navbar */}
        <nav className="bg-white shadow px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
          <div className="text-xl font-bold text-blue-600">📅 MyBooking</div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm sm:text-base"
            >
              Create Availability
            </button>
            <button
              onClick={() => router.push("/view-bookings")}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm sm:text-base"
            >
              View Bookings
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">{user?.full_name || "User"}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Availability section */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Your Availability</h2>
          {slots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slots.map((slot: any) => (
                <div key={slot.id} className="bg-white shadow p-4 rounded border">
                  <p><strong>Date:</strong> {slot.date}</p>
                  <p><strong>Start:</strong> {slot.startTime}</p>
                  <p><strong>End:</strong> {slot.endTime}</p>
                  <p><strong>Description:</strong> {slot.description}</p>
                 <button
  onClick={handleShare}
  className="mt-3 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
>
  Share
</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No availability slots yet.</p>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600"
            >
              ✖
            </button>

            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Set Your Availability</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full border p-2 rounded mt-1"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Save Availability
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
