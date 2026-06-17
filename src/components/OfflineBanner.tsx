import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Sticky top banner shown when the device loses network connectivity.
 * Also fires a toast on the offline → online transition.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("ইন্টারনেট সংযোগ পুনরায় সচল হয়েছে");
    }
  }, [online]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 text-center text-sm font-medium shadow-lg flex items-center justify-center gap-2"
    >
      <WifiOff className="h-4 w-4" />
      <span>ইন্টারনেট সংযোগ নেই — কিছু ফিচার কাজ নাও করতে পারে</span>
    </div>
  );
}
