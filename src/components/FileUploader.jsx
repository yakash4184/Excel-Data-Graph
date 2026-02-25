import { useRef } from 'react';

function FileUploader({ onParseFile, isParsing, onDownloadSample }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onParseFile(selectedFile);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Upload Dataset</h2>
          <p className="mt-1 text-sm text-slate-600">
            Upload a <span className="font-medium">.xlsx</span> or <span className="font-medium">.csv</span> file.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onDownloadSample}
            className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Download Sample Excel
          </button>

          <button
            type="button"
            onClick={openFilePicker}
            disabled={isParsing}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isParsing ? 'Parsing...' : 'Upload File'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {isParsing && (
        <div className="mt-4 flex items-center gap-2 text-sm text-brand-700">
          <span className="h-3 w-3 animate-pulse rounded-full bg-brand-600" />
          Parsing file in browser...
        </div>
      )}
    </section>
  );
}

export default FileUploader;
