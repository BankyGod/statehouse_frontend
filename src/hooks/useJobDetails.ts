import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/endpoints';
import type { Job, JobListing } from '../types/api';

/** Resolve the listing for an active job (may be in another state). */
export function useJobListing(job: Job | null | undefined) {
  const stateId = job?.state_id;
  const listingsQ = useQuery({
    queryKey: ['jobs', 'listings', 'for-job', stateId],
    queryFn: () => jobsApi.listings(stateId),
    enabled: stateId != null,
    staleTime: 60_000,
  });

  const listing: JobListing | undefined =
    listingsQ.data?.find((l) => l.id === job?.listing_id) ?? undefined;

  return { listing, listingsQ };
}
