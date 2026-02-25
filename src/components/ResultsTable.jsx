const formatValue = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const hasDecimals = Math.abs(value % 1) > 0;
    return value.toLocaleString(undefined, {
      maximumFractionDigits: hasDecimals ? 2 : 0,
    });
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
};

function ResultsTable({ rows, headers }) {
  if (!rows.length) return null;

  const visibleHeaders = headers?.length ? headers : Object.keys(rows[0]?.data || {});

  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">Area Report Data Table</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              {visibleHeaders.map((header) => (
                <th key={header} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {header}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Growth</th>
              <th className="whitespace-nowrap px-3 py-2 font-semibold">Growth %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.state}-${row.district}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                {visibleHeaders.map((header) => (
                  <td key={`${row.state}-${row.district}-${header}-${idx}`} className="whitespace-nowrap px-3 py-2">
                    {formatValue(row.data?.[header])}
                  </td>
                ))}
                <td className={`whitespace-nowrap px-3 py-2 font-semibold ${row.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.growth >= 0 ? '+' : ''}
                  {formatValue(row.growth)}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 font-semibold ${row.growthPct >= 0 || row.growthPct === null ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.growthPct === null ? 'N/A' : `${row.growthPct >= 0 ? '+' : ''}${formatValue(row.growthPct)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ResultsTable;
