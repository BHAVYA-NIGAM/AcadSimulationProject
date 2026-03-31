import ClassShiftPanel from "./ClassShiftPanel.jsx";
import { useEffect, useMemo, useState } from "react";
import RoomShiftControl from "./RoomShiftControl.jsx";

const FLOOR_ORDER = ["Ground", "First", "Second", "Third"];

function toMinutes(timeString) {
  const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function formatWindowLabel(startTime, endTime) {
  return `${startTime} - ${endTime}`;
}

function overlapSession(classItem, startMinutes, endMinutes, selectedDay) {
  if (classItem.day !== selectedDay) {
    return false;
  }

  return (
    toMinutes(classItem.startTime) < endMinutes &&
    toMinutes(classItem.endTime) > startMinutes
  );
}

function sortByFloorAndName(rooms) {
  return [...rooms].sort((left, right) => {
    const floorRank =
      FLOOR_ORDER.indexOf(left.floor) - FLOOR_ORDER.indexOf(right.floor);

    if (floorRank !== 0) {
      return floorRank;
    }

    return (left.roomNameEn || left.roomId || "").localeCompare(
      right.roomNameEn || right.roomId || "",
    );
  });
}

function buildAvailability(rooms, classes, selectedDay, startTime, endTime) {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);

  return sortByFloorAndName(rooms).map((room) => {
    const matchingClasses = classes
      .filter((classItem) => classItem.roomId === room.roomId)
      .filter((classItem) =>
        overlapSession(classItem, startMinutes, endMinutes, selectedDay),
      )
      .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));

    return {
      ...room,
      matches: matchingClasses,
      isEmpty: matchingClasses.length === 0,
    };
  });
}

function isUnassignedRoom(roomId) {
  return String(roomId || "").trim().toUpperCase() === "TBA";
}

