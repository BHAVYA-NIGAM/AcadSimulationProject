import { useEffect, useMemo, useState } from "react";
import Charts from "./Charts.jsx";
import ClassScheduleTable from "./ClassScheduleTable.jsx";
import RoomAvailabilityPanel from "./RoomAvailabilityPanel.jsx";
import RoomTable from "./RoomTable.jsx";

function SummaryCard({ label, value, tone }) {
  const toneClasses = {
    orange: "from-orange-500/15 to-orange-400/5 border-orange-400/20",
    sky: "from-sky-500/15 to-sky-400/5 border-sky-400/20",
    emerald: "from-emerald-500/15 to-emerald-400/5 border-emerald-400/20",
  };

  return (
    <div
      className={`rounded-[26px] border bg-gradient-to-br p-5 ${toneClasses[tone] || toneClasses.orange}`}
    >
      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/55 p-10 text-center shadow-soft">
      <h2 className="text-2xl font-semibold text-white">
        No dashboard data yet
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-400">
        {message}
      </p>
    </section>
  );
}

function LoadingState({ message }) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/55 p-10 text-center shadow-soft">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-300/30 border-t-orange-300" />
      <p className="mt-4 text-sm text-slate-300">{message}</p>
    </section>
  );
}

function InsightCard({ label, value, helper }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

function MetricMeta({ metrics }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const meta = metrics.meta || {};
  const isPredicted = meta.recordType === "predicted";
  const displayDate = isPredicted ? meta.targetDate : meta.dataDate;
  const uploadedLabel =
    meta.uploadedAt && !Number.isNaN(new Date(meta.uploadedAt).getTime())
      ? new Date(meta.uploadedAt).toLocaleString()
      : "not available";
  const displayDateLabel =
    displayDate && !Number.isNaN(new Date(`${displayDate}T00:00:00`).getTime())
      ? new Date(`${displayDate}T00:00:00`).toLocaleDateString()
      : meta.originalName || "Latest Record";

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Current Date Time
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {currentTime.toLocaleString()}
        </p>
      </div>
      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          {isPredicted ? "Prediction Target" : "Dataset Date"}
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {displayDateLabel}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {isPredicted
            ? `${meta.targetWeekday} • based on ${meta.basedOnRecordCount} record(s)`
            : `${meta.weekday || ""} • uploaded ${uploadedLabel}`}
        </p>
      </div>
      <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Mode
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {isPredicted ? "Predicted Dashboard" : "Recorded Dashboard"}
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {isPredicted
            ? meta.predictionStrategy === "same-weekday-history"
              ? "Matched previous records from the same weekday as the requested date."
              : "Fell back to recent dated records because no same-weekday record existed."
            : "Showing data for the date encoded in the uploaded workbook filename."}
        </p>
      </div>
    </div>
  );
}

