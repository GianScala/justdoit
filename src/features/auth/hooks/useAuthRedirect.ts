"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function useAuthRedirect() {
  const router = useRouter();
  const { user, loading, redirectResult, clearRedirectResult, isPendingVerification } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!redirectResult) return;
    clearRedirectResult();
    router.replace("/dashboard");
  }, [redirectResult, clearRedirectResult, router]);

  useEffect(() => {
    if (!mounted || loading || !user || redirectResult || isPendingVerification) return;
    router.replace("/dashboard");
  }, [user, loading, redirectResult, router, isPendingVerification, mounted]);

  const isReady = mounted && !loading;
  const shouldShow = isReady && (!user || isPendingVerification);

  return { isReady, shouldShow };
}
