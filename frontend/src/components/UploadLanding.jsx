import FileUpload from "./FileUpload.jsx";

function LoadingState() {
  return (
    <section className="rounded-[30px] border border-white/10 bg-slate-950/55 p-10 text-center shadow-soft">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-300/30 border-t-orange-300" />
      <p className="mt-4 text-sm text-slate-300">Checking for the latest academic block data...</p>
    </section>
  );
}

export default function UploadLanding({
  isLoading,
  isUploading,
  onUpload,
  error,
  successMessage,
  hasMetrics,
  history,
  onOpenDashboard,
  onSelectRecord
}) {
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-soft backdrop-blur">
      <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_0.8fr] lg:p-8">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.35em] text-orange-300">
            Academic Block Simulation
          </p>
          <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
            Upload your timetable workbook and move into a dedicated dashboard view.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Start on this upload screen, choose an Excel workbook named in
            <span className="mx-1 font-semibold text-white">dd_mm_yyyy.xlsx</span>
            format, and the app will treat that filename date as the dataset date. The dashboard
            then opens automatically and stores the uploaded workbook inside backend data for
            future historical use.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 1</p>
              <p className="mt-2 text-sm text-white">Upload one `.xlsx` workbook named like `29_03_2026.xlsx`.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 2</p>
              <p className="mt-2 text-sm text-white">The app processes room load, utilization, and peak-hour pressure.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Step 3</p>
              <p className="mt-2 text-sm text-white">You land on the dashboard page with charts and room-level insights.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasMetrics ? (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="rounded-full border border-sky-400/30 bg-sky-500/10 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/20"
              >
                Open Current Dashboard
              </button>
            ) : null}
          </div>

          {history?.length ? (
            <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Historical Records</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Open previously uploaded workbook snapshots stored in backend data.
                </p>
              </div>
              <div className="space-y-3">
                {history.slice(0, 6).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => onSelectRecord(record.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{record.originalName}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(`${record.dataDate}T00:00:00`).toLocaleDateString()} • {record.weekday}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs uppercase tracking-[0.2em] text-orange-300">
                        Upload
                      </span>
                      <p className="mt-1 text-xs text-slate-400">Open</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <FileUpload
          isUploading={isUploading}
          onUpload={onUpload}
          error={error}
          successMessage={successMessage}
        />
      </div>
    </section>
  );
}
