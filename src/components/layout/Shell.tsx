import { ReactNode } from "react";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <div className="shell-inner">{children}</div>
    </div>
  );
}