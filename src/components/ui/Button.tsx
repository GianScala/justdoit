import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "brand" | "secondary" | "ghost" | "danger";
type Size = "default" | "sm" | "xs";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClass: Record<Variant, string> = {
  brand: "btn-brand",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const sizeClass: Record<Size, string> = {
  default: "",
  sm: "btn-sm",
  xs: "btn-xs",
};

export default function Button({
  variant = "brand",
  size = "default",
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn("btn", variantClass[variant], sizeClass[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
