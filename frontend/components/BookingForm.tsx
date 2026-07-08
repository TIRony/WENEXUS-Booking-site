"use client";

import { useState } from "react";
import { createBooking } from "@/lib/api";
import { EventDto } from "@/lib/types";

function newRequestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function BookingForm({
  events,
  onBookingCreated,
}: {
  events: EventDto[];
  onBookingCreated: () => void;
}) {
  const [eventId, setEventId] = useState<number | "">("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [seats, setSeats] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!eventId) {
      setError("Please choose an event.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await createBooking({
        requestId: newRequestId(),
        eventId: Number(eventId),
        customerName,
        customerEmail,
        seats,
      });
      setSuccess(
        `Booking ${booking.bookingReference} submitted (status: ${booking.status}). It will update shortly.`,
      );
      setCustomerName("");
      setCustomerEmail("");
      setSeats(1);
      onBookingCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-lg p-4 mb-6 bg-white"
    >
      <h2 className="font-semibold mb-3">New booking</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">
          Event
          <select
            className="border rounded px-2 py-1 mt-1"
            value={eventId}
            onChange={(e) =>
              setEventId(e.target.value ? Number(e.target.value) : "")
            }
            required
          >
            <option value="">Select an event...</option>
            {events.map((ev) => (
              <option
                key={ev.id}
                value={ev.id}
                disabled={ev.availableSeats === 0}
              >
                {ev.name} ({ev.availableSeats} seats left)
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm">
          Seats
          <input
            type="number"
            min={1}
            className="border rounded px-2 py-1 mt-1"
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            required
          />
        </label>

        <label className="flex flex-col text-sm">
          Customer name
          <input
            type="text"
            className="border rounded px-2 py-1 mt-1"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col text-sm">
          Customer email
          <input
            type="email"
            className="border rounded px-2 py-1 mt-1"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Book seats"}
      </button>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      {success && <p className="text-green-700 text-sm mt-2">{success}</p>}
    </form>
  );
}
