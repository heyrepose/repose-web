"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Spinner } from "@/components/ui/spinner";

type Report = {
  listingId: string;
  title: string;
  flagReason: string;
  reportedAt: string;
};

export default function AdminReportsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => apiFetch<Report[]>("/admin/reports?limit=40"),
  });

  return (
    <div>
      <h1 className="font-display text-2xl">Reports</h1>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-muted">Could not load reports.</p>
      ) : !data?.length ? (
        <p className="mt-8 text-sm text-muted">No open reports.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {data.map((r) => (
            <li
              key={`${r.listingId}-${r.reportedAt}`}
              className="rounded-card border border-card-border bg-surface p-4 text-sm shadow-card"
            >
              <p className="font-medium">{r.title}</p>
              <p className="text-muted">{r.flagReason}</p>
              <p className="mt-1 text-xs text-muted">
                {new Date(r.reportedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
