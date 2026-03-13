"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/ui/Spinner";
import LandingPage from "@/components/landing/LandingPage";

export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard/ai-assistant");
    }
  }, [loading, user, router]);

  if (loading) return <Spinner />;
  if (user) return null;

  return <LandingPage />;
}
