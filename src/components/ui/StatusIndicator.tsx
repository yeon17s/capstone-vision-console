import type { ReactNode } from "react";
import Typography from "./Typography";

type StatusTone = "success" | "warning" | "danger" | "muted" | "info";
type StatusSize = "sm" | "md";
type StatusTextVariant = "overline" | "control" | "emphasis" | "mono" | "monoStrong" | "metric";

interface StatusIndicatorProps {
  tone: StatusTone;
  label?: ReactNode;
  size?: StatusSize;
  pulse?: boolean;
  showDot?: boolean;
  textVariant?: StatusTextVariant;
  className?: string;
}

const DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-mission-active",
  warning: "bg-mission-suspicious",
  danger: "bg-mission-critical",
  muted: "bg-mission-text/30",
  info: "bg-mission-info",
};

const TEXT_TONE: Record<StatusTone, "success" | "warning" | "danger" | "muted" | "info"> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  muted: "muted",
  info: "info",
};

const SIZE_CLASS: Record<StatusSize, string> = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function StatusIndicator({
  tone,
  label,
  size = "sm",
  pulse = false,
  showDot = true,
  textVariant = "overline",
  className,
}: StatusIndicatorProps) {
  const dot = (
    <span
      className={cx(
        "shrink-0 rounded-full",
        SIZE_CLASS[size],
        DOT_CLASS[tone],
        pulse && tone === "success" && "animate-pulse shadow-mission-glow-green",
        pulse && tone === "danger" && "animate-pulse shadow-mission-glow-red",
      )}
    />
  );

  if (!label) return showDot ? dot : null;

  return (
    <Typography
      as="span"
      variant={textVariant}
      tone={TEXT_TONE[tone]}
      className={cx(showDot && "flex items-center gap-1.5", className)}
    >
      {showDot ? dot : null}
      {label}
    </Typography>
  );
}
