import { QueryClient } from '@tanstack/react-query';

/**
 * React Query client configuration.
 * - staleTime: 2 minutes (data considered fresh)
 * - No retries on 401/403 (auth errors)
 * - Refetch on window focus (pull-based updates)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: (failureCount, error: unknown) => {
        // Don't retry auth errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});
