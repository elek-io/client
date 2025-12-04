import { QueryClient } from '@tanstack/react-query';

/**
 * Tanstack Query instance with agressive caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
    },
  },
});
