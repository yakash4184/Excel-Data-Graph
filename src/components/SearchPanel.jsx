function SearchPanel({ stateQuery, districtQuery, onStateChange, onDistrictChange, onSearch, disabled }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">Search Records</h2>
      <p className="mt-1 text-sm text-slate-600">State is required. District is optional.</p>

      <form
        className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          value={stateQuery}
          onChange={(event) => onStateChange(event.target.value)}
          placeholder="Enter State (required)"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
        />

        <input
          value={districtQuery}
          onChange={(event) => onDistrictChange(event.target.value)}
          placeholder="Enter District (optional)"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
        />

        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Search
        </button>
      </form>
    </section>
  );
}

export default SearchPanel;
