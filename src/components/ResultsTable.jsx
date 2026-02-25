function formatNumber(value, digits = 0) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function ResultsTable({ rows }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">District Performance Table</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              <th className="px-3 py-2 font-semibold">State</th>
              <th className="px-3 py-2 font-semibold">District</th>
              <th className="px-3 py-2 font-semibold">Distributors</th>
              <th className="px-3 py-2 font-semibold">Retailers</th>
              <th className="px-3 py-2 font-semibold">Sales 2024-25</th>
              <th className="px-3 py-2 font-semibold">Sales 24 Feb 2026</th>
              <th className="px-3 py-2 font-semibold">Growth</th>
              <th className="px-3 py-2 font-semibold">Growth %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.state}-${row.district}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">{row.state}</td>
                <td className="px-3 py-2">{row.district}</td>
                <td className="px-3 py-2">{formatNumber(row.distributorCount)}</td>
                <td className="px-3 py-2">{formatNumber(row.retailerCount)}</td>
                <td className="px-3 py-2">{formatNumber(row.salesFY, 2)}</td>
                <td className="px-3 py-2">{formatNumber(row.salesCurrent, 2)}</td>
                <td className={`px-3 py-2 font-semibold ${row.growth >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.growth >= 0 ? '+' : ''}
                  {formatNumber(row.growth, 2)}
                </td>
                <td className={`px-3 py-2 font-semibold ${row.growthPct >= 0 || row.growthPct === null ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {row.growthPct === null ? 'N/A' : `${row.growthPct >= 0 ? '+' : ''}${formatNumber(row.growthPct, 2)}%`}
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
