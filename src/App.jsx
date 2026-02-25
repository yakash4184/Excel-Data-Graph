import { Suspense, lazy, useMemo, useState } from 'react';
import FileUploader from './components/FileUploader';
import ResultsTable from './components/ResultsTable';
import SearchPanel from './components/SearchPanel';
import { parseUploadedFile } from './utils/fileParser';
import { downloadSampleWorkbook } from './utils/sampleFile';

const CasesBarChart = lazy(() => import('./components/CasesBarChart'));
const DistrictMap = lazy(() => import('./components/DistrictMap'));

function App() {
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [stateQuery, setStateQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Upload a dataset to begin searching.');
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = allRows.length > 0;

  const handleParseFile = async (file) => {
    setIsParsing(true);
    setError('');
    setInfo('');
    setHasSearched(false);

    try {
      const rows = await parseUploadedFile(file);
      setAllRows(rows);
      setFilteredRows([]);
      setInfo(rows.length ? `File parsed successfully. ${rows.length} rows loaded.` : 'File loaded but contains no data rows.');
    } catch (parseError) {
      setAllRows([]);
      setFilteredRows([]);
      setError(parseError.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSearch = () => {
    setError('');
    setHasSearched(true);

    const stateValue = stateQuery.trim().toLowerCase();
    const districtValue = districtQuery.trim().toLowerCase();

    if (!stateValue) {
      setFilteredRows([]);
      setError('State is required to search.');
      return;
    }

    const stateMatches = allRows.filter((row) => row.State.toLowerCase() === stateValue);

    if (!districtValue) {
      setFilteredRows(stateMatches);
      return;
    }

    const exactDistrictMatches = stateMatches.filter((row) => row.District.toLowerCase() === districtValue);
    setFilteredRows(exactDistrictMatches);
  };

  const noDataFound = hasSearched && !error && filteredRows.length === 0;

  const summary = useMemo(() => {
    if (!filteredRows.length) return null;
    const totalCases = filteredRows.reduce((sum, row) => sum + row.Cases, 0);
    const totalPopulation = filteredRows.reduce((sum, row) => sum + row.Population, 0);

    return {
      districts: filteredRows.length,
      totalCases,
      totalPopulation,
    };
  }, [filteredRows]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">State and District Health Dashboard</h1>
        <p className="mt-2 text-slate-600">Frontend-only React app with XLSX parsing, filtering, chart insights, and map visualization.</p>
      </header>

      <div className="space-y-6">
        <FileUploader
          onParseFile={handleParseFile}
          isParsing={isParsing}
          onDownloadSample={downloadSampleWorkbook}
        />

        <SearchPanel
          stateQuery={stateQuery}
          districtQuery={districtQuery}
          onStateChange={setStateQuery}
          onDistrictChange={setDistrictQuery}
          onSearch={handleSearch}
          disabled={!canSearch || isParsing}
        />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!error && info && <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{info}</div>}
        {noDataFound && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">No Data Found</div>
        )}

        {summary && (
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Districts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.districts}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Total Cases</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalCases.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Total Population</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalPopulation.toLocaleString()}</p>
            </div>
          </section>
        )}

        {filteredRows.length > 0 && (
          <>
            <ResultsTable rows={filteredRows} />
            <Suspense
              fallback={
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Loading visualizations...
                </div>
              }
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <CasesBarChart rows={filteredRows} />
                <DistrictMap rows={filteredRows} />
              </div>
            </Suspense>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
