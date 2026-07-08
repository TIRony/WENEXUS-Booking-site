import { BookingStatus, EventDto } from "@/lib/types";

const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "FAILED"];

interface BookingsFiltersProps {
  events: EventDto[];
  eventFilter: number | "";
  setEventFilter: (val: number | "") => void;
  statusFilter: BookingStatus | "";
  setStatusFilter: (val: BookingStatus | "") => void;
  setPage: (val: number) => void;
  onRefresh: () => void;
}

export default function BookingsFilters({
  events,
  eventFilter,
  setEventFilter,
  statusFilter,
  setStatusFilter,
  setPage,
  onRefresh,
}: BookingsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 items-end">
      <label className="flex flex-col text-sm">
        Filter by event
        <select
          className="border rounded px-2 py-1 mt-1"
          value={eventFilter}
          onChange={(e) => {
            setPage(1);
            setEventFilter(e.target.value ? Number(e.target.value) : "");
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
            setStatusFilter(e.target.value as BookingStatus | "");
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
        onClick={onRefresh}
        className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
      >
        Refresh now
      </button>
    </div>
  );
}
