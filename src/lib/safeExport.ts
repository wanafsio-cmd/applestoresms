import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";

/**
 * Wraps export operations (Excel/PDF/print) with consistent error handling
 * and offline guard. Shows Bengali toasts on failure / success.
 */
export async function safeExport(
  fn: () => void | Promise<void>,
  opts: { successMessage?: string; errorPrefix?: string } = {}
): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    toast.error("ইন্টারনেট সংযোগ নেই — এক্সপোর্ট করা যাচ্ছে না");
    return false;
  }
  try {
    await fn();
    if (opts.successMessage) toast.success(opts.successMessage);
    return true;
  } catch (err) {
    console.error("[safeExport]", err);
    toast.error(toUserMessage(err, opts.errorPrefix || "এক্সপোর্ট ব্যর্থ হয়েছে"));
    return false;
  }
}
