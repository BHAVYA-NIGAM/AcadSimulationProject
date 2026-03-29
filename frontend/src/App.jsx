import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import UploadLanding from "./components/UploadLanding.jsx";
import {
  fetchHistory,
  fetchHistoryRecord,
  fetchMetrics,
  uploadWorkbook
} from "./services/api.js";

export default function App() {
  const [metrics, setMetrics] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistoryRecord, setIsLoadingHistoryRecord] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState("upload");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    await Promise.all([loadMetrics(), loadHistory()]);
  }

  async function loadMetrics() {
    try {
      setError("");
      const response = await fetchMetrics();
      setMetrics(response);
      setCurrentPage("dashboard");
    } catch (requestError) {
      if (requestError.response?.status === 404) {
        setCurrentPage("upload");
      } else {
        const message =
          requestError.response?.data?.message || "Unable to load dashboard metrics.";
        setError(message);
        setCurrentPage("upload");
      }
    } finally {
      setIsInitialLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetchHistory();
      setHistory(response);
    } catch (_historyError) {
      setHistory([]);
    }
  }

  async function handleUpload(file) {
    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await uploadWorkbook(file);
      setMetrics(response.metrics);
      await loadHistory();
      setSuccessMessage("Dashboard refreshed successfully from the uploaded workbook.");
      setCurrentPage("dashboard");
    } catch (uploadError) {
      const message =
        uploadError.response?.data?.message || "Upload failed. Please try again.";
      setError(`${file.name}: ${message}`);
    } finally {
      setIsUploading(false);
    }
  }

  function handleResetToUpload() {
    setCurrentPage("upload");
    setError("");
    setSuccessMessage("");
  }

  async function handleLoadHistoryRecord(recordId) {
    setIsLoadingHistoryRecord(true);
    setError("");

    try {
      const recordMetrics = await fetchHistoryRecord(recordId);
      setMetrics(recordMetrics);
      setCurrentPage("dashboard");
      setSuccessMessage("Historical workbook loaded successfully.");
    } catch (historyError) {
      setError(
        historyError.response?.data?.message || "Unable to load the selected historical workbook."
      );
    } finally {
      setIsLoadingHistoryRecord(false);
    }
  }

  function handleOpenDashboard() {
    if (metrics) {
      setCurrentPage("dashboard");
    }
  }

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 text-slate-100 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {currentPage === "upload" ? (
          <UploadLanding
            isLoading={isInitialLoading}
            isUploading={isUploading}
            onUpload={handleUpload}
            error={error}
            successMessage={successMessage}
            hasMetrics={Boolean(metrics)}
            history={history}
            onOpenDashboard={handleOpenDashboard}
            onSelectRecord={handleLoadHistoryRecord}
          />
        ) : (
          <Dashboard
            metrics={metrics}
            isLoading={isInitialLoading}
            isRefreshing={isUploading || isLoadingHistoryRecord}
            statusMessage={successMessage}
            onReset={handleResetToUpload}
            history={history}
            onSelectRecord={handleLoadHistoryRecord}
          />
        )}
      </div>
    </main>
  );
}
