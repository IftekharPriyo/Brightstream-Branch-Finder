// @ts-expect-error
import type { MapBranch } from "./BranchMap";

export type WidgetBranch = MapBranch & {
  country?: string | null;
  city?: string | null;
  phone?: string | null;
};

type NearestResultProps = {
  nearestBranch: WidgetBranch;
  nearestDistance: number;
  nearestAddress?: string | null;
};

export default function NearestResult(props: NearestResultProps) {
  const { nearestBranch, nearestDistance, nearestAddress } = props;

  return (
    <div className="nbw-nearest-wrap">
      <div className="nbw-nearest-label ease-up">The nearest branch is at</div>

      <h3 className="nbw-nearest-name ease-up">{nearestBranch.name}</h3>

      {nearestAddress && (
        <p className="nbw-nearest-meta ease-up">{nearestAddress}</p>
      )}

      <p className="nbw-nearest-meta ease-up">
        {nearestDistance.toFixed(2)} km away
      </p>

      {nearestBranch.phone && (
        <p className="nbw-nearest-meta ease-up">
          Call us : {nearestBranch.phone}
        </p>
      )}

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${nearestBranch.lat},${nearestBranch.lon}`}
        target="_blank"
        rel="noreferrer"
        className="nbw-map-link ease-up"
      >
        Get Directions in Google Maps →
      </a>
    </div>
  );
}
