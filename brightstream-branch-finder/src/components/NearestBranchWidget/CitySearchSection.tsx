import CitySelect from "./CitySelect";

type CitySearchSectionProps = {
  mode: "idle" | "nearest" | "city";
  cities: string[];
  cityQuery: string;
  cityBranchesCount: number;
  onCityQueryChange: (value: string) => void;
  onSearchCity: () => void;
};

export default function CitySearchSection(props: CitySearchSectionProps) {
  const {
    mode,
    cities,
    cityQuery,
    cityBranchesCount,
    onCityQueryChange,
    onSearchCity,
  } = props;

  return (
    <div className="nbw-city">
      {/* City dropdown + Button 2 */}
      <p className="nbw-city-text">Or search branches by city.</p>
      <div
        className={
          mode === "nearest"
            ? "nbw-city-controls nbw-city-controls-nearest"
            : "nbw-city-controls"
        }
      >
        <div className="nbw-city-select-wrap">
          <CitySelect
            cities={cities}
            value={cityQuery}
            onChange={onCityQueryChange}
            placeholder="Search by city"
            disabled={cities.length === 0}
          />
          <div className="nbw-city-hint">
            {cities.length > 0
              ? `Suggestions loaded (${cities.length})`
              : "Loading city suggestions..."}
          </div>
        </div>

        <button onClick={onSearchCity} className="nbw-action-btn nbw-city-btn">
          Search City
        </button>
      </div>

      {/* Results */}
      {mode === "city" && (
        <div className="nbw-city-results">
          {cityQuery.trim() ? (
            <>
              Showing <strong>{cityBranchesCount}</strong> branches in{" "}
              <strong>{cityQuery.trim()}</strong>.
            </>
          ) : (
            <>Pick a city to show branches.</>
          )}
        </div>
      )}
    </div>
  );
}
