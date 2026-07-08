'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchBookings, fetchEvents } from '@/lib/api';
import { BookingDto, BookingStatus, EventDto } from '@/lib/types';
import BookingForm from './BookingForm';

const STATUSES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'FAILED'];
const LIMIT = 10;
const POLL_MS = 4000;

function statusColor(status: BookingStatus) {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-800';
  if (status === 'FAILED') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800';
}

export default function BookingsDashboard() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [eventFilter, setEventFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const evs = await fetchEvents();
      setEvents(evs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      const result = await fetchBookings({
        page,
        limit: LIMIT,
        eventId: eventFilter || undefined,
        status: statusFilter || undefined,
      });
      setBookings(result.data);
      setTotalPages(result.meta.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    setLoading(true);
    loadBookings();
    const interval = setInterval(loadBookings, POLL_MS);
    return () => clearInterval(interval);
  }, [loadBookings]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Event Booking Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">
        Bookings refresh automatically every few seconds while queue workers process them.
      </p>

      <BookingForm events={events} onBookingCreated={loadBookings} />

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <label className="flex flex-col text-sm">
          Filter by event
          <select
            className="border rounded px-2 py-1 mt-1"
            value={eventFilter}
            onChange={(e) => {
              setPage(1);
              setEventFilter(e.target.value ? Number(e.target.value) : '');
            }}
          >
            <option value="">All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Filter by status
          <select
            className="border rounded px-2 py-1 mt-1"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value as BookingStatus | '');
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={loadBookings}
          className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
        >
          Refresh now
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-3">Error: {error}</p>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Reference</th>
              <th className="p-2">Event</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Seats</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No bookings yet.
                </td>
              </tr>
            )}
            {!loading &&
              bookings.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-2 font-mono">{b.bookingReference}</td>
                  <td className="p-2">{b.eventName || `Event #${b.eventId}`}</td>
                  <td className="p-2">
                    {b.customerName}
                    <div className="text-xs text-gray-500">{b.customerEmail}</div>
                  </td>
                  <td className="p-2">{b.seats}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColor(b.status)}`}>
                      {b.status}
                    </span>
                    {b.status === 'FAILED' && b.failureReason && (
                      <div className="text-xs text-gray-500 mt-0.5">{b.failureReason}</div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="border rounded px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="border rounded px-3 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
