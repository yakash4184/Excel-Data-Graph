function SearchPanel({
  stateQuery,
  districtQuery,
  stateOptions,
  districtOptions,
  onStateChange,
  onDistrictChange,
  onSearch,
  onReset,
  disabled,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">Smart Filter</h2>
      <p className="mt-1 text-sm text-slate-600">State aur district dono optional filters hain.</p>

      <form
        className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <select
          value={stateQuery}
          onChange={(event) => onStateChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
        >
          <option value="">All States</option>
          {stateOptions.map((stateName) => (
            <option key={stateName} value={stateName}>
              {stateName}
            </option>
          ))}
        </select>

        <select
          value={districtQuery}
          onChange={(event) => onDistrictChange(event.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
        >
          <option value="">All Districts</option>
          {districtOptions.map((districtName) => (
            <option key={districtName} value={districtName}>
              {districtName}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={disabled}
          className="rounded-lg bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Search
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Reset
        </button>
      </form>
    </section>
  );
}

export default SearchPanel;
