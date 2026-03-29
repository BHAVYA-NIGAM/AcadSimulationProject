import { useRef, useState } from "react";

export default function FileUpload({ isUploading, onUpload, error, successMessage }) {
  const inputRef = useRef(null);
  const [selectedName, setSelectedName] = useState("");

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedName(file.name);
    await onUpload(file);
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Workbook Upload</h2>
          <p className="mt-1 text-sm text-slate-400">
            Accepted format: <span className="font-medium text-slate-200">.xlsx</span>
          </p>
        </div>
        {isUploading ? (
          <div className="flex items-center gap-2 text-sm text-orange-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-300 border-t-transparent" />
            Processing
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group flex w-full flex-col items-center justify-center rounded-3xl border border-dashed border-orange-400/60 bg-gradient-to-br from-orange-500/10 to-sky-500/10 px-6 py-12 text-center transition hover:border-orange-300 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="mb-2 text-sm uppercase tracking-[0.25em] text-orange-300">
          Upload Excel
        </span>
        <span className="max-w-xs text-xl font-semibold text-white">
          Drop in the latest academic block workbook to regenerate the dashboard.
        </span>
        <span className="mt-3 text-sm text-slate-400">
          {selectedName || "Choose a file to start the simulation"}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 min-h-12 space-y-2">
        {successMessage ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
