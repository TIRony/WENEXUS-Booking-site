import { BookingDto, EventDto, PaginatedBookings } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // ignore body parse errors, fall back to generic message
    }
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return res.json() as Promise<T>;
}

export function fetchEvents(): Promise<EventDto[]> {
  return request<EventDto[]>('/events');
}

export function fetchBookings(params: {
  page: number;
  limit: number;
  eventId?: number;
  status?: string;
}): Promise<PaginatedBookings> {
  const search = new URLSearchParams();
  search.set('page', String(params.page));
  search.set('limit', String(params.limit));
  if (params.eventId) search.set('eventId', String(params.eventId));
  if (params.status) search.set('status', params.status);
  return request<PaginatedBookings>(`/bookings?${search.toString()}`);
}

export function createBooking(payload: {
  requestId: string;
  eventId: number;
  customerName: string;
  customerEmail: string;
  seats: number;
}): Promise<BookingDto> {
  return request<BookingDto>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
