import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant =
  | "nav"
  | "panel"
  | "primary"
  | "infoOutline"
  | "warningOutline"
  | "dangerOutline"
  | "segment"
  | "icon"
  | "iconMuted"
  | "critical";

type ButtonSize = "sm" | "md" | "lg" | "icon" | "critical";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  nav: "",
  panel: "border-mission-border bg-mission-bg text-mission-text hover:border-mission-info hover:text-mission-info",
  primary: "border-mission-info bg-mission-info text-mission-bg shadow-mission-glow-blue",
  infoOutline: "border-mission-info bg-mission-info/10 text-mission-info hover:bg-mission-info/20",
  warningOutline: "border-mission-suspicious/30 bg-mission-suspicious/10 text-mission-suspicious hover:bg-mission-suspicious/20",
  dangerOutline: "border-mission-critical/30 bg-mission-critical/10 text-mission-critical hover:bg-mission-critical/20",
  segment: "",
  icon: "border-mission-border bg-mission-bg text-mission-text hover:border-mission-text hover:bg-mission-panel hover:text-mission-text",
  iconMuted: "border-mission-border bg-mission-panel text-mission-text",
  critical: "border-2 border-mission-critical bg-mission-critical text-mission-bg shadow-mission-glow-red hover:brightness-110",
};

const PRESS_CLASS: Record<ButtonVariant, string> = {
  nav: "active:scale-[0.99]",
  panel: "active:scale-[0.99]",
  primary: "active:scale-[0.99]",
  infoOutline: "active:scale-[0.99]",
  warningOutline: "active:scale-[0.99]",
  dangerOutline: "active:scale-[0.99]",
  segment: "active:scale-[0.99]",
  icon: "active:scale-90",
  iconMuted: "active:scale-[0.99]",
  critical: "active:scale-95",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "rounded-md px-4 py-1",
  md: "rounded-lg px-5 py-2",
  lg: "rounded-lg px-6 py-2.5",
  icon: "h-11 w-11 rounded-lg",
  critical: "w-full rounded-[18px] py-6",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function Button({
  variant = "panel",
  size = "md",
  active = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const navState = active
    ? "border-mission-info bg-mission-info text-mission-bg shadow-mission-glow-blue"
    : "border-mission-border bg-mission-panel text-mission-text hover:border-mission-text hover:bg-mission-panel hover:text-mission-text";

  const segmentState = active
    ? "bg-mission-active/15 text-mission-active"
    : "text-mission-text/30 hover:text-mission-text/60";

  return (
    <button
      type={type}
      className={cx(
        "border transition disabled:cursor-not-allowed disabled:opacity-40",
        SIZE_CLASS[size],
        PRESS_CLASS[variant],
        variant === "nav" ? navState : VARIANT_CLASS[variant],
        variant === "segment" && segmentState,
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
