interface PaginationProps {
  page: number;
  totalPages: number;
  setPage: (page: number | ((p: number) => number)) => void;
}

export default function Pagination({
  page,
  totalPages,
  setPage,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        className="border rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
      >
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        className="border rounded px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}
