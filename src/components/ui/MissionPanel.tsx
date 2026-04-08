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
  borderTone?: "default" | "mvp";
}

interface MissionCardProps {
  children: ReactNode;
  className?: string;
  borderTone?: "default" | "mvp";
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getPanelBorderClass(borderTone: "default" | "mvp" = "default") {
  return borderTone === "mvp"
    ? "border-[var(--color-accent-yellow)] hover:border-[var(--color-accent-yellow)]"
    : "border-mission-border hover:border-mission-text/70";
}

export function MissionCard({
  children,
  className,
  borderTone = "default",
}: MissionCardProps) {
  return (
    <div
      className={cx(
        "rounded-[16px] border bg-mission-bg px-4 py-3 transition",
        getPanelBorderClass(borderTone),
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
  borderTone = "default",
}: MissionPanelProps) {
  const borderClass =
    borderTone === "mvp" ? "border-[var(--color-accent-yellow)]" : "border-mission-border";

  return (
    <section
      className={cx(
        "flex min-h-0 flex-col rounded-[18px] border bg-mission-panel shadow-mission-soft",
        borderClass,
        className,
      )}
    >
      {(title || headerRight) && (
        <div className={cx("flex items-center justify-between border-b px-5 py-3", borderClass)}>
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
        <div className={cx("border-t px-4 py-2", borderClass)}>
          {footer}
        </div>
      )}
    </section>
  );
}
