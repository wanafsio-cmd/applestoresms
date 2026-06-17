import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";

/**
 * Drop-in replacement for `useMutation` that adds:
 * - Friendly Bengali toast on error (via toUserMessage)
 * - Optional success toast
 * - Sanitized console logging
 *
 * Custom onError still runs AFTER the default toast, unless `silentError: true`.
 */
export function useSafeMutation<TData, TError, TVariables, TContext>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    successMessage?: string;
    errorPrefix?: string;
    silentError?: boolean;
  }
) {
  const { successMessage, errorPrefix, silentError, onSuccess, onError, ...rest } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    onSuccess: (data, variables, ctx) => {
      if (successMessage) toast.success(successMessage);
      onSuccess?.(data, variables, ctx);
    },
    onError: (error, variables, ctx) => {
      if (!silentError) {
        const msg = toUserMessage(error);
        toast.error(errorPrefix ? `${errorPrefix}: ${msg}` : msg);
      }
      // eslint-disable-next-line no-console
      console.error("[mutation]", error);
      onError?.(error, variables, ctx);
    },
  });
}
