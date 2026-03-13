"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasProAccess } from "@/features/subscription/utils";

export function useAuthRedirect() {
  const router = useRouter();
  const { user, profile, loading, redirectResult, clearRedirectResult, isPendingVerification } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!redirectResult) return;
    clearRedirectResult();
    router.replace(hasProAccess(profile) ? "/dashboard/ai-assistant" : "/dashboard");
  }, [redirectResult, clearRedirectResult, router, profile]);

  useEffect(() => {
    if (!mounted || loading || !user || redirectResult || isPendingVerification) return;
    router.replace(hasProAccess(profile) ? "/dashboard/ai-assistant" : "/dashboard");
  }, [user, profile, loading, redirectResult, router, isPendingVerification, mounted]);

  const isReady = mounted && !loading;
  const shouldShow = isReady && (!user || isPendingVerification);

  return { isReady, shouldShow };
}
