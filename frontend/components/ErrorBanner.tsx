export default function ErrorBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-red-600 text-sm mb-3">Error: {error}</p>;
}
