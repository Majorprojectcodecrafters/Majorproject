export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden="true" />;
}

export function TableSkeleton({ rows = 4, columns = 5 }) {
  return (
    <div className="space-y-3" aria-label="Loading table">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid gap-4 sm:grid-cols-5">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-5" />
          ))}
        </div>
      ))}
    </div>
  );
}
