import axios from "axios";

// const API_BASE_URL =
//   window.location.hostname === "2k6mz6dc-8080.inc1.devtunnels.ms"
//     ? "https://2k6mz6dc-5173.inc1.devtunnels.ms"
//     : "http://127.0.0.1:8080";

const api = axios.create({
  baseURL: "http://127.0.0.1:8080",
});

export async function fetchMetrics() {
  const response = await api.get("/metrics");
  return response.data;
}

export async function fetchHistory() {
  const response = await api.get("/history");
  return response.data;
}

export async function fetchHistoryRecord(recordId) {
  const response = await api.get(`/history/${recordId}`);
  return response.data;
}

export async function fetchPrediction(daysAhead) {
  const response = await api.get("/predict", {
    params: { daysAhead },
  });
  return response.data;
}

export async function uploadWorkbook(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
