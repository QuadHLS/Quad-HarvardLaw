import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 * 
 * This client handles:
 * - Caching Supabase queries
 * - Deduplicating simultaneous requests
 * - Background revalidation
 * - Stale data management
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes (data stays fresh for 5 min)
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime
      // Retry failed requests 1 time
      retry: 1,
      // Don't refetch on window focus (better UX - no loading spinners when switching tabs)
      // Data is still fresh for 5 minutes, so refetching is unnecessary
      refetchOnWindowFocus: false,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations 1 time
      retry: 1,
    },
  },
});

