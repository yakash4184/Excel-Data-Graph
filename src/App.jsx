import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
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
  const [clientNameQuery, setClientNameQuery] = useState('');
  const [mobileQuery, setMobileQuery] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Upload a dataset to begin searching.');
  const [hasSearched, setHasSearched] = useState(false);

  const canSearch = allRows.length > 0;
  const stateOptions = useMemo(
    () => [...new Set(allRows.map((row) => row.State))].sort((a, b) => a.localeCompare(b)),
    [allRows]
  );

  const districtOptions = useMemo(() => {
    if (!stateQuery) return [];
    return [...new Set(allRows.filter((row) => row.State === stateQuery).map((row) => row.District))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [allRows, stateQuery]);

  const getFilteredRows = (stateValue, districtValue, clientValue, mobileValue) => {
    const normalizedClientValue = clientValue.toLowerCase();
    const normalizedMobileValue = mobileValue.replace(/[()\s-]/g, '');

    return allRows.filter((row) => {
      if (row.State !== stateValue) return false;
      if (districtValue && row.District !== districtValue) return false;
      if (normalizedClientValue && !row['Client Name'].toLowerCase().includes(normalizedClientValue)) return false;
      if (normalizedMobileValue && !row['Mobile Number'].includes(normalizedMobileValue)) return false;
      return true;
    });
  };

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

    const stateValue = stateQuery.trim();
    const districtValue = districtQuery.trim();
    const clientValue = clientNameQuery.trim();
    const mobileValue = mobileQuery.trim();

    if (!stateValue) {
      setFilteredRows([]);
      setError('State is required to search.');
      return;
    }

    setFilteredRows(getFilteredRows(stateValue, districtValue, clientValue, mobileValue));
  };

  const noDataFound = hasSearched && !error && filteredRows.length === 0;

  useEffect(() => {
    if (!allRows.length) return;

    const stateValue = stateQuery.trim();
    const districtValue = districtQuery.trim();
    const clientValue = clientNameQuery.trim();
    const mobileValue = mobileQuery.trim();

    if (!stateValue) {
      setFilteredRows([]);
      setHasSearched(false);
      return;
    }

    setError('');
    setHasSearched(true);

    setFilteredRows(getFilteredRows(stateValue, districtValue, clientValue, mobileValue));
  }, [allRows, stateQuery, districtQuery, clientNameQuery, mobileQuery]);

  const summary = useMemo(() => {
    if (!filteredRows.length) return null;
    const totalClients = filteredRows.length;
    const uniqueDistricts = new Set(filteredRows.map((row) => row.District)).size;
    const districtClientCounts = filteredRows.reduce((acc, row) => {
      acc[row.District] = (acc[row.District] || 0) + 1;
      return acc;
    }, {});

    return {
      totalClients,
      uniqueDistricts,
      districtClientCounts: Object.entries(districtClientCounts).sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [filteredRows]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">State & District Sales Client Dashboard</h1>
        <p className="mt-2 text-slate-600">State select karke district, client name ya mobile se exact client data search karein.</p>
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
          clientNameQuery={clientNameQuery}
          mobileQuery={mobileQuery}
          stateOptions={stateOptions}
          districtOptions={districtOptions}
          onStateChange={(value) => {
            setStateQuery(value);
            setDistrictQuery('');
          }}
          onDistrictChange={setDistrictQuery}
          onClientNameChange={setClientNameQuery}
          onMobileChange={setMobileQuery}
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
              <p className="text-sm text-slate-500">Total Clients</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalClients.toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Selected State</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stateQuery}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">{districtQuery ? 'Selected District' : 'Districts Covered'}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{districtQuery || summary.uniqueDistricts.toLocaleString()}</p>
            </div>
          </section>
        )}

        {summary && (
          <section className="rounded-2xl bg-white p-6 shadow-panel">
            <h3 className="text-lg font-semibold text-slate-900">District-wise Clients</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="px-3 py-2 font-semibold">District</th>
                    <th className="px-3 py-2 font-semibold">Clients</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.districtClientCounts.map(([districtName, clientCount]) => (
                    <tr key={districtName} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2">{districtName}</td>
                      <td className="px-3 py-2">{clientCount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
