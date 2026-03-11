"use client";
import Button from "@/components/ui/Button";
import PageContainer from "@/components/layout/PageContainer";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <PageContainer>
      <div className="center" style={{ padding: 60 }}>
        <h2 className="auth-heading" style={{ marginBottom: 12 }}>Something went wrong</h2>
        <p className="muted" style={{ fontFamily: "var(--mono)", fontSize: "0.8rem", marginBottom: 20 }}>{error.message}</p>
        <Button variant="secondary" size="sm" onClick={reset}>Try Again</Button>
      </div>
    </PageContainer>
  );
}
