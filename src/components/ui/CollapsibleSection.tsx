import { useEffect, useId, useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  actions?: ReactNode;
  children: ReactNode;
  asCard?: boolean;
  /** Group name — listens for `lovable:collapse-group` events to expand/collapse together. */
  group?: string;
  /** Accessible label for the toggle button (falls back to the title if string). */
  ariaLabel?: string;
}

export const COLLAPSE_GROUP_EVENT = "lovable:collapse-group";

export function emitCollapseGroup(group: string, open: boolean) {
  window.dispatchEvent(
    new CustomEvent(COLLAPSE_GROUP_EVENT, { detail: { group, open } }),
  );
}

/**
 * Reusable expand/collapse section.
 * - Native <button> = built-in Enter/Space keyboard support.
 * - Focus-visible ring for keyboard users.
 * - `group` lets a CollapseGroupControls toggle all siblings at once.
 */
export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  className,
  headerClassName,
  contentClassName,
  actions,
  children,
  asCard = true,
  group,
  ariaLabel,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  useEffect(() => {
    if (!group) return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ group: string; open: boolean }>;
      if (ce.detail?.group === group) setOpen(ce.detail.open);
    };
    window.addEventListener(COLLAPSE_GROUP_EVENT, handler);
    return () => window.removeEventListener(COLLAPSE_GROUP_EVENT, handler);
  }, [group]);

  const Wrapper: any = asCard ? Card : "div";
  const wrapperProps = asCard ? { className: cn("overflow-hidden", className) } : { className };

  const labelFallback = typeof title === "string" ? title : "সেকশন";
  const label = ariaLabel ?? `${open ? "কলাপ্স" : "এক্সপান্ড"}: ${labelFallback}`;

  return (
    <Wrapper {...wrapperProps}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        aria-label={label}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-3 lg:p-4 text-left",
          "hover:bg-muted/40 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
          headerClassName,
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon}
          <span className="font-semibold text-sm lg:text-base text-foreground truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {actions}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </div>
      </button>
      <div
        id={contentId}
        role="region"
        hidden={!open}
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className={cn("p-3 lg:p-4 pt-0", contentClassName)}>{children}</div>
        </div>
      </div>
    </Wrapper>
  );
}
