import { Router } from "express";
import multer from "multer";
import {
  getHistory,
  getHistoryRecord,
  getMetrics,
  optimizeRooms,
  getPrediction,
  simulateBatchSize,
  uploadWorkbook
} from "../controllers/metricsController.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post("/upload", upload.single("file"), uploadWorkbook);
router.get("/metrics", getMetrics);
router.get("/history", getHistory);
router.get("/history/:recordId", getHistoryRecord);
router.get("/predict", getPrediction);
router.post("/simulate", simulateBatchSize);
router.get("/optimize", optimizeRooms);

export default router;
