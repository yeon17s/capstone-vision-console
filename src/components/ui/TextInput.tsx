import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
  dense?: boolean;
}

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function TextInput({
  mono = true,
  dense = false,
  className,
  type = "text",
  ...rest
}: TextInputProps) {
  return (
    <input
      type={type}
      className={cx(
        "w-full rounded border border-mission-border bg-mission-bg text-mission-text placeholder-mission-text/30 focus:border-mission-info focus:outline-none",
        mono ? "font-mono" : "",
        dense ? "px-2 py-1 text-mission-label" : "px-3 py-1.5 text-mission-control",
        className,
      )}
      {...rest}
    />
  );
}
