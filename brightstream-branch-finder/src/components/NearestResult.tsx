import type { MapBranch } from "./BranchMap";

export type WidgetBranch = MapBranch & {
  country?: string | null;
  city?: string | null;
  phone?: string | null;
};

type NearestResultProps = {
  nearestBranch: WidgetBranch;
  nearestDistance: number;
};

export default function NearestResult(props: NearestResultProps) {
  const { nearestBranch, nearestDistance } = props;

  return (
    <div className="nbw-nearest-wrap">
      <div className="nbw-nearest-label">The nearest branch is at</div>

      <h3 className="nbw-nearest-name">{nearestBranch.name}</h3>

      <p className="nbw-nearest-meta">
        {nearestBranch.city}, {nearestBranch.country} -{" "}
        {nearestDistance.toFixed(2)} km
      </p>

      {nearestBranch.phone && (
        <p className="nbw-nearest-meta">Call us : {nearestBranch.phone}</p>
      )}

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${nearestBranch.lat},${nearestBranch.lon}`}
        target="_blank"
        rel="noreferrer"
        className="nbw-map-link"
      >
        Open in Google Maps
      </a>
    </div>
  );
}
