"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { hasProAccess } from "@/features/subscription/utils";
import { getFirebaseDb } from "@/features/auth/utils/firebase";
import PageContainer from "@/components/layout/PageContainer";
import ProfileCard from "@/components/profile/ProfileCard";
import UpgradeProModal from "@/components/subscription/UpgradeProModal";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, signOutUser, refreshProfile } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ variant: "success" | "error"; text: string } | null>(null);

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);
  useEffect(() => { if (user) void refreshProfile(); }, [user, refreshProfile]);
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (!user || checkout !== "success" || !sessionId) return;

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(`/api/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data = await response.json().catch(() => null);

        if (!response.ok || !data) {
          throw new Error(data?.error || "Unable to confirm subscription.");
        }

        if (cancelled) return;

        await setDoc(
          doc(getFirebaseDb(), "users", user.uid),
          {
            subscriptionType: data.subscriptionType,
            subscriptionStatus: data.subscriptionStatus,
            subscriptionStartDate: data.subscriptionStartDate,
            subscriptionRenewalDate: data.subscriptionRenewalDate,
          },
          { merge: true },
        );

        await refreshProfile();
        setStatusMessage({ variant: "success", text: "Pro subscription activated." });
        router.replace("/dashboard/profile");
      } catch (error) {
        if (cancelled) return;
        setStatusMessage({
          variant: "error",
          text: error instanceof Error ? error.message : "Unable to confirm subscription.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, searchParams, refreshProfile, router]);

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      setStatusMessage({ variant: "error", text: "Checkout was cancelled." });
      router.replace("/dashboard/profile");
    }
  }, [searchParams, router]);

  if (loading || !user) return <Spinner />;

  return (
    <PageContainer>
      <div className="profile-page">
        {statusMessage && <Alert variant={statusMessage.variant}>{statusMessage.text}</Alert>}
        <ProfileCard user={user} profile={profile} />
        {!hasProAccess(profile) && (
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setUpgradeOpen(true)}>Upgrade to Pro</Button>
          </div>
        )}
        <div style={{ marginTop: 16 }}><Button variant="secondary" onClick={async () => { await signOutUser(); router.replace("/"); }}>Sign Out</Button></div>
      </div>

      <UpgradeProModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        uid={user.uid}
        email={user.email}
      />
    </PageContainer>
  );
}
