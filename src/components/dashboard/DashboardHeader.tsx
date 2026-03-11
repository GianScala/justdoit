interface Props {
  title: string;
  subtitle: string;
}

export default function DashboardHeader({ title, subtitle }: Props) {
  return (
    <div className="folder-header-section">
      <div>
        <div className="folder-title">{title}</div>
        <div className="folder-subtitle">{subtitle}</div>
      </div>
    </div>
  );
}