import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { emitCollapseGroup } from "@/components/ui/CollapsibleSection";

interface CollapseGroupControlsProps {
  group: string;
  className?: string;
  size?: "sm" | "default";
  /**
   * Enable keyboard shortcuts:
   *   Alt + E → expand all in this group
   *   Alt + C → collapse all in this group
   * Default: true.
   */
  enableShortcuts?: boolean;
}

/**
 * Pair of "Expand All" / "Collapse All" buttons that broadcast to every
 * <CollapsibleSection group={group} /> on the page.
 *
 * Accessibility:
 *  - Native <button> elements → built-in Enter/Space activation.
 *  - Strong focus-visible ring (cyan, 2px + offset).
 *  - Optional keyboard shortcuts (Alt+E / Alt+C), ignored while typing
 *    in inputs/textareas/contenteditable.
 */
export function CollapseGroupControls({
  group,
  className,
  size = "sm",
  enableShortcuts = true,
}: CollapseGroupControlsProps) {
  useEffect(() => {
    if (!enableShortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable) return;
      }
      const k = e.key.toLowerCase();
      if (k === "e") {
        e.preventDefault();
        emitCollapseGroup(group, true);
      } else if (k === "c") {
        e.preventDefault();
        emitCollapseGroup(group, false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [group, enableShortcuts]);

  const focusRing =
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return (
    <div className={className} role="group" aria-label="সকল সেকশন এক্সপান্ড/কলাপ্স">
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => emitCollapseGroup(group, true)}
        aria-label="সকল সেকশন এক্সপান্ড করুন (শর্টকাট: Alt + E)"
        title="সব এক্সপান্ড (Alt + E)"
        className={`mr-2 ${focusRing}`}
      >
        <Maximize2 className="w-4 h-4 mr-1" aria-hidden="true" />
        সব এক্সপান্ড
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => emitCollapseGroup(group, false)}
        aria-label="সকল সেকশন কলাপ্স করুন (শর্টকাট: Alt + C)"
        title="সব কলাপ্স (Alt + C)"
        className={focusRing}
      >
        <Minimize2 className="w-4 h-4 mr-1" aria-hidden="true" />
        সব কলাপ্স
      </Button>
    </div>
  );
}
