interface MetricCardProps {
  label: string;
  value: string;
  accent?: boolean;
}

export default function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="card p-4">
      <p className="metric-label">{label}</p>
      <p className={`metric-value mt-1 ${accent ? "text-accent" : ""}`}>{value}</p>
    </div>
  );
}
