import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 shadow-soft">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 text-slate-300">
          {entry.name}:{" "}
          <span className="font-medium text-white">
            {entry.dataKey === "avgOccupancy"
              ? `${Math.round(entry.value * 100)}%`
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function getBarColor(status) {
  if (status === "overutilized") {
    return "#ef4444";
  }
  if (status === "underutilized") {
    return "#facc15";
  }
  return "#38bdf8";
}

export default function Charts({ rooms, timeSeries }) {
  const chartRooms = rooms.map((room) => ({
    ...room,
    roomLabel: room.roomNameEn || room.roomNameHi || "Room"
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Room Occupancy Overview</h3>
          <p className="mt-1 text-sm text-slate-400">
            Average occupancy per room, with overcrowded and underutilized spaces highlighted.
          </p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRooms} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis
                dataKey="roomLabel"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgOccupancy" name="Avg Occupancy" radius={[10, 10, 0, 0]}>
                {chartRooms.map((room) => (
                  <Cell key={room.roomId} fill={getBarColor(room.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Student Load Timeline</h3>
          <p className="mt-1 text-sm text-slate-400">
            Concurrent student presence across time slots to reveal block pressure and peak hour.
          </p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.15)" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="students"
                name="Students"
                stroke="#fb923c"
                strokeWidth={3}
                dot={{ r: 4, fill: "#fdba74", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#fff7ed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
