import { BookingDto, BookingStatus } from "@/lib/types";

function statusColor(status: BookingStatus) {
  if (status === "CONFIRMED") return "bg-green-100 text-green-800";
  if (status === "FAILED") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

interface BookingsTableProps {
  bookings: BookingDto[];
  loading: boolean;
}

export default function BookingsTable({
  bookings,
  loading,
}: BookingsTableProps) {
  return (
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
                No bookings found.
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
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${statusColor(b.status)}`}
                  >
                    {b.status}
                  </span>
                  {b.status === "FAILED" && b.failureReason && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {b.failureReason}
                    </div>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
