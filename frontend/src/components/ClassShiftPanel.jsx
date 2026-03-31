import { useMemo, useState } from "react";
import { applyOptimization } from "../services/api.js";

function toMinutes(timeString) {
  const [hours, minutes] = String(timeString || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

function isSameSession(left, right) {
  return (
    left.classId === right.classId &&
    left.day === right.day &&
    left.startTime === right.startTime &&
    left.endTime === right.endTime
  );
}

function overlaps(left, right) {
  return (
    left.day === right.day &&
    toMinutes(left.startTime) < toMinutes(right.endTime) &&
    toMinutes(left.endTime) > toMinutes(right.startTime)
  );
}

function buildClassOptions(classes) {
  return [...(classes || [])].sort((left, right) => {
    const dayCompare = left.day.localeCompare(right.day);
    if (dayCompare !== 0) {
      return dayCompare;
    }

    const timeCompare = toMinutes(left.startTime) - toMinutes(right.startTime);
    if (timeCompare !== 0) {
      return timeCompare;
    }

    return left.classId.localeCompare(right.classId);
  });
}

function buildRoomOptions(classItem, rooms, classes) {
  if (!classItem) {
    return [];
  }

  return (rooms || [])
    .sort((left, right) =>
      (left.roomNameEn || left.roomId).localeCompare(right.roomNameEn || right.roomId),
    )
    .map((room) => {
      const hasCapacity = room.capacity >= (classItem.studentCount || 0);
      const hasConflict = (classes || []).some((candidate) => {
        if (candidate.roomId !== room.roomId) {
          return false;
        }

        if (isSameSession(candidate, classItem)) {
          return false;
        }

        return overlaps(candidate, classItem);
      });

      const isCurrentRoom = room.roomId === classItem.roomId;
      const disabled = !isCurrentRoom && (!hasCapacity || hasConflict);

      let suffix = "";
      if (!hasCapacity) {
        suffix = " (capacity low)";
      } else if (hasConflict) {
        suffix = " (occupied)";
      } else if (isCurrentRoom) {
        suffix = " (current)";
      } else {
        suffix = " (free)";
      }

      return {
        ...room,
        disabled,
        label: `${room.roomId} • ${room.roomNameEn || room.floor || "Room"}${suffix}`,
      };
    });
}

export default function ClassShiftPanel({
  classes,
  rooms,
  recordId,
  title = "Shift Class",
  onApplied,
}) {
  const [selectedKey, setSelectedKey] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const classOptions = useMemo(() => buildClassOptions(classes), [classes]);

  const selectedClass = useMemo(
    () =>
      classOptions.find(
        (classItem) =>
          `${classItem.classId}|${classItem.day}|${classItem.startTime}` === selectedKey,
      ) || null,
    [classOptions, selectedKey],
  );

  const roomOptions = useMemo(
    () => buildRoomOptions(selectedClass, rooms, classes),
    [selectedClass, rooms, classes],
  );

  async function handleApply() {
    if (!selectedClass || !selectedRoomId || selectedRoomId === selectedClass.roomId) {
      return;
    }

    setIsApplying(true);
    setError("");

    try {
      const response = await applyOptimization({
        recordId,
        classId: selectedClass.classId,
        day: selectedClass.day,
        startTime: selectedClass.startTime,
        toRoom: selectedRoomId,
      });

      onApplied(
        response.metrics,
        `${selectedClass.classId} shifted from ${selectedClass.roomId} to ${selectedRoomId}.`,
      );
      setSelectedKey("");
      setSelectedRoomId("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to shift the selected class.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className="mb-4">
        <h4 className="text-base font-semibold text-white">{title}</h4>
        <p className="mt-1 text-sm text-slate-400">
          Choose any class, then pick only from rooms that are free for that class time slot.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
        <select
          value={selectedKey}
          onChange={(event) => {
            setSelectedKey(event.target.value);
            setSelectedRoomId("");
          }}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-300"
        >
          <option value="">Select class</option>
          {classOptions.map((classItem) => (
            <option
              key={`${classItem.classId}-${classItem.day}-${classItem.startTime}`}
              value={`${classItem.classId}|${classItem.day}|${classItem.startTime}`}
            >
              {`${classItem.classId} • ${classItem.day} • ${classItem.startTime}-${classItem.endTime} • ${classItem.roomId}`}
            </option>
          ))}
        </select>

        <select
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          disabled={!selectedClass}
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            {selectedClass ? "Select available room" : "Choose class first"}
          </option>
          {roomOptions.map((room) => (
            <option key={room.roomId} value={room.roomId} disabled={room.disabled}>
              {room.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleApply}
          disabled={!selectedClass || !selectedRoomId || isApplying}
          className="rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApplying ? "Shifting..." : "Shift Class"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-rose-200">{error}</p>
      ) : null}
    </section>
  );
}
