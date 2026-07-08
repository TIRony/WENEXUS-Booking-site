import { useCallback, useEffect, useState } from 'react';
import { fetchBookings, fetchEvents } from '@/lib/api';
import { BookingDto, BookingStatus, EventDto } from '@/lib/types';

const LIMIT = 10;
const POLL_MS = 4000;

export function useBookings(enablePolling = true) {
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

  // Initial event load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Bookings load & polling
  useEffect(() => {
    setLoading(true);
    loadBookings();
    
    if (!enablePolling) return;

    const interval = setInterval(loadBookings, POLL_MS);
    return () => clearInterval(interval);
  }, [loadBookings, enablePolling]);

  return {
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
  };
}