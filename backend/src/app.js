import express from "express";
import cors from "cors";
import metricsRouter from "./routes/metricsRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      // "https://2k6mz6dc-8080.inc1.devtunnels.ms",
      "https://acad-simulation.vercel.app/"
    ],
    methods: ["GET", "POST", "OPTIONS"]
  })
);
app.use(express.json());

// app.get("/", (_req, res) => {
//   res.json({
//     status: "ok",
//     service: "Academic Block Simulation Backend",
//     endpoints: ["/health", "/metrics", "/history", "/upload", "/simulate", "/optimize"]
//   });
// });

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/", metricsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
