"use client";

import { useEffect } from "react";
import { trackRecentlyViewed } from "@/lib/history";

type Props = {
  id: string;
  title: string | null;
  priceAed: string | null;
  condition: string | null;
  mainImageUrl: string | null;
  isFeatured?: boolean;
  status?: string;
};

/** Records a listing view in localStorage (client-only). */
export function TrackListingView(props: Props) {
  useEffect(() => {
    trackRecentlyViewed(props);
    // Only re-track when the listing id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);
  return null;
}