export default function RoomAvailabilityPanel({
  rooms,
  classes,
  currentRecordId,
  onApplyOptimization,
}) {
  const dayOptions = useMemo(
    () =>
      [...new Set((classes || []).map((classItem) => classItem.day).filter(Boolean))].sort(),
    [classes],
  );
  const [selectedDay, setSelectedDay] = useState(dayOptions[0] || "Monday");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("10:30");

  useEffect(() => {
    if (!dayOptions.length) {
      return;
    }

    if (!dayOptions.includes(selectedDay)) {
      setSelectedDay(dayOptions[0]);
    }
  }, [dayOptions, selectedDay]);

  const hasInvalidWindow = toMinutes(endTime) <= toMinutes(startTime);

  const availability = useMemo(() => {
    if (hasInvalidWindow) {
      return [];
    }

    return buildAvailability(
      rooms || [],
      classes || [],
      selectedDay,
      startTime,
      endTime,
    );
  }, [classes, endTime, hasInvalidWindow, rooms, selectedDay, startTime]);

  const unassignedClasses = useMemo(() => {
    if (hasInvalidWindow) {
      return [];
    }

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    return (classes || [])
      .filter((classItem) => isUnassignedRoom(classItem.roomId))
      .filter((classItem) =>
        overlapSession(classItem, startMinutes, endMinutes, selectedDay),
      )
      .sort((left, right) => toMinutes(left.startTime) - toMinutes(right.startTime));
  }, [classes, endTime, hasInvalidWindow, selectedDay, startTime]);

  const occupiedCount = availability.filter((room) => !room.isEmpty).length;
  const emptyCount = availability.length - occupiedCount;

  if (!rooms?.length) {
    return (
      <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-white">Room Availability Finder</h3>
        <p className="mt-2 text-sm text-slate-400">
          Upload a workbook to inspect which rooms are empty during a selected time window.
        </p>
      </article>
    );
  }

  return (
    <article className="rounded-[30px] border border-white/10 bg-slate-950/60 p-6 shadow-soft">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Room Availability Finder</h3>
        <p className="mt-1 text-sm text-slate-400">
          Pick a day and time window to see which classrooms are empty and which section is occupying each room.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto]">
        <div>
          <label htmlFor="availability-day" className="text-sm text-slate-300">
            Day
          </label>
          <select
            id="availability-day"
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
          >
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="availability-start" className="text-sm text-slate-300">
            Start time
          </label>
          <input
            id="availability-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
          />
        </div>

        <div>
          <label htmlFor="availability-end" className="text-sm text-slate-300">
            End time
          </label>
          <input
            id="availability-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-orange-300"
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Window</p>
          <p className="mt-2 font-semibold text-white">
            {formatWindowLabel(startTime, endTime)}
          </p>
          <p className="mt-1 text-slate-400">{selectedDay}</p>
        </div>
      </div>

      {hasInvalidWindow ? (
        <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          End time must be after start time to check room availability.
        </div>
      ) : (
        <>
          <ClassShiftPanel
            classes={(classes || []).filter((classItem) => classItem.day === selectedDay)}
            rooms={rooms}
            recordId={currentRecordId}
            title="Shift Any Class"
            onApplied={onApplyOptimization}
          />

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">
                Empty Rooms
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{emptyCount}</p>
            </div>
            <div className="rounded-[24px] border border-orange-400/20 bg-orange-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-100/80">
                Occupied Rooms
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{occupiedCount}</p>
            </div>
            <div className="rounded-[24px] border border-sky-400/20 bg-sky-500/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-100/80">
                Total Rooms
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{availability.length}</p>
            </div>
          </div>

          <section className="mt-5 rounded-[24px] border border-amber-400/30 bg-amber-500/10 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-base font-semibold text-white">
                  Unassigned Classroom Entries
                </h4>
                <p className="mt-1 text-sm text-slate-300">
                  Timetable sessions with room marked as <span className="font-semibold text-white">TBA</span>
                  {" "}during {formatWindowLabel(startTime, endTime)} on {selectedDay}.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {unassignedClasses.length} unassigned
              </span>
            </div>

            {unassignedClasses.length ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {unassignedClasses.map((classItem) => (
                  <div
                    key={`unassigned-${classItem.classId}-${classItem.startTime}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-100"
                  >
                    <p className="font-semibold text-white">{classItem.classId}</p>
                    <p className="mt-1 text-slate-300">{classItem.subject}</p>
                    <p className="mt-2 text-slate-200">
                      {classItem.startTime} - {classItem.endTime}
                    </p>
                    <p className="mt-1 text-slate-300">
                      {classItem.studentCount} students • room pending
                    </p>

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
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-amber-100">
                No `TBA` timetable entries overlap this selected time window.
              </div>
            )}
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {availability.map((room) => (
              <section
                key={room.roomId}
                className={`rounded-[24px] border p-5 shadow-soft ${
                  room.isEmpty
                    ? "border-emerald-400/30 bg-emerald-500/10"
                    : "border-orange-400/30 bg-orange-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">
                      {room.roomNameEn || room.roomId}
                    </h4>
                    <p className="mt-1 text-sm text-slate-300">
                      {[room.roomNameHi, room.floor, room.type].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {room.isEmpty ? "Empty" : "Occupied"}
                  </span>
                </div>

                {room.isEmpty ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-emerald-100">
                    No class overlaps this room during {formatWindowLabel(startTime, endTime)}.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {room.matches.map((classItem) => (
                      <div
                        key={`${room.roomId}-${classItem.classId}-${classItem.startTime}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/30 p-4 text-sm text-slate-100"
                      >
                        <p className="font-semibold text-white">{classItem.classId}</p>
                        <p className="mt-1 text-slate-300">{classItem.subject}</p>
                        <p className="mt-2 text-slate-200">
                          {classItem.startTime} - {classItem.endTime}
                        </p>
                        <p className="mt-1 text-slate-300">
                          {classItem.studentCount} students • {Math.round(classItem.occupancy * 100)}%
                          {" "}occupancy
                        </p>

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
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
