function SearchPanel({
  stateQuery,
  districtQuery,
  clientNameQuery,
  mobileQuery,
  stateOptions,
  districtOptions,
  onStateChange,
  onDistrictChange,
  onClientNameChange,
  onMobileChange,
  onSearch,
  disabled,
}) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-panel">
      <h2 className="text-xl font-semibold text-slate-900">Search Records</h2>
      <p className="mt-1 text-sm text-slate-600">
        State required hai. District, Client Name aur Mobile Number optional filters hain.
      </p>

      <form
        className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
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
          <option value="">Select State (required)</option>
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
          <option value="">All Districts (optional)</option>
          {districtOptions.map((districtName) => (
            <option key={districtName} value={districtName}>
              {districtName}
            </option>
          ))}
        </select>

        <input
          value={clientNameQuery}
          onChange={(event) => onClientNameChange(event.target.value)}
          placeholder="Client Name (optional)"
          className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none ring-brand-200 transition focus:border-brand-500 focus:ring"
        />

        <input
          value={mobileQuery}
          onChange={(event) => onMobileChange(event.target.value)}
          placeholder="Mobile Number (optional)"
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
