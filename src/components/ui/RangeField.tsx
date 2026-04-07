import type { InputHTMLAttributes, ReactNode } from "react";
import Field from "./Field";
import Typography from "./Typography";

interface RangeFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  label: ReactNode;
  valueLabel?: ReactNode;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export default function RangeField({
  label,
  valueLabel,
  minLabel = 0,
  maxLabel = 100,
  description,
  className,
  ...rest
}: RangeFieldProps) {
  return (
    <Field
      label={label}
      hint={
        valueLabel ? (
          typeof valueLabel === "string" || typeof valueLabel === "number" ? (
            <Typography as="span" variant="monoStrong" tone="info">
              {valueLabel}
            </Typography>
          ) : (
            valueLabel
          )
        ) : undefined
      }
      className={className}
    >
      <div className="flex items-center gap-2">
        <Typography as="span" variant="overline" className="text-mission-text/30">
          {minLabel}
        </Typography>
        <input
          type="range"
          className="h-1.5 flex-1 cursor-pointer accent-[var(--color-accent-blue)] disabled:cursor-not-allowed disabled:opacity-30"
          {...rest}
        />
        <Typography as="span" variant="overline" className="text-mission-text/30">
          {maxLabel}
        </Typography>
      </div>
      {description ? (
        typeof description === "string" ? (
          <Typography variant="overline" tone="subtle" className="mt-1 tracking-[0.08em] text-mission-text/40">
            {description}
          </Typography>
        ) : (
          description
        )
      ) : null}
    </Field>
  );
}
