"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTasks } from "@/context/TaskContext";
import { hasProAccess } from "@/features/subscription/utils";
import PageContainer from "@/components/layout/PageContainer";
import AiChat from "@/components/ai/AiChat";
import Spinner from "@/components/ui/Spinner";

function AiAssistantInner() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { refresh, overallTasks } = useTasks();
  const canUseAi = hasProAccess(profile);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user && canUseAi && overallTasks.length === 0) refresh("overall");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, canUseAi, overallTasks.length]);

  if (loading || !user) return <Spinner />;

  return (
    <PageContainer>
      <div className="ai-page">
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
