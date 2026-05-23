import type { SelectHTMLAttributes } from "react";
import type { ReactNode } from "react";
import { cx } from "../../lib/cx";

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

export default function SelectInput({ className, children, ...rest }: SelectInputProps) {
  return (
    <select
      className={cx(
        "w-full rounded border border-mission-border bg-mission-bg px-2 py-1.5 text-mission-control text-mission-text focus:border-mission-info focus:outline-none",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
