"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartData {
  month: string;
  revenue: number;
  appointments: number;
}

interface TopService {
  name: string;
  count: number;
  revenue: number;
}

interface AnalyticsChartsProps {
  data: ChartData[];
  topServices: TopService[];
  cancelledCount: number;
}

const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsCharts({ data, topServices, cancelledCount }: AnalyticsChartsProps) {
  const totalAppointments = data.reduce((sum, d) => sum + d.appointments, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const completed = totalAppointments - cancelledCount;

  const statusData = [
    { name: "Completadas", value: completed, color: "#10b981" },
    { name: "Canceladas", value: cancelledCount, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Revenue chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Ingresos y reservas por mes</CardTitle>
          <CardDescription>
            Tendencia de los últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  name="Ingresos ($)"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Reservas"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top services */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios más populares</CardTitle>
          <CardDescription>Top 5 servicios por reservas</CardDescription>
        </CardHeader>
        <CardContent>
          {topServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos aún
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#6b7280"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de reservas</CardTitle>
          <CardDescription>Estado de las reservas</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sin datos aún
            </p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
