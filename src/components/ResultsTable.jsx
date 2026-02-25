import { REQUIRED_COLUMNS } from '../constants/columns';

const NUMERIC_COLUMNS = new Set(['Population', 'Cases', 'Vaccinated']);

const formatCellValue = (column, value) => {
  if (NUMERIC_COLUMNS.has(column) && typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  return value;
};

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
                {REQUIRED_COLUMNS.map((column) => (
                  <td key={`${row.State}-${row.District}-${row['Mobile Number']}-${column}`} className="px-3 py-2">
                    {formatCellValue(column, row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ResultsTable;
