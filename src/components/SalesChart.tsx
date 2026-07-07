"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export interface ChartPoint {
  date: string; // ex. "07/07"
  benefice: number;
  depenses: number;
  ventes: number;
}

export default function SalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <div className="card p-4">
      <p className="text-[14px] font-medium text-ink mb-1">Activité des 14 derniers jours</p>
      <p className="text-[12px] text-ink-faint mb-3">Bénéfice, ventes et dépenses par jour</p>
      <div className="h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF1EF" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#8A938E" }}
              axisLine={{ stroke: "#EEF1EF" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8A938E" }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #EEF1EF", fontSize: 12 }}
              formatter={(value: number) => `${Math.round(value).toLocaleString("fr-FR")} FCFA`}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) =>
                value === "benefice" ? "Bénéfice" : value === "ventes" ? "Chiffre d'affaires" : "Dépenses"
              }
            />
            <Line type="monotone" dataKey="ventes" stroke="#5B7FDE" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="benefice" stroke="#10B981" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="depenses" stroke="#F4A261" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
