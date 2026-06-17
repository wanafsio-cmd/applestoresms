import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { emitCollapseGroup } from "@/components/ui/CollapsibleSection";

interface CollapseGroupControlsProps {
  group: string;
  className?: string;
  size?: "sm" | "default";
}

/**
 * Pair of "Expand All" / "Collapse All" buttons that broadcast to every
 * <CollapsibleSection group={group} /> on the page.
 */
export function CollapseGroupControls({ group, className, size = "sm" }: CollapseGroupControlsProps) {
  return (
    <div className={className} role="group" aria-label="সকল সেকশন এক্সপান্ড/কলাপ্স">
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => emitCollapseGroup(group, true)}
        aria-label="সকল সেকশন এক্সপান্ড করুন"
        className="mr-2"
      >
        <Maximize2 className="w-4 h-4 mr-1" aria-hidden="true" />
        সব এক্সপান্ড
      </Button>
      <Button
        type="button"
        variant="outline"
        size={size}
        onClick={() => emitCollapseGroup(group, false)}
        aria-label="সকল সেকশন কলাপ্স করুন"
      >
        <Minimize2 className="w-4 h-4 mr-1" aria-hidden="true" />
        সব কলাপ্স
      </Button>
    </div>
  );
}
