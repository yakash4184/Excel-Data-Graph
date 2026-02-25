import { REQUIRED_COLUMNS } from '../constants/columns';

function ResultsTable({ rows }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">Filtered Results</h2>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-700">
              {REQUIRED_COLUMNS.map((column) => (
                <th key={column} className="px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.State}-${row.District}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">{row.State}</td>
                <td className="px-3 py-2">{row.District}</td>
                <td className="px-3 py-2">{row.Population.toLocaleString()}</td>
                <td className="px-3 py-2">{row.Cases.toLocaleString()}</td>
                <td className="px-3 py-2">{row.Vaccinated.toLocaleString()}</td>
                <td className="px-3 py-2">{row.Latitude}</td>
                <td className="px-3 py-2">{row.Longitude}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ResultsTable;
