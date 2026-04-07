import type { ReactNode } from "react";
import Typography from "./Typography";

interface MissionPanelProps {
  title?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  compactBody?: boolean;
}

interface MissionCardProps {
  children: ReactNode;
  className?: string;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MissionCard({ children, className }: MissionCardProps) {
  return (
    <div
      className={cx(
        "rounded-[16px] border border-mission-border bg-mission-bg px-4 py-3 transition hover:border-mission-text/70",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function MissionPanel({
  title,
  headerRight,
  footer,
  children,
  className,
  bodyClassName,
  compactBody = false,
}: MissionPanelProps) {
  return (
    <section
      className={cx(
        "flex min-h-0 flex-col rounded-[18px] border border-mission-border bg-mission-panel shadow-mission-soft",
        className,
      )}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between border-b border-mission-border px-5 py-3">
          {typeof title === "string" ? (
            <Typography variant="panelTitle">{title}</Typography>
          ) : (
            title ?? <div />
          )}
          {headerRight ?? <div />}
        </div>
      )}

      <div className={cx(compactBody ? "p-0" : "p-3", bodyClassName)}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-mission-border px-4 py-2">
          {footer}
        </div>
      )}
    </section>
  );
}
