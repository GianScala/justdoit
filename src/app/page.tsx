"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasProAccess } from "@/features/subscription/utils";
import Spinner from "@/components/ui/Spinner";
import LandingPage from "@/components/landing/LandingPage";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(hasProAccess(profile) ? "/dashboard/ai-assistant" : "/dashboard");
    }
  }, [loading, user, profile, router]);

  if (loading) return <Spinner />;
  if (user) return null;

  return <LandingPage />;
}
