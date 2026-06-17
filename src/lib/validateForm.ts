import { toast } from "sonner";
import type { ZodSchema } from "zod";

/**
 * Validate form data with a zod schema. On failure, toast the first error
 * and return null. On success, return the parsed (and type-narrowed) data.
 *
 * Usage:
 *   const parsed = validateOrToast(productSchema, data);
 *   if (!parsed) return;
 *   addMutation.mutate(parsed);
 */
export function validateOrToast<T>(schema: ZodSchema<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.errors[0];
    const path = first.path.length ? `${first.path.join(".")}: ` : "";
    toast.error(`${path}${first.message}`);
    return null;
  }
  return result.data;
}
