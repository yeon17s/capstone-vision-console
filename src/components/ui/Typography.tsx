import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type TypographyVariant =
  | "brand"
  | "panelTitle"
  | "overline"
  | "control"
  | "controlStrong"
  | "emphasis"
  | "metric"
  | "display"
  | "mono"
  | "monoStrong";

type TypographyTone =
  | "default"
  | "muted"
  | "subtle"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "inverse";

interface TypographyProps<T extends ElementType> {
  as?: T;
  variant?: TypographyVariant;
  tone?: TypographyTone;
  className?: string;
  children: ReactNode;
}

const VARIANT_CLASS: Record<TypographyVariant, string> = {
  brand: "text-mission-emphasis font-black uppercase tracking-[0.28em]",
  panelTitle: "text-mission-label font-bold uppercase tracking-[0.22em]",
  overline: "text-mission-overline font-semibold uppercase tracking-[0.12em]",
  control: "text-mission-control",
  controlStrong: "text-mission-control font-bold uppercase tracking-[0.14em]",
  emphasis: "text-mission-emphasis font-semibold",
  metric: "font-mono text-mission-metric font-black",
  display: "text-mission-display font-black uppercase tracking-[0.12em]",
  mono: "font-mono text-mission-control",
  monoStrong: "font-mono text-mission-label font-bold",
};

const TONE_CLASS: Record<TypographyTone, string> = {
  default: "text-mission-text",
  muted: "text-mission-text/60",
  subtle: "text-mission-text/45",
  info: "text-mission-info",
  success: "text-mission-active",
  warning: "text-mission-suspicious",
  danger: "text-mission-critical",
  inverse: "text-mission-bg",
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function Typography<T extends ElementType = "p">({
  as,
  variant = "control",
  tone = "default",
  className,
  children,
  ...rest
}: TypographyProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TypographyProps<T>>) {
  const Component = as ?? "p";

  return (
    <Component className={cx(VARIANT_CLASS[variant], TONE_CLASS[tone], className)} {...rest}>
      {children}
    </Component>
  );
}
