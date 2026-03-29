const UPPER_FLOORS = new Set(["Second", "Third"]);
const LOWER_FLOORS = new Set(["Ground", "First"]);

export function runBatchSizeSimulation(metrics, percentageIncrease) {
  if (!metrics?.classes?.length || !metrics?.rooms?.length) {
    const error = new Error("Simulation requires uploaded class-level data.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isFinite(percentageIncrease) || percentageIncrease <= 0) {
    const error = new Error("percentageIncrease must be a positive number.");
    error.statusCode = 400;
    throw error;
  }

  const multiplier = 1 + percentageIncrease / 100;
  const simulatedClasses = metrics.classes.map((classItem) => {
    const simulatedStudentCount = Math.round(classItem.studentCount * multiplier);
    const simulatedOccupancy = classItem.capacity
      ? simulatedStudentCount / classItem.capacity
      : 0;

    return {
      classId: classItem.classId,
      subject: classItem.subject,
      roomId: classItem.roomId,
      roomNameEn: classItem.roomNameEn || "",
      program: classItem.program || "Management",
      day: classItem.day,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      simulatedStudentCount,
      simulatedOccupancy: round(simulatedOccupancy),
      overloadBy: Math.max(simulatedStudentCount - classItem.capacity, 0)
    };
  });

  const avgOccupancy =
    simulatedClasses.reduce((sum, classItem) => sum + classItem.simulatedOccupancy, 0) /
    Math.max(simulatedClasses.length, 1);

  const overloadedRooms = metrics.rooms
    .map((room) => {
      const impactedClasses = simulatedClasses.filter(
        (classItem) =>
          classItem.roomId === room.roomId && classItem.simulatedOccupancy > 1
      );

      if (!impactedClasses.length) {
        return null;
      }

      return {
        roomId: room.roomId,
        roomNameEn: room.roomNameEn || "",
        floor: room.floor || "",
        overloadedClasses: impactedClasses.length,
        maxOccupancy: round(
          Math.max(...impactedClasses.map((classItem) => classItem.simulatedOccupancy))
        )
      };
    })
    .filter(Boolean);

  const criticalClasses = simulatedClasses
    .filter((classItem) => classItem.simulatedOccupancy >= 1)
    .sort((left, right) => right.simulatedOccupancy - left.simulatedOccupancy)
    .slice(0, 12);

  return {
    percentageIncrease,
    avgOccupancy: round(avgOccupancy),
    overloadedRooms,
    criticalClasses
  };
}

export function optimizeRoomAllocation(metrics) {
  if (!metrics?.classes?.length || !metrics?.rooms?.length) {
    const error = new Error("Optimization requires uploaded class-level data.");
    error.statusCode = 400;
    throw error;
  }

  const candidateRooms = metrics.rooms.filter(
    (room) => LOWER_FLOORS.has(room.floor) && room.status === "underutilized"
  );
  const movableClasses = metrics.classes.filter((classItem) =>
    UPPER_FLOORS.has(classItem.floor)
  );

  const suggestions = movableClasses
    .map((classItem) => {
      const currentRoom = metrics.rooms.find((room) => room.roomId === classItem.roomId);
      const availableTarget = candidateRooms
        .filter((room) => room.capacity >= classItem.studentCount)
        .filter((room) => room.roomId !== classItem.roomId)
        .filter((room) => !hasTimeConflict(room.roomId, classItem, metrics.classes))
        .sort((left, right) => {
          const floorScore = floorRank(left.floor) - floorRank(right.floor);
          if (floorScore !== 0) {
            return floorScore;
          }

          return Math.abs(left.capacity - classItem.studentCount) - Math.abs(right.capacity - classItem.studentCount);
        })[0];

      if (!availableTarget) {
        return null;
      }

      return {
        classId: classItem.classId,
        fromRoom: classItem.roomId,
        fromRoomName: classItem.roomNameEn || "",
        toRoom: availableTarget.roomId,
        toRoomName: availableTarget.roomNameEn || "",
        improvement: buildImprovementLabel(currentRoom, classItem, availableTarget)
      };
    })
    .filter(Boolean);

  return { suggestions };
}

function hasTimeConflict(targetRoomId, classToMove, allClasses) {
  return allClasses.some((classItem) => {
    if (classItem.roomId !== targetRoomId || classItem.day !== classToMove.day) {
      return false;
    }

    return (
      toMinutes(classToMove.startTime) < toMinutes(classItem.endTime) &&
      toMinutes(classToMove.endTime) > toMinutes(classItem.startTime)
    );
  });
}

function buildImprovementLabel(currentRoom, classItem, targetRoom) {
  const floorMessage = `${classItem.floor} to ${targetRoom.floor}`;
  const capacityMessage = `${classItem.studentCount}/${targetRoom.capacity} fit`;

  if (!currentRoom) {
    return `Shifted ${floorMessage} with ${capacityMessage}.`;
  }

  return `Moves class from ${currentRoom.roomNameEn || currentRoom.roomId} on ${floorMessage}; ${capacityMessage}.`;
}

function floorRank(floor) {
  if (floor === "Ground") {
    return 0;
  }
  if (floor === "First") {
    return 1;
  }
  if (floor === "Second") {
    return 2;
  }
  return 3;
}

function toMinutes(timeString) {
  const [hours, minutes] = String(timeString).split(":").map(Number);
  return hours * 60 + minutes;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
