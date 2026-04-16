export const ProductCardSkeleton = () => (
  <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
    <div className="aspect-square bg-muted" />
    <div className="p-3 space-y-2">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="h-3 w-1/2 rounded bg-muted" />
      <div className="h-5 w-2/3 rounded bg-muted" />
      <div className="h-8 w-full rounded bg-muted mt-2" />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);
