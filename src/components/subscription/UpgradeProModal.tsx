"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  uid: string;
  email?: string | null;
  title?: string;
  description?: string;
}

export default function UpgradeProModal({
  open,
  onClose,
  uid,
  email,
  title = "Upgrade to Pro",
  description = "Unlock your AI productivity assistant and let AI organize your work automatically.",
}: Props) {
  const [submitting, setSubmitting] = useState<"monthly" | "yearly" | null>(null);

  async function startCheckout(plan: "monthly" | "yearly") {
    if (submitting) return;

    try {
      setSubmitting(plan);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, uid, email }),
      });

      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to start checkout.");
      setSubmitting(null);
    }
  }

  return (
    <Modal open={open} onClose={() => !submitting && onClose()} title={title}>
      <div className="stack">
        <p className="muted" style={{ lineHeight: 1.7 }}>
          {description}
        </p>

        <div className="profile-card" style={{ marginTop: 0 }}>
          <div className="profile-field">
            <div className="profile-label">Included</div>
            <div className="profile-value">AI planning</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Included</div>
            <div className="profile-value">Start My Day</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Included</div>
            <div className="profile-value">What should I do now</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Included</div>
            <div className="profile-value">Fix my week</div>
          </div>
          <div className="profile-field">
            <div className="profile-label">Included</div>
            <div className="profile-value">Chat with AI assistant</div>
          </div>
        </div>

        <div className="task-modal-row">
          <div className="profile-card" style={{ marginTop: 0 }}>
            <div className="profile-label">$12 / month</div>
            <Button
              type="button"
              onClick={() => void startCheckout("monthly")}
              disabled={!!submitting}
              style={{ width: "100%", marginTop: 16 }}
            >
              {submitting === "monthly" ? "Redirecting..." : "Subscribe Monthly"}
            </Button>
          </div>
          <div className="profile-card" style={{ marginTop: 0 }}>
            <div className="profile-label">$120 / year</div>
            <Button
              type="button"
              onClick={() => void startCheckout("yearly")}
              disabled={!!submitting}
              style={{ width: "100%", marginTop: 16 }}
            >
              {submitting === "yearly" ? "Redirecting..." : "Subscribe Yearly"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
