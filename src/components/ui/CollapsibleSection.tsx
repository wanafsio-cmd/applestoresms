import { useState, ReactNode } from "react";
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
}

/**
 * Reusable expand/collapse section for headers, search/filter blocks, and report panels.
 * - Click on the header to toggle.
 * - `actions` render on the right (e.g. export buttons) and don't trigger toggle.
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
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const Wrapper: any = asCard ? Card : "div";
  const wrapperProps = asCard ? { className: cn("overflow-hidden", className) } : { className };

  return (
    <Wrapper {...wrapperProps}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-center justify-between gap-2 p-3 lg:p-4 text-left hover:bg-muted/40 transition-colors",
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
          />
        </div>
      </button>
      <div
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
