import type { TaskCounts } from "@/types/task";

interface Props {
  counts: TaskCounts;
}

export default function SummaryCard({ counts }: Props) {
  return (
    <section className="folder-header-section">
      <div className="folder-header-copy" />

      <div className="summary-stats" aria-label="Task summary">
        <div className="summary-stat">
          <span className="summary-label">To Do</span>
          <strong>{counts.todo}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-label">In Progress</span>
          <strong>{counts.inprogress}</strong>
        </div>
        <div className="summary-stat">
          <span className="summary-label">Done</span>
          <strong>{counts.completed}</strong>
        </div>
      </div>
    </section>
  );
}