import ClassShiftPanel from "./ClassShiftPanel.jsx";
import RoomShiftControl from "./RoomShiftControl.jsx";

function statusClasses(status) {
  if (status === "overcrowded") {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (status === "underutilized") {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  if (status === "unassigned") {
    return "border-slate-400/30 bg-slate-500/10 text-slate-100";
  }
  return "border-sky-400/30 bg-sky-500/10 text-sky-100";
}

const FLOOR_ORDER = ["Ground", "First", "Second", "Third"];

function groupByFloor(classes) {
  const grouped = new Map();

  for (const classItem of classes) {
    const floor = classItem.floor || "Unassigned";
    const existing = grouped.get(floor) || [];
    existing.push(classItem);
    grouped.set(floor, existing);
  }

  return [...grouped.entries()]
    .map(([floor, items]) => ({
      floor,
      items: items.sort((left, right) => {
        const dayCompare = left.day.localeCompare(right.day);
        if (dayCompare !== 0) {
          return dayCompare;
        }
        return left.startTime.localeCompare(right.startTime);
      })
    }))
    .sort(
      (left, right) =>
        FLOOR_ORDER.indexOf(left.floor) - FLOOR_ORDER.indexOf(right.floor)
    );
}

export default function ClassScheduleTable({
  classes,
  rooms,
  currentRecordId,
  currentDate,
  history,
  onApplyOptimization,
  onSelectRecord,
}) {
  if (!classes?.length) {
    return (
      <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-white">Lecture Timeline</h3>
        <p className="mt-2 text-sm text-slate-400">
          Class-level lecture scheduling appears here when timetable rows are available in the selected record.
        </p>
      </article>
    );
  }

  const groupedClasses = groupByFloor(classes);

  return (
    <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Lecture Timeline</h3>
          <p className="mt-1 text-sm text-slate-400">
            A cleaner daily schedule view with room names, program mix, and occupancy pressure.
          </p>
        </div>

        <div className="min-w-[260px]">
          <label
            htmlFor="lecture-date-select"
            className="text-sm text-slate-300"
          >
            Timetable date
          </label>
          <select
            id="lecture-date-select"
            value={currentRecordId || ""}
            onChange={(event) => {
              if (event.target.value) {
                onSelectRecord(event.target.value);
              }
            }}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
          >
            <option value={currentRecordId || ""}>
              {currentDate
                ? new Date(`${currentDate}T00:00:00`).toLocaleDateString()
                : "Current date"}
            </option>
            {(history || [])
              .filter((record) => record.id !== currentRecordId)
              .map((record) => (
                <option key={record.id} value={record.id}>
                  {`${new Date(`${record.dataDate}T00:00:00`).toLocaleDateString()} - ${record.originalName}`}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <ClassShiftPanel
          classes={classes}
          rooms={rooms}
          recordId={currentRecordId}
          title="Shift Any Class"
          onApplied={onApplyOptimization}
        />

        {groupedClasses.map((group) => (
          <section key={group.floor} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">{group.floor} Floor</h4>
              <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {group.items.length} classes
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((classItem) => (
                <div
                  key={`${classItem.classId}-${classItem.day}-${classItem.startTime}`}
                  className={`rounded-[22px] border p-4 ${statusClasses(classItem.status)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-300/80">
                        {classItem.program}
                      </p>
                      <h5 className="mt-1 text-base font-semibold text-white">{classItem.subject}</h5>
                    </div>
                    <span className="rounded-full border border-white/10 bg-slate-950/40 px-2 py-1 text-[11px] font-semibold text-white">
                      {classItem.classId}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-slate-300">{classItem.day}</p>
                    <p className="text-white">
                      {classItem.startTime} - {classItem.endTime}
                    </p>
                    <p className="text-slate-200">
                      {classItem.roomNameEn || "Room"}
                    </p>
                    <p className="text-slate-300">
                      {[classItem.roomNameHi, classItem.floor].filter(Boolean).join(" • ")}
                    </p>
                    <p className="text-slate-200">
                      {classItem.studentCount} / {classItem.capacity} students
                    </p>
                    <p className="text-slate-100">
                      {Math.round(classItem.occupancy * 100)}% occupancy
                    </p>
                  </div>

                  <RoomShiftControl
                    classItem={classItem}
                    rooms={rooms}
                    classes={classes}
                    recordId={currentRecordId}
                    onApplied={onApplyOptimization}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
