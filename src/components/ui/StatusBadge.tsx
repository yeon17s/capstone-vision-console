import type { ReactNode } from "react";
import Typography from "./Typography";

type StatusBadgeTone = "success" | "warning" | "danger" | "muted" | "info";

interface StatusBadgeProps {
  tone: StatusBadgeTone;
  children: ReactNode;
  strike?: boolean;
  className?: string;
}

const BADGE_CLASS: Record<StatusBadgeTone, string> = {
  success: "text-mission-secondary border-mission-secondary/40 bg-mission-secondary/5",
  warning: "text-mission-suspicious border-mission-suspicious/40 bg-mission-suspicious/5",
  danger: "text-mission-critical border-mission-critical/40 bg-mission-critical/5",
  muted: "text-mission-text/40 border-mission-border bg-mission-border/10",
  info: "text-mission-info border-mission-info/40 bg-mission-info/10",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function StatusBadge({
  tone,
  children,
  strike = false,
  className,
}: StatusBadgeProps) {
  return (
    <Typography
      as="span"
      variant="overline"
      className={cx(
        "rounded border px-2 py-0.5 font-bold",
        BADGE_CLASS[tone],
        strike && "line-through",
        className,
      )}
    >
      {children}
    </Typography>
  );
}
