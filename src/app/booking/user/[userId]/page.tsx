'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function BookingPage() {
  const { userId } = useParams();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    notes: '',
    bookedByName: '',
    bookedByEmail: ''
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  const fetchSlots = async () => {
    try {
      // Fixed: Use correct API endpoint with query parameter
      const res = await fetch(`/api/availability?user_id=${userId}`);
      const data = await res.json();
      console.log('Fetched slots:', data);
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSlots();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.bookedByName || !formData.bookedByEmail) {
      alert('Please fill in your name and email');
      return;
    }

    try {
      const res = await fetch(`/api/booking`, {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          hostUserId: userId,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok) {
        alert('Booking confirmed!');
        setFormData({
          date: '',
          time: '',
          notes: '',
          bookedByName: '',
          bookedByEmail: ''
        });
        fetchSlots(); // Refresh slots
      } else {
        alert(data.message || 'Booking failed');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-4 border rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Book a Time Slot</h2>

      {/* Show available slots */}
      <div className="mb-4">
        <h4 className="font-medium">Available Slots</h4>
        {availableSlots.length === 0 ? (
          <p className="text-gray-500">No slots found</p>
        ) : (
          <ul className="list-disc list-inside">
            {availableSlots.map((slot: any, idx) => (
              <li key={idx}>
                {slot.date} from {slot.startTime} to {slot.endTime} - {slot.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="bookedByName"
          value={formData.bookedByName}
          onChange={handleChange}
          placeholder="Your Name"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="email"
          name="bookedByEmail"
          value={formData.bookedByEmail}
          onChange={handleChange}
          placeholder="Your Email"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add notes..."
          className="w-full border p-2 rounded"
        />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Confirm Booking
        </button>
      </form>
    </div>
  );
}