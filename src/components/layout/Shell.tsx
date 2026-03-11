import { ReactNode } from "react";

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <div className="flex-1 w-full max-w-7xl mx-auto px-6">
        {children}
      </div>
    </div>
  );
}