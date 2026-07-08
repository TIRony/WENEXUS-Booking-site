"use client";

import { useBookings } from "@/lib/hooks/useBookings";
import ErrorBanner from "./ErrorBanner";
import BookingForm from "./BookingForm";

export default function BookingsDashboard() {
  // Pass false if you don't need polling on the public event creation page
  const { events, error, loadBookings } = useBookings(false);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold mb-1">Book Your Event</h1>
        <button
          type="button"
          className="mt-4 bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          <a href="/admin">Go to Admin Dashboard</a>
        </button>
      </div>
      <ErrorBanner error={error} />

      <BookingForm events={events} onBookingCreated={loadBookings} />
    </div>
  );
}