function DataControlPanel({ history, onSelectRecord }) {
  const [selectedRecordId, setSelectedRecordId] = useState("");

  function handleChange(event) {
    const recordId = event.target.value;
    setSelectedRecordId(recordId);
    if (recordId) {
      onSelectRecord(recordId);
    }
  }

  return (
    <div className="grid gap-6">
      <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-5 shadow-soft">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Historical Records
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Select a dated record from newest to oldest to quickly switch the
            dashboard view from uploaded workbooks stored in backend data.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <label
              htmlFor="history-record-select"
              className="text-sm text-slate-300"
            >
              Historical record
            </label>
            <select
              id="history-record-select"
              value={selectedRecordId}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
            >
              <option value="">Choose a record</option>
              {history.map((record) => (
                <option key={record.id} value={record.id}>
                  {`${new Date(`${record.dataDate}T00:00:00`).toLocaleDateString()} - ${record.originalName}`}
                </option>
              ))}
            </select>
          </div>

          {history?.length ? (
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Latest Available
              </p>
              <p className="mt-2 text-base font-semibold text-white">
                {history[0].originalName}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {new Date(
                  `${history[0].dataDate}T00:00:00`,
                ).toLocaleDateString()}{" "}
                • {history[0].weekday}
              </p>
              <p className="mt-3 text-sm text-slate-400">
                Uploaded workbook
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-400 lg:col-span-2">
              Historical records will appear here as uploaded dated workbooks.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function buildInsights(metrics) {
  const rooms = metrics.rooms || [];
  const overcrowdedRooms = rooms.filter(
    (room) => room.status === "overutilized",
  );
  const underutilizedRooms = rooms.filter(
    (room) => room.status === "underutilized",
  );
  const highestOccupancyRoom = rooms.reduce(
    (best, room) => (room.avgOccupancy > best.avgOccupancy ? room : best),
    rooms[0] || { roomId: "-", avgOccupancy: 0 },
  );
  const highestUtilizationRoom = rooms.reduce(
    (best, room) => (room.utilization > best.utilization ? room : best),
    rooms[0] || { roomId: "-", utilization: 0 },
  );

  return {
    overcrowdedCount: overcrowdedRooms.length,
    underutilizedCount: underutilizedRooms.length,
    highestOccupancyRoom,
    highestUtilizationRoom,
  };
}

function roomDisplayName(room) {
  return room?.roomNameEn || room?.roomNameHi || "Room";
}

export default function Dashboard({
  metrics,
  isLoading,
  isRefreshing,
  statusMessage,
  onReset,
  history,
  onSelectRecord,
}) {
  if (isLoading) {
    return (
      <LoadingState message="Loading the latest academic block metrics..." />
    );
  }

  if (!metrics) {
    return (
      <EmptyState message="Once you upload a valid Excel workbook, room occupancy, utilization, peak hour trends, and class pressure indicators will appear here." />
    );
  }

  const insights = useMemo(() => buildInsights(metrics), [metrics]);
  const [activeView, setActiveView] = useState("overview");

  const views = [
    { id: "overview", label: "Overview" },
    { id: "timetable", label: "Timetable" },
    { id: "availability", label: "Availability" },
    { id: "rooms", label: "Rooms" },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Simulation Dashboard
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            A live view of room load, utilization, and crowding pressure across
            the academic block.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {isRefreshing ? (
            <div className="rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
              Refreshing with uploaded workbook...
            </div>
          ) : null}
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
          >
            Back To Upload
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-[24px] border border-emerald-400/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-100">
          {statusMessage}
        </div>
      ) : null}

      <MetricMeta metrics={metrics} />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Total Rooms"
          value={metrics.summary.totalRooms}
          tone="orange"
        />
        <SummaryCard
          label="Average Occupancy"
          value={`${Math.round((metrics.summary.avgOccupancy || 0) * 100)}%`}
          tone="sky"
        />
        <SummaryCard
          label="Peak Hour"
          value={metrics.summary.peakHour}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InsightCard
          label="Overcrowded Rooms"
          value={insights.overcrowdedCount}
          helper="Rooms where at least one class exceeds available capacity."
        />
        <InsightCard
          label="Underutilized Rooms"
          value={insights.underutilizedCount}
          helper="Rooms spending less than 40% of the available block window in use."
        />
        <InsightCard
          label="Highest Occupancy Room"
          value={roomDisplayName(insights.highestOccupancyRoom)}
          helper={`${Math.round((insights.highestOccupancyRoom.avgOccupancy || 0) * 100)}% average occupancy.`}
        />
        <InsightCard
          label="Highest Utilization Room"
          value={roomDisplayName(insights.highestUtilizationRoom)}
          helper={`${Math.round((insights.highestUtilizationRoom.utilization || 0) * 100)}% room utilization.`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => setActiveView(view.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeView === view.id
                ? "border border-orange-400/30 bg-orange-500/15 text-orange-100"
                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      <DataControlPanel history={history} onSelectRecord={onSelectRecord} />

      {activeView === "overview" ? (
        <Charts rooms={metrics.rooms} timeSeries={metrics.timeSeries} />
      ) : null}

      {activeView === "timetable" ? (
        <ClassScheduleTable classes={metrics.classes} />
      ) : null}

      {activeView === "availability" ? (
        <RoomAvailabilityPanel rooms={metrics.rooms} classes={metrics.classes} />
      ) : null}

      {activeView === "rooms" ? <RoomTable rooms={metrics.rooms} /> : null}
    </section>
  );
}
