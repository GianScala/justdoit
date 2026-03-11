import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "error" | "success" | "info";

interface Props {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  error: "alert-error",
  success: "alert-success",
  info: "alert-info",
};

export default function Alert({ variant, children, className }: Props) {
  return (
    <div className={cn(variantClass[variant], className)}>{children}</div>
  );
}
