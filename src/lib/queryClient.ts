import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { toUserMessage } from "./errors";

/**
 * Shared QueryClient with sensible defaults and global error handling.
 * - Reads: show toast on background failure (silently retried twice first).
 * - Mutations without their own onError still surface a toast.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have observers (active screens)
      if (query.state.data === undefined) {
        toast.error(toUserMessage(error));
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      // Skip if the mutation defines its own onError
      if (mutation.options.onError) return;
      toast.error(toUserMessage(error));
    },
  }),
});
