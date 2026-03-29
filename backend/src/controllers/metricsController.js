import { buildMetricsFromWorkbook } from "../services/excelService.js";
import {
  optimizeRoomAllocation,
  runBatchSizeSimulation
} from "../services/simulationService.js";
import {
  buildPrediction,
  getStoredMetrics,
  getStoredRecord,
  listStoredHistory,
  saveStoredWorkbook
} from "../store/metricsStore.js";

export async function uploadWorkbook(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }

    const fileName = req.file.originalname || "";
    if (!/^\d{2}_\d{2}_\d{4}\.xlsx$/i.test(fileName)) {
      return res.status(400).json({
        message: "File name must follow dd_mm_yyyy.xlsx format, for example 29_03_2026.xlsx."
      });
    }

    const metrics = await buildMetricsFromWorkbook(req.file.buffer);
    const storedMetrics = await saveStoredWorkbook({
      originalName: req.file.originalname,
      buffer: req.file.buffer,
      metrics
    });

    return res.status(200).json({
      message: "Excel file uploaded and processed successfully.",
      metrics: storedMetrics
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMetrics(_req, res, next) {
  try {
    const metrics = await getStoredMetrics();

    if (!metrics) {
      return res.status(404).json({
        message: "No metrics available. Upload an Excel file first."
      });
    }

    return res.status(200).json(metrics);
  } catch (error) {
    return next(error);
  }
}

export async function getHistory(_req, res, next) {
  try {
    const history = await listStoredHistory();
    return res.status(200).json(history);
  } catch (error) {
    return next(error);
  }
}

export async function getHistoryRecord(req, res, next) {
  try {
    const metrics = await getStoredRecord(req.params.recordId);

    if (!metrics) {
      return res.status(404).json({
        message: "Requested historical record was not found."
      });
    }

    return res.status(200).json(metrics);
  } catch (error) {
    return next(error);
  }
}

export async function getPrediction(req, res, next) {
  try {
    const daysAhead = Number.parseInt(req.query.daysAhead || "1", 10);

    if (!Number.isInteger(daysAhead) || daysAhead < 1 || daysAhead > 30) {
      return res.status(400).json({
        message: "daysAhead must be an integer between 1 and 30."
      });
    }

    const prediction = await buildPrediction(daysAhead);

    if (!prediction) {
      return res.status(404).json({
        message: "Not enough historical uploads to generate a prediction yet."
      });
    }

    return res.status(200).json(prediction);
  } catch (error) {
    return next(error);
  }
}

export async function simulateBatchSize(req, res, next) {
  try {
    const metrics = await getStoredMetrics();
    if (!metrics) {
      return res.status(404).json({
        message: "No metrics available. Upload an Excel file first."
      });
    }

    const percentageIncrease = Number(req.body?.percentageIncrease);
    const simulation = runBatchSizeSimulation(metrics, percentageIncrease);
    return res.status(200).json(simulation);
  } catch (error) {
    return next(error);
  }
}

export async function optimizeRooms(_req, res, next) {
  try {
    const metrics = await getStoredMetrics();
    if (!metrics) {
      return res.status(404).json({
        message: "No metrics available. Upload an Excel file first."
      });
    }

    const optimization = optimizeRoomAllocation(metrics);
    return res.status(200).json(optimization);
  } catch (error) {
    return next(error);
  }
}
