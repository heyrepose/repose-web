import Link from "next/link";

type Props = {
  seller: {
    id: string;
    username: string;
    avatarUrl?: string | null;
    ratingAvg?: number;
    ratingCount?: number;
    reviewCount?: number;
  };
};

export function SellerCard({ seller }: Props) {
  const reviewCount = seller.reviewCount ?? seller.ratingCount;

  return (
    <Link
      href={`/seller/${seller.username}`}
      className="group mt-4 flex items-center justify-between rounded-[12px] border border-card-border bg-surface p-4 transition-all duration-200 hover:bg-accent-soft/30 hover:border-primary/20"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-accent-soft">
          {seller.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
              {seller.username.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text truncate">
            @{seller.username}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted">
            {seller.ratingAvg != null && (
              <span className="font-medium text-primary">
                {Number(seller.ratingAvg).toFixed(1)}★
              </span>
            )}
            {reviewCount ? <span>({reviewCount})</span> : null}
          </div>
        </div>
      </div>
      
      <div className="text-xs font-semibold uppercase tracking-wider text-primary group-hover:underline">
        View Closet
      </div>
    </Link>
  );
}
