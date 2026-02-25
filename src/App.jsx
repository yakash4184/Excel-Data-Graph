import { Suspense, lazy, useMemo, useState } from 'react';
import AppErrorBoundary from './components/AppErrorBoundary';
import FileUploader from './components/FileUploader';
import ResultsTable from './components/ResultsTable';
import SearchPanel from './components/SearchPanel';
import { parseUploadedFile } from './utils/fileParser';
import { downloadSampleWorkbook } from './utils/sampleFile';

const CasesBarChart = lazy(() => import('./components/CasesBarChart'));
const GrowthChart = lazy(() => import('./components/GrowthChart'));
const DistrictMap = lazy(() => import('./components/DistrictMap'));

const formatNumber = (value, digits = 0) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

function App() {
  const [allRows, setAllRows] = useState([]);
  const [nullRows, setNullRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState({
    hasDistributor: false,
    hasRetailer: false,
    hasSalesFY: false,
    hasSalesCurrent: false,
  });
  const [stateQuery, setStateQuery] = useState('');
  const [districtQuery, setDistrictQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Upload your Excel/CSV file to start the dashboard.');

  const hasData = allRows.length > 0;

  const stateOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.state))].sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const districtOptions = useMemo(() => {
    const sourceRows = stateQuery ? allRows.filter((row) => row.state === stateQuery) : allRows;
    return [...new Set(sourceRows.map((row) => row.district))].sort((a, b) => a.localeCompare(b));
  }, [allRows, stateQuery]);

  const filteredRows = useMemo(() => {
    let result = allRows;
    if (stateQuery) {
      result = result.filter((row) => row.state === stateQuery);
    }
    if (districtQuery) {
      result = result.filter((row) => row.district === districtQuery);
    }
    return result;
  }, [allRows, stateQuery, districtQuery]);

  const dynamicNumericColumns = useMemo(() => {
    const blocked = new Set(['Distributor Count', 'Retailer Count', 'Sum of 2024-25', 'Sum of 24th feb.26']);
    return numericColumns.filter((column) => !blocked.has(column));
  }, [numericColumns]);

  const additionalColumnTotals = useMemo(() => {
    if (!filteredRows.length || !dynamicNumericColumns.length) return [];

    return dynamicNumericColumns
      .map((column) => {
        const total = filteredRows.reduce((sum, row) => {
          const value = row.data?.[column];
          return typeof value === 'number' && Number.isFinite(value) ? sum + value : sum;
        }, 0);

        return { column, total };
      })
      .filter((item) => Number.isFinite(item.total));
  }, [dynamicNumericColumns, filteredRows]);

  const handleParseFile = async (file) => {
    setIsParsing(true);
    setError('');

    try {
      const parsed = await parseUploadedFile(file);
      const validRows = parsed?.rows || [];
      const droppedRows = parsed?.nullRows || [];

      setAllRows(validRows);
      setNullRows(droppedRows);
      setHeaders(parsed?.headers || []);
      setNumericColumns(parsed?.numericColumns || []);
      setAvailableMetrics(parsed?.availableMetrics || {});
      setStateQuery('');
      setDistrictQuery('');

      const summary = `${file.name} uploaded successfully. Valid rows: ${validRows.length}`;
      const nullSummary = droppedRows.length ? ` | Null/blank rows skipped: ${droppedRows.length}` : '';
      setInfo(`${summary}${nullSummary}`);
    } catch (parseError) {
      setAllRows([]);
      setNullRows([]);
      setHeaders([]);
      setNumericColumns([]);
      setAvailableMetrics({
        hasDistributor: false,
        hasRetailer: false,
        hasSalesFY: false,
        hasSalesCurrent: false,
      });
      setStateQuery('');
      setDistrictQuery('');
      setError(parseError.message || 'Failed to parse file.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSearch = () => {
    if (!hasData) return;

    const scope = districtQuery
      ? `${districtQuery}, ${stateQuery || 'Selected State'}`
      : stateQuery || 'All States';

    setInfo(`Showing report for: ${scope}`);
    setError('');
  };

  const handleReset = () => {
    setStateQuery('');
    setDistrictQuery('');
    setError('');
    if (hasData) {
      setInfo('Showing report for all uploaded data.');
    }
  };

  const handleMapDistrictSelect = (stateName, districtName) => {
    setStateQuery(stateName || '');
    setDistrictQuery(districtName || '');
    setInfo(`Focused on district: ${districtName}, ${stateName}`);
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
      districts: new Set(filteredRows.map((row) => row.district)).size,
      totalDistributors,
      totalRetailers,
      totalSalesFY,
      totalSalesCurrent,
      growth,
      growthPct,
      rowCount: filteredRows.length,
    };
  }, [filteredRows]);

  const noDataFound = hasData && filteredRows.length === 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">India Sales & Client Coverage Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Track state-wise and district-wise client coverage, sales performance, growth, and detailed report data.
        </p>
      </header>

      <div className="space-y-6">
        <FileUploader onParseFile={handleParseFile} isParsing={isParsing} onDownloadSample={downloadSampleWorkbook} />

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
          disabled={!hasData || isParsing}
        />

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {!error && info && <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">{info}</div>}

        {!error && nullRows.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Null Data Rows (upload allowed)</p>
            <p className="mt-1">These rows were skipped from map/charts/table but the upload was successful.</p>
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
            No Data Found for the selected state/district.
          </div>
        )}

        {summary && (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">States in View</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.states)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Districts in View</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.districts)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Rows in View</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(summary.rowCount)}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Clients (Retailers)</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableMetrics.hasRetailer ? formatNumber(summary.totalRetailers) : formatNumber(summary.rowCount)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Distributors</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableMetrics.hasDistributor ? formatNumber(summary.totalDistributors) : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Sales FY 2024-25</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableMetrics.hasSalesFY ? formatNumber(summary.totalSalesFY, 2) : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Sales 24 Feb 2026</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {availableMetrics.hasSalesCurrent ? formatNumber(summary.totalSalesCurrent, 2) : 'N/A'}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Absolute Growth</p>
              <p className={`mt-1 text-2xl font-bold ${summary.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {availableMetrics.hasSalesFY && availableMetrics.hasSalesCurrent
                  ? `${summary.growth >= 0 ? '+' : ''}${formatNumber(summary.growth, 2)}`
                  : 'N/A'}
              </p>
            </div>
          </section>
        )}

        {summary && additionalColumnTotals.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-slate-900">Additional Numeric Columns (Auto Detected)</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {additionalColumnTotals.map((item) => (
                <div key={item.column} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{item.column}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{formatNumber(item.total, 2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasData && (
          <AppErrorBoundary fallbackTitle="Map rendering error">
            <Suspense
              fallback={
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  Loading map and visualizations...
                </div>
              }
            >
              <DistrictMap
                rows={filteredRows}
                selectedState={stateQuery}
                selectedDistrict={districtQuery}
                onSelectDistrict={handleMapDistrictSelect}
              />
            </Suspense>
          </AppErrorBoundary>
        )}

        {filteredRows.length > 0 && (
          <>
            <AppErrorBoundary fallbackTitle="Chart rendering error">
              <Suspense
                fallback={
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Loading chart visualizations...
                  </div>
                }
              >
                <div className="grid gap-6 xl:grid-cols-2">
                  <CasesBarChart rows={filteredRows} />
                  <GrowthChart rows={filteredRows} enabled={availableMetrics.hasSalesFY && availableMetrics.hasSalesCurrent} />
                </div>
              </Suspense>
            </AppErrorBoundary>
            <AppErrorBoundary fallbackTitle="Table rendering error">
              <ResultsTable rows={filteredRows} headers={headers} />
            </AppErrorBoundary>
          </>
        )}
      </div>
    </main>
  );
}

export default App;
