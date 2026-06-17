/**
 * Centralized error → friendly Bengali message mapper.
 * Use this anywhere we catch an error and want to show it to the user.
 */

type AnyError = unknown;

const PG_CODE_MAP: Record<string, string> = {
  "23505": "এই তথ্য ইতিমধ্যে বিদ্যমান (ডুপ্লিকেট এন্ট্রি)।",
  "23503": "সম্পর্কিত রেকর্ড পাওয়া যায়নি।",
  "23502": "প্রয়োজনীয় তথ্য অনুপস্থিত।",
  "23514": "তথ্য বৈধতা যাচাইয়ে ব্যর্থ।",
  "22023": "অবৈধ ইনপুট।",
  "22P02": "ইনপুট ফরম্যাট সঠিক নয়।",
  "42501": "এই কাজটি করার অনুমতি নেই।",
  "PGRST116": "কোনো ডাটা পাওয়া যায়নি।",
  "PGRST301": "অনুরোধ অগ্রহণযোগ্য।",
  "P0001": "অপারেশন সম্পন্ন করা যায়নি।",
  "P0002": "রেকর্ড পাওয়া যায়নি।",
};

function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function toUserMessage(error: AnyError, fallback = "একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।"): string {
  if (!error) return fallback;
  if (isOffline()) return "ইন্টারনেট সংযোগ নেই। সংযোগ চেক করুন।";

  if (typeof error === "string") return error;

  const e = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
    error_description?: string;
    name?: string;
  };

  // Supabase / PostgREST error with code
  if (e.code && PG_CODE_MAP[e.code]) {
    const base = PG_CODE_MAP[e.code];
    // If the DB raised a custom message via RAISE EXCEPTION, prefer it
    if (e.message && (e.code === "P0001" || e.code === "22023" || e.code === "42501")) {
      return e.message;
    }
    return base;
  }

  // Network / fetch errors
  const msg = e.message || e.error_description || "";
  if (/failed to fetch|networkerror|network request failed/i.test(msg)) {
    return "সার্ভারে সংযোগ করা যাচ্ছে না।";
  }
  if (/jwt|token|unauthor/i.test(msg)) {
    return "লগইন সেশন শেষ হয়ে গেছে। আবার লগইন করুন।";
  }

  // Already-Bengali messages from our RPCs come through here
  if (msg && /[\u0980-\u09FF]/.test(msg)) return msg;

  return msg || fallback;
}

/**
 * Tiny helper to wrap async actions with a friendly toast on failure.
 * Usage: await safeRun(() => doThing(), { toast, errorPrefix: "সেভ ব্যর্থ" })
 */
export async function safeRun<T>(
  fn: () => Promise<T>,
  opts?: { toast?: (msg: string) => void; errorPrefix?: string }
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    const msg = toUserMessage(err);
    const full = opts?.errorPrefix ? `${opts.errorPrefix}: ${msg}` : msg;
    if (opts?.toast) opts.toast(full);
    // eslint-disable-next-line no-console
    console.error("[safeRun]", err);
    return null;
  }
}
