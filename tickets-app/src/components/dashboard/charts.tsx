"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  primary: "var(--primary)",
  blue: "#0ea5e9",
  yellow: "#eab308",
  purple: "#a855f7",
  green: "#22c55e",
  gray: "#94a3b8",
  red: "#ef4444",
  orange: "#f97316",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: COLORS.blue,
  IN_PROGRESS: COLORS.yellow,
  WAITING_CUSTOMER: COLORS.purple,
  RESOLVED: COLORS.green,
  CLOSED: COLORS.gray,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: COLORS.gray,
  MEDIUM: COLORS.blue,
  HIGH: COLORS.orange,
  URGENT: COLORS.red,
};

type StatusDatum = { status: string; count: number };
type PriorityDatum = { priority: string; count: number };
type TimeDatum = { date: string; count: number };
type AgentDatum = {
  name: string;
  email: string;
  assigned: number;
  resolved: number;
  open: number;
};

export function StatusBreakdownChart({ data }: { data: StatusDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    status: d.status,
    count: d.count,
  }));

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">Tickets by status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="status"
              innerRadius={48}
              outerRadius={88}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] ?? COLORS.gray}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const item = payload[0];
                const value = Number(item.value ?? 0);
                const pct = total ? Math.round((value / total) * 100) : 0;
                return (
                  <div className="bg-popover rounded border px-2 py-1 text-xs shadow">
                    <p className="font-medium">{item.payload.status}</p>
                    <p>
                      {value} tickets ({pct}%)
                    </p>
                  </div>
                );
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PriorityBreakdownChart({ data }: { data: PriorityDatum[] }) {
  const chartData = data.map((d) => ({
    priority: d.priority,
    count: d.count,
  }));

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">Tickets by priority</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="priority"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-popover rounded border px-2 py-1 text-xs shadow">
                    <p className="font-medium">{label}</p>
                    <p>{payload[0].value} tickets</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.priority}
                  fill={PRIORITY_COLORS[entry.priority] ?? COLORS.gray}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TicketsOverTimeChart({
  data,
  days = 14,
}: {
  data: TimeDatum[];
  days?: number;
}) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    count: d.count,
  }));

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">New tickets (last {days} days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              stroke="var(--muted-foreground)"
              fontSize={11}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={12}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-popover rounded border px-2 py-1 text-xs shadow">
                    <p className="font-medium">{label}</p>
                    <p>{payload[0].value} tickets</p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AgentPerformanceChart({
  data,
  days = 30,
}: {
  data: AgentDatum[];
  days?: number;
}) {
  const chartData = data.map((d) => ({
    name: d.name ?? d.email,
    Resolved: d.resolved,
    Open: d.open,
  }));

  return (
    <div className="bg-card rounded-lg border p-4">
      <h3 className="mb-2 font-semibold">
        Agent performance (last {days} days)
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              stroke="var(--muted-foreground)"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="var(--muted-foreground)"
              fontSize={11}
              width={120}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-popover rounded border px-2 py-1 text-xs shadow">
                    <p className="font-medium">{label}</p>
                    <p>Resolved: {payload[0].payload.Resolved}</p>
                    <p>Open: {payload[0].payload.Open}</p>
                  </div>
                );
              }}
            />
            <Legend />
            <Bar
              dataKey="Resolved"
              stackId="a"
              fill={COLORS.green}
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="Open"
              stackId="a"
              fill={COLORS.yellow}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
