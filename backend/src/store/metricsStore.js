import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.resolve(__dirname, "../../data");
const uploadsDirectory = path.join(dataDirectory, "uploads");
const recordsDirectory = path.join(dataDirectory, "records");

export async function saveStoredWorkbook({ originalName, buffer, metrics }) {
  await ensureDirectories();

  const now = new Date();
  const dataDate = parseDataDateFromFileName(originalName || "");
  const id = `record-${now.getTime()}`;
  const safeName = sanitizeFileName(originalName || "upload.xlsx");
  const workbookFileName = `${id}-${safeName}`;
  const workbookPath = path.join(uploadsDirectory, workbookFileName);

  await fs.writeFile(workbookPath, buffer);

  const record = {
    id,
    originalName: originalName || "upload.xlsx",
    storedFileName: workbookFileName,
    uploadedAt: now.toISOString(),
    dataDate,
    metrics: attachActualMeta(metrics, {
      id,
      originalName: originalName || "upload.xlsx",
      uploadedAt: now.toISOString(),
      dataDate
    })
  };

  await fs.writeFile(
    path.join(recordsDirectory, `${id}.json`),
    JSON.stringify(record, null, 2),
    "utf8"
  );

  return record.metrics;
}

export async function getStoredMetrics() {
  const records = await readAllRecords();
  return records[0]?.metrics || null;
}

export async function listStoredHistory() {
  const records = await readAllRecords();
  return records.map((record) => ({
    id: record.id,
    originalName: record.originalName,
    uploadedAt: record.uploadedAt,
    dataDate: normalizeRecordDate(record),
    source: "upload",
    weekday: getWeekday(normalizeRecordDate(record)),
    summary: record.metrics.summary
  }));
}

export async function getStoredRecord(recordId) {
  const records = await readAllRecords();
  const record = records.find((entry) => entry.id === recordId);
  return record?.metrics || null;
}

