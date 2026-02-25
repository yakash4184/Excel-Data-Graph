import { Suspense, lazy, useMemo, useState } from 'react';
import FileUploader from './components/FileUploader';
import ResultsTable from './components/ResultsTable';
import SearchPanel from './components/SearchPanel';
import { parseUploadedFile } from './utils/fileParser';
import { downloadSampleWorkbook } from './utils/sampleFile';

const CasesBarChart = lazy(() => import('./components/CasesBarChart'));
const DistrictMap = lazy(() => import('./components/DistrictMap'));

const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

function App() {
  const [allRows, setAllRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [nullRows, setNullRows] = useState([]);
  const [stateQuery, setStateQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Upload file karein. Data automatic parse ho jayega.');

  const canSearch = allRows.length > 0;

  const stateOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.state))].sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const districtOptions = useMemo(() => {
    if (!stateQuery) return [...new Set(allRows.map((row) => row.district))].sort((a, b) => a.localeCompare(b));
    return [...new Set(allRows.filter((row) => row.state === stateQuery).map((row) => row.district))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [allRows, stateQuery]);

  const applyFilter = (rows, selectedState, selectedDistrict) => {
    let result = rows;
    if (selectedState) {
      result = result.filter((row) => row.state === selectedState);
    }
    if (selectedDistrict) {
      result = result.filter((row) => row.district === selectedDistrict);
    }
    return result;
  };

  const setRowsAndResetFilters = (payload, messagePrefix) => {
    const rows = payload?.rows || [];
    const droppedRows = payload?.nullRows || [];
    setAllRows(rows);
    setNullRows(droppedRows);
    setStateQuery('');
    setDistrictQuery('');
    setFilteredRows(rows);
    const summaryMessage = `${messagePrefix || 'Data loaded successfully.'} Valid rows: ${rows.length}`;
    const nullMessage = droppedRows.length ? ` | Null/blank rows: ${droppedRows.length}` : '';
    setInfo(`${summaryMessage}${nullMessage}`);
  };

  const handleParseFile = async (file) => {
    setIsParsing(true);
    setError('');

    try {
      const parsed = await parseUploadedFile(file);
      setRowsAndResetFilters(parsed, `${file.name} parsed successfully.`);
    } catch (parseError) {
      setAllRows([]);
      setFilteredRows([]);
      setNullRows([]);
      setError(parseError.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSearch = () => {
    if (!canSearch) return;
    setError('');
    const nextRows = applyFilter(allRows, stateQuery, districtQuery);
    setFilteredRows(nextRows);
  };

  const handleReset = () => {
    setStateQuery('');
    setDistrictQuery('');
    setFilteredRows(allRows);
    setError('');
  };

  const summary = useMemo(() => {
    if (!filteredRows.length) return null;

    const totalDistributors = filteredRows.reduce((sum, row) => sum + row.distributorCount, 0);
    const totalRetailers = filteredRows.reduce((sum, row) => sum + row.retailerCount, 0);
    const totalSalesFY = filteredRows.reduce((sum, row) => sum + row.salesFY, 0);
    const totalSalesCurrent = filteredRows.reduce((sum, row) => sum + row.salesCurrent, 0);
    const growth = totalSalesCurrent - totalSalesFY;
    const growthPct = totalSalesFY === 0 ? null : (growth / totalSalesFY) * 100;

    return {
      states: new Set(filteredRows.map((row) => row.state)).size,
      districts: filteredRows.length,
      totalDistributors,
      totalRetailers,
      totalSalesFY,
      totalSalesCurrent,
      growth,
      growthPct,
    };
  }, [filteredRows]);

  const noDataFound = canSearch && filteredRows.length === 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">District Wise Sales Super Visual Dashboard</h1>
        <p className="mt-2 text-slate-600">
          State / district filter ke saath sales, growth, distributor aur retailer analytics ek jagah.
        </p>
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
          stateOptions={stateOptions}
          districtOptions={districtOptions}
          onStateChange={(value) => {
            setStateQuery(value);
            setDistrictQuery('');
          }}
          onDistrictChange={setDistrictQuery}
          onSearch={handleSearch}
          onReset={handleReset}
          disabled={!canSearch || isParsing}
        />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!error && info && <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{info}</div>}
        {!error && nullRows.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Null Data Rows (upload allowed)</p>
            <p className="mt-1">These rows were skipped from visuals/charts, but file uploaded successfully.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-100 text-left">
                    <th className="px-2 py-1 font-semibold">Row</th>
                    <th className="px-2 py-1 font-semibold">State</th>
                    <th className="px-2 py-1 font-semibold">District</th>
                    <th className="px-2 py-1 font-semibold">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {nullRows.slice(0, 20).map((item) => (
                    <tr key={`${item.rowNumber}-${item.reason}`} className="border-b border-amber-200">
                      <td className="px-2 py-1">{item.rowNumber}</td>
                      <td className="px-2 py-1">{item.state || '(blank)'}</td>
                      <td className="px-2 py-1">{item.district || '(blank)'}</td>
                      <td className="px-2 py-1">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {nullRows.length > 20 && <p className="mt-1">+{nullRows.length - 20} more null rows</p>}
          </div>
        )}
        {noDataFound && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            No Data Found
          </div>
        )}

        {summary && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">States Covered</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.states)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Districts</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.districts)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Distributors</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.totalDistributors)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Retailers</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.totalRetailers)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Sales FY 2024-25</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.totalSalesFY, 2)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Sales 24 Feb 2026</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.totalSalesCurrent, 2)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Absolute Growth</p>
              <p className={`mt-1 text-2xl font-bold ${summary.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {summary.growth >= 0 ? '+' : ''}
                {formatNumber(summary.growth, 2)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Growth %</p>
              <p className={`mt-1 text-2xl font-bold ${summary.growthPct >= 0 || summary.growthPct === null ? 'text-emerald-700' : 'text-rose-700'}`}>
                {summary.growthPct === null
                  ? 'N/A'
                  : `${summary.growthPct >= 0 ? '+' : ''}${formatNumber(summary.growthPct, 2)}%`}
              </p>
            </div>
          </section>
        )}

        {filteredRows.length > 0 && (
          <>
            <Suspense
              fallback={
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Visuals loading...
                </div>
              }
            >
              <div className="grid gap-6 xl:grid-cols-2">
                <CasesBarChart rows={filteredRows} />
                <DistrictMap rows={filteredRows} />
              </div>
            </Suspense>
            <ResultsTable rows={filteredRows} />
          </>
        )}
      </div>
    </main>
  );
}

export default App;
