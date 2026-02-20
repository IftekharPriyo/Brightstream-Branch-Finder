import { useEffect, useMemo, useState } from "react";
import BranchMap from "../BranchMap/BranchMap";
import CitySearchSection from "./CitySearchSection";
import IntroSection from "./IntroSection";

import {
  fetchBranchesCached,
  getUserLocation,
  haversineKm,
  norm,
  parseCoordinates,
  type Branch,
  type UserLoc,
} from "./nearestBranchWidget.helpers";
import type { WidgetBranch } from "./NearestResult";
import NearestResult from "./NearestResult";

export default function NearestBranchWidget() {
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);

  // Nearest (GPS) state
  const [nearestId, setNearestId] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);

  // City search state
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [mode, setMode] = useState<"idle" | "nearest" | "city">("idle");

  // Prefetch branches once so cities dropdown is populated on load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchBranchesCached();
        if (cancelled) return;
        setBranches(items);

        const m = new Map<string, string>(); // normalized -> display
        for (const b of items) {
          const c = b.City?.trim();
          if (!c) continue;
          m.set(norm(c), c);
        }
        setCities(Array.from(m.values()).sort((a, b) => a.localeCompare(b)));
      } catch (e) {
        console.error("Prefetch failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode === "city" && cityQuery.trim() === "") {
      setMode("idle");
    }
  }, [cityQuery, mode]);

  const parsedBranches = useMemo(() => {
    if (!branches) return [];
    const out: WidgetBranch[] = [];

    for (const b of branches) {
      const c = parseCoordinates(b.Coordinates);
      if (!c) continue;

      out.push({
        id: b._id,
        name: b.Name ?? "Unnamed branch",
        lat: c.lat,
        lon: c.lon,
        country: b.Country ?? null,
        city: b.City ?? null,
        phone: b.Phone ?? null,
      });
    }
    return out;
  }, [branches]);

  const nearestBranch = useMemo(() => {
    if (!nearestId) return null;
    return parsedBranches.find((b) => b.id === nearestId) ?? null;
  }, [nearestId, parsedBranches]);

  // City-mode filtered branches
  const cityBranches = useMemo(() => {
    if (!parsedBranches.length) return [];
    const wanted = norm(cityQuery);
    if (!wanted) return [];
    return parsedBranches.filter((b) => norm(b.city ?? "") === wanted);
  }, [parsedBranches, cityQuery]);

  // For city mode: compute a simple center (centroid) of the filtered results
  const cityCenter = useMemo(() => {
    if (cityBranches.length === 0) return null;
    let sumLat = 0;
    let sumLon = 0;
    for (const b of cityBranches) {
      sumLat += b.lat;
      sumLon += b.lon;
    }
    return {
      lat: sumLat / cityBranches.length,
      lon: sumLon / cityBranches.length,
    };
  }, [cityBranches]);

  const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

  const handleFindNearest = async () => {
    try {
      setMode("nearest");
      setNearestId(null);
      setNearestDistance(null);

      const loc = await getUserLocation();
      setUserLoc(loc);

      const items = branches ?? (await fetchBranchesCached());
      setBranches(items);

      let bestId: string | null = null;
      let bestD = Infinity;

      for (const b of items) {
        const c = parseCoordinates(b.Coordinates);
        if (!c) continue;

        const d = haversineKm(loc.lat, loc.lon, c.lat, c.lon);
        if (d < bestD) {
          bestD = d;
          bestId = b._id;
        }
      }

      if (!bestId) {
        console.warn("No branches found with valid coordinates.");
        return;
      }

      setNearestId(bestId);
      setNearestDistance(bestD);
    } catch (error: unknown) {
      console.error(`Find nearest failed: ${getErrorMessage(error)}`);
    }
  };

  // show all branches in selected city on the map
  const handleSearchCity = async () => {
    try {
      setMode("city");
      setUserLoc(null); // no GPS marker in city mode
      setNearestId(null);
      setNearestDistance(null);

      const items = branches ?? (await fetchBranchesCached());
      setBranches(items);

      const wanted = norm(cityQuery);
      if (!wanted) {
        console.warn("Please select a city.");
        return;
      }

      const count = items.filter((b) => norm(b.City ?? "") === wanted).length;
      if (count === 0) {
        console.warn("No branches found for that city.");
        return;
      }
    } catch (error: unknown) {
      console.error(`City search failed: ${getErrorMessage(error)}`);
    }
  };

  // Where to center the map
  const mapCenter = useMemo(() => {
    if (mode === "city" && cityCenter)
      return { lat: cityCenter.lat, lon: cityCenter.lon, zoom: 11 };
    if (mode === "nearest" && nearestBranch)
      return { lat: nearestBranch.lat, lon: nearestBranch.lon, zoom: 13 };
    if (mode === "nearest" && userLoc)
      return { lat: userLoc.lat, lon: userLoc.lon, zoom: 6 };

    return null;
  }, [mode, cityCenter, nearestBranch, userLoc]);

  const shouldShowMap =
    !!mapCenter &&
    ((mode === "nearest" && !!userLoc && parsedBranches.length > 0) ||
      (mode === "city" && cityBranches.length > 0));

  return (
    <div className="nbw-root">
      <div className="nbw-layout">
        <div className="nbw-top">
          <h1 className="nbw-title ease-up">Brighstream Branch Finder</h1>

          {!(
            mode === "nearest" &&
            nearestBranch &&
            nearestDistance != null
          ) && <IntroSection onFindNearest={handleFindNearest} />}

          {mode === "nearest" && nearestBranch && nearestDistance != null && (
            <NearestResult
              nearestBranch={nearestBranch}
              nearestDistance={nearestDistance}
            />
          )}
        </div>

        <CitySearchSection
          mode={mode}
          cities={cities}
          cityQuery={cityQuery}
          cityBranchesCount={cityBranches.length}
          onCityQueryChange={setCityQuery}
          onSearchCity={handleSearchCity}
        />

        {/* Map */}
        {shouldShowMap ? (
          <div className="nbw-map nbw-map-shell">
            <BranchMap
              centerLat={mapCenter.lat}
              centerLon={mapCenter.lon}
              zoom={mapCenter.zoom}
              branches={mode === "city" ? cityBranches : parsedBranches}
              highlightId={
                mode === "nearest" ? (nearestId ?? undefined) : undefined
              }
              userLat={mode === "nearest" ? userLoc?.lat : undefined}
              userLon={mode === "nearest" ? userLoc?.lon : undefined}
            />
          </div>
        ) : (
          <div className="nbw-map nbw-map-placeholder nbw-map-shell" />
        )}
      </div>
    </div>
  );
}
