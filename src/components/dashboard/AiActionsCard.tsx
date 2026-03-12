"use client";

import { useRouter } from "next/navigation";

export default function AiActionsCard() {
  const router = useRouter();

  function goAi(action?: string) {
    const params = action ? `?action=${action}` : "";
    router.push(`/dashboard/ai-assistant${params}`);
  }

  return (
    <div className="ai-actions-card">
      <div className="ai-actions-header">
        <span className="ai-actions-icon">⚡</span>
        <span className="ai-actions-label">AI Assistant</span>
      </div>
      <div className="ai-actions-buttons">
        <button
          type="button"
          className="ai-action-btn ai-action-primary"
          onClick={() => goAi("start_my_day")}
        >
          <span className="ai-action-emoji">☀️</span>
          <span>Start My Day</span>
        </button>
        <button
          type="button"
          className="ai-action-btn"
          onClick={() => goAi("what_now")}
        >
          <span className="ai-action-emoji">🎯</span>
          <span>What Now?</span>
        </button>
        <button
          type="button"
          className="ai-action-btn"
          onClick={() => goAi("fix_week")}
        >
          <span className="ai-action-emoji">🔧</span>
          <span>Fix My Week</span>
        </button>
      </div>
    </div>
  );
}
