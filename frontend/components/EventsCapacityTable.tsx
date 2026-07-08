import { EventDto } from "@/lib/types";

export default function EventsCapacityTable({
  events,
}: {
  events: EventDto[];
}) {
  if (events.length === 0) return null;

  return (
    <div className="mb-6 border rounded-lg bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="p-2">Event Name</th>
            <th className="p-2">Capacity / Total</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id} className="border-t">
              <td className="p-2">{ev.name}</td>
              <td className="p-2">{ev.availableSeats || "N/A"} / {ev.totalSeats || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
