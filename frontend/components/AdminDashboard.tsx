"use client";

import { useBookings } from "@/lib/hooks/useBookings";
import ErrorBanner from "./ErrorBanner";
import BookingsFilters from "./BookingsFilters";
import BookingsTable from "./BookingsTable";
import Pagination from "./Pagination";
import EventsCapacityTable from "./EventsCapacityTable";

export default function AdminDashboard() {
  const {
    events,
    bookings,
    page,
    setPage,
    totalPages,
    eventFilter,
    setEventFilter,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    loadBookings,
  } = useBookings(true); // true = enable polling

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <button
          type="button"
          className="mt-4 bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          <a href="/">Back to Bookings</a>
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Bookings refresh automatically every few seconds while queue workers
        process them.
      </p>

      <ErrorBanner error={error} />

      <EventsCapacityTable events={events} />

      <BookingsFilters
        events={events}
        eventFilter={eventFilter}
        setEventFilter={setEventFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setPage={setPage}
        onRefresh={loadBookings}
      />

      <BookingsTable bookings={bookings} loading={loading} />
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
}
