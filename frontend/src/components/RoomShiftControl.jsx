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

function buildRoomOptions(classItem, rooms, classes) {
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

export default function RoomShiftControl({
  classItem,
  rooms,
  classes,
  recordId,
  onApplied,
}) {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState("");

  const roomOptions = useMemo(
    () => buildRoomOptions(classItem, rooms, classes),
    [classItem, rooms, classes],
  );

  async function handleApply() {
    if (!selectedRoomId || selectedRoomId === classItem.roomId) {
      return;
    }

    setIsApplying(true);
    setError("");

    try {
      const response = await applyOptimization({
        recordId,
        classId: classItem.classId,
        day: classItem.day,
        startTime: classItem.startTime,
        toRoom: selectedRoomId,
      });

      onApplied(
        response.metrics,
        `${classItem.classId} shifted from ${classItem.roomId} to ${selectedRoomId}.`,
      );
      setSelectedRoomId("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to shift this class right now.",
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-2">
        <select
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-orange-300"
        >
          <option value="">Select available room</option>
          {roomOptions.map((room) => (
            <option key={room.roomId} value={room.roomId} disabled={room.disabled}>
              {room.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleApply}
          disabled={!selectedRoomId || selectedRoomId === classItem.roomId || isApplying}
          className="rounded-xl border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-sm text-orange-100 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isApplying ? "Shifting..." : "Shift"}
        </button>
      </div>

      {error ? (
        <p className="text-xs text-rose-200">{error}</p>
      ) : null}
    </div>
  );
}