export async function buildPrediction(daysAhead) {
  const records = await readAllRecords();
  if (records.length === 0) {
    return null;
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const targetDateIso = toDateOnlyIso(targetDate);
  const targetWeekday = getWeekday(targetDateIso);

  const sameWeekdayRecords = records.filter(
    (record) => getWeekday(normalizeRecordDate(record)) === targetWeekday
  );
  const fallbackRecords = records.slice(0, Math.min(records.length, 5));
  const sourceRecords = sameWeekdayRecords.length > 0 ? sameWeekdayRecords : fallbackRecords;
  const predictionStrategy =
    sameWeekdayRecords.length > 0 ? "same-weekday-history" : "recent-history-fallback";

  return attachPredictionMeta(computePredictedMetrics(sourceRecords), {
    targetDate: targetDateIso,
    targetWeekday,
    daysAhead,
    predictionStrategy,
    basedOnRecordCount: sourceRecords.length,
    basedOnRecordIds: sourceRecords.map((record) => record.id)
  });
}

async function ensureDirectories() {
  await fs.mkdir(uploadsDirectory, { recursive: true });
  await fs.mkdir(recordsDirectory, { recursive: true });
}

async function readAllRecords() {
  await ensureDirectories();

  const records = await readSavedUploadRecords();

  return records.sort(
    (left, right) => {
      const dateDiff =
        new Date(normalizeRecordDate(right)).getTime() -
        new Date(normalizeRecordDate(left)).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime();
    }
  );
}

async function readSavedUploadRecords() {
  const fileNames = await fs.readdir(recordsDirectory);
  const jsonFiles = fileNames.filter((fileName) => fileName.endsWith(".json"));

  return Promise.all(
    jsonFiles.map(async (fileName) => {
      const contents = await fs.readFile(path.join(recordsDirectory, fileName), "utf8");
      return JSON.parse(contents);
    })
  );
}

function computePredictedMetrics(records) {
  const metricsList = records.map((record) => record.metrics);
  const roomMap = new Map();
  const timeSeriesMap = new Map();
  const latestClasses =
    records.find((record) => (record.metrics?.classes || []).length > 0)?.metrics?.classes || [];

  for (const metrics of metricsList) {
    for (const room of metrics.rooms || []) {
      const entry = roomMap.get(room.roomId) || {
        roomId: room.roomId,
        capacityTotal: 0,
        occupancyTotal: 0,
        utilizationTotal: 0,
        count: 0,
        recommendations: [],
        roomNamesEn: [],
        roomNamesHi: [],
        floors: [],
        types: []
      };

      entry.capacityTotal += room.capacity || 0;
      entry.occupancyTotal += room.avgOccupancy || 0;
      entry.utilizationTotal += room.utilization || 0;
      entry.count += 1;
      if (room.roomNameEn) {
        entry.roomNamesEn.push(room.roomNameEn);
      }
      if (room.roomNameHi) {
        entry.roomNamesHi.push(room.roomNameHi);
      }
      if (room.floor) {
        entry.floors.push(room.floor);
      }
      if (room.type) {
        entry.types.push(room.type);
      }
      if (room.recommendation) {
        entry.recommendations.push(room.recommendation);
      }
      roomMap.set(room.roomId, entry);
    }

    for (const point of metrics.timeSeries || []) {
      const entry = timeSeriesMap.get(point.time) || {
        time: point.time,
        studentsTotal: 0,
        count: 0
      };
      entry.studentsTotal += point.students || 0;
      entry.count += 1;
      timeSeriesMap.set(point.time, entry);
    }
  }

  const rooms = [...roomMap.values()]
    .map((entry) => {
      const capacity = Math.round(entry.capacityTotal / Math.max(entry.count, 1));
      const avgOccupancy = round(entry.occupancyTotal / Math.max(entry.count, 1));
      const utilization = round(entry.utilizationTotal / Math.max(entry.count, 1));

      let status = "normal";
      if (avgOccupancy > 1) {
        status = "overutilized";
      } else if (utilization < 0.4) {
        status = "underutilized";
      }

      return {
        roomId: entry.roomId,
        roomNameEn: mostCommon(entry.roomNamesEn),
        roomNameHi: mostCommon(entry.roomNamesHi),
        floor: mostCommon(entry.floors),
        type: mostCommon(entry.types),
        capacity,
        avgOccupancy,
        utilization,
        status,
        recommendation: mostCommon(entry.recommendations)
      };
    })
    .sort((left, right) => left.roomId.localeCompare(right.roomId));

  const timeSeries = [...timeSeriesMap.values()]
    .map((entry) => ({
      time: entry.time,
      students: Math.round(entry.studentsTotal / Math.max(entry.count, 1))
    }))
    .sort((left, right) => toMinutes(left.time) - toMinutes(right.time));

  const avgOccupancy =
    metricsList.reduce((sum, metrics) => sum + (metrics.summary?.avgOccupancy || 0), 0) /
    Math.max(metricsList.length, 1);

  const totalRooms =
    metricsList.reduce((sum, metrics) => sum + (metrics.summary?.totalRooms || 0), 0) /
    Math.max(metricsList.length, 1);

  const peakHour = mostCommon(
    metricsList
      .map((metrics) => metrics.summary?.peakHour)
      .filter(Boolean)
  );

  const classes = latestClasses.map((classItem) => {
    const room = rooms.find((roomEntry) => roomEntry.roomId === classItem.roomId);
    const capacity = room?.capacity || classItem.capacity || 0;
    const occupancy = room?.avgOccupancy || classItem.occupancy || 0;
    const studentCount = Math.round(capacity * occupancy);

    let status = "normal";
    if (occupancy > 1) {
      status = "overcrowded";
    } else if (occupancy < 0.4) {
      status = "underutilized";
    }

    return {
      ...classItem,
      roomNameEn: room?.roomNameEn || classItem.roomNameEn || "",
      roomNameHi: room?.roomNameHi || classItem.roomNameHi || "",
      floor: room?.floor || classItem.floor || "",
      type: room?.type || classItem.type || "",
      capacity,
      studentCount,
      occupancy: round(occupancy),
      status
    };
  });

  return {
    summary: {
      totalRooms: Math.round(totalRooms),
      avgOccupancy: round(avgOccupancy),
      peakHour: peakHour || "N/A"
    },
    rooms,
    timeSeries,
    classes
  };
}

function attachActualMeta(metrics, { id, originalName, uploadedAt, dataDate, source = "upload" }) {
  return {
    ...metrics,
    meta: {
      recordId: id,
      recordType: "actual",
      originalName,
      uploadedAt,
      dataDate,
      source,
      label: "Uploaded Workbook",
      weekday: getWeekday(dataDate)
    }
  };
}

function attachPredictionMeta(metrics, metadata) {
  return {
    ...metrics,
    meta: {
      recordType: "predicted",
      label: "Predicted Metrics",
      generatedAt: new Date().toISOString(),
      ...metadata
    }
  };
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getWeekday(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" });
}

function parseDataDateFromFileName(fileName) {
  const match = String(fileName).match(/^(\d{2})_(\d{2})_(\d{4})\.xlsx$/i);
  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const isoDate = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() + 1 !== Number(month) ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return isoDate;
}

function normalizeRecordDate(record) {
  return record.dataDate || record.metrics?.meta?.dataDate || toDateOnlyIso(record.uploadedAt);
}

function toDateOnlyIso(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().slice(0, 10);
}

function mostCommon(values) {
  if (!values.length) {
    return "";
  }

  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function toMinutes(timeString) {
  const [hours, minutes] = String(timeString).split(":").map(Number);
  return hours * 60 + minutes;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
