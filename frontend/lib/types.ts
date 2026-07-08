export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

export interface EventDto {
  id: number;
  name: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  priceCents: number;
}

export interface BookingDto {
  id: string;
  requestId: string;
  bookingReference: string;
  eventId: number;
  eventName?: string;
  customerName: string;
  customerEmail: string;
  seats: number;
  status: BookingStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedBookings {
  data: BookingDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
