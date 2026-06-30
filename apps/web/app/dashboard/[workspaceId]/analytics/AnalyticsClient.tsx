"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface FunnelData {
  name: string;
  count: number;
}

interface ThroughputData {
  name: string;
  value: number;
  color: string;
}

interface Stats {
  totalFeatures: number;
  totalReviews: number;
  blockingReviews: number;
  passingReviews: number;
}

export default function AnalyticsClient({
  funnelData,
  throughputData,
  stats,
}: {
  funnelData: FunnelData[];
  throughputData: ThroughputData[];
  stats: Stats;
}) {
  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#101014] border border-white/5 rounded-2xl p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-1">
            Total Features
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.totalFeatures}
          </div>
        </div>
        <div className="bg-[#101014] border border-white/5 rounded-2xl p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-1">
            Total AI Reviews
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.totalReviews}
          </div>
        </div>
        <div className="bg-[#101014] border border-white/5 rounded-2xl p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-1">
            Blocking Reviews
          </div>
          <div className="text-3xl font-bold text-red-400">
            {stats.blockingReviews}
          </div>
        </div>
        <div className="bg-[#101014] border border-white/5 rounded-2xl p-6">
          <div className="text-[13px] font-medium text-muted-foreground mb-1">
            Clean Reviews
          </div>
          <div className="text-3xl font-bold text-emerald-400">
            {stats.passingReviews}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Funnel Chart */}
        <div className="lg:col-span-2 bg-[#101014] border border-white/5 rounded-2xl p-6 flex flex-col">
          <h2 className="text-[15px] font-semibold text-white mb-6">
            Feature Funnel
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "#ffffff05" }}
                  contentStyle={{
                    backgroundColor: "#0c0c0e",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    fontSize: "13px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Pie Chart */}
        <div className="bg-[#101014] border border-white/5 rounded-2xl p-6 flex flex-col">
          <h2 className="text-[15px] font-semibold text-white mb-6">
            Throughput Status
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={throughputData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {throughputData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0c0c0e",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#fff",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#888888" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
