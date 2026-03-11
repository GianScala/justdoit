"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PageContainer from "@/components/layout/PageContainer";
import ProfileCard from "@/components/profile/ProfileCard";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOutUser } = useAuth();

  useEffect(() => { if (!loading && !user) router.replace("/auth/login"); }, [loading, user, router]);
  if (loading || !user) return <Spinner />;

  return (
    <PageContainer>
      <div className="profile-page">
        <ProfileCard user={user} profile={profile} />
        <div style={{ marginTop: 16 }}><Button variant="secondary" onClick={async () => { await signOutUser(); router.replace("/"); }}>Sign Out</Button></div>
      </div>
    </PageContainer>
  );
}
