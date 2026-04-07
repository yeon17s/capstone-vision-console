import type { SelectHTMLAttributes } from "react";
import type { ReactNode } from "react";

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
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
