"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TaskContext";
import PageContainer from "@/components/layout/PageContainer";
import AiChat from "@/components/ai/AiChat";
import Spinner from "@/components/ui/Spinner";

function AiAssistantInner() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { refresh } = useTasks();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (loading || !user) return <Spinner />;

  return (
    <PageContainer>
      <div className="ai-page">
        <div className="ai-page-header">
          <div className="ai-page-title">AI Assistant</div>
          <div className="ai-page-subtitle">
            Your personal AI project manager
          </div>
        </div>
        <AiChat />
      </div>
    </PageContainer>
  );
}

export default function AiAssistantPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AiAssistantInner />
    </Suspense>
  );
}
