import type { ReactNode } from "react";
import Typography from "./Typography";
import { cx } from "../../lib/cx";

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Field({ label, hint, className, children }: FieldProps) {
  return (
    <div className={cx("space-y-1", className)}>
      {(label || hint) && (
        <div className="flex items-center justify-between gap-3">
          {typeof label === "string" ? (
            <Typography variant="overline" tone="subtle">
              {label}
            </Typography>
          ) : (
            label ?? <div />
          )}
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}
