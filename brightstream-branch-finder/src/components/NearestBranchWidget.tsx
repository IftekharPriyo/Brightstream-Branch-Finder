// src/components/NearestBranchWidget.tsx
import { useEffect, useMemo, useState } from "react";
import BranchMap, { type MapBranch } from "./BranchMap";
import CitySelect from "./CitySelect";

type Branch = {
  _id: string;
  Name?: string | null;
  Coordinates?: string | null;
  Country?: string | null;
  City?: string | null;
  Phone?: string | null;
};

type UserLoc = { lat: number; lon: number };

function parseCoordinates(
  value?: string | null,
): { lat: number; lon: number } | null {
  if (!value) return null;
  const parts = value.split(",").map((p) => Number(p.trim()));
  if (parts.length !== 2) return null;
  const [lat, lon] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getUserLocation(): Promise<UserLoc> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

// ✅ bump version so cached items include City/Phone
const BRANCH_CACHE_KEY = "branches_cache_v2";
const BRANCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function fetchBranchesCached(): Promise<Branch[]> {
  const raw = localStorage.getItem(BRANCH_CACHE_KEY);
  if (raw) {
    try {
      const cached = JSON.parse(raw) as { ts: number; items: Branch[] };
      if (
        Date.now() - cached.ts < BRANCH_CACHE_TTL_MS &&
        Array.isArray(cached.items)
      ) {
        return cached.items;
      }
    } catch {}
  }

  const res = await fetch("/api/graph", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 100, skip: 0 }),
  });

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message ?? "GraphQL error");
  }

  const items: Branch[] = json?.data?.Branch?.items ?? [];
  localStorage.setItem(
    BRANCH_CACHE_KEY,
    JSON.stringify({ ts: Date.now(), items }),
  );
  return items;
}

function norm(s: unknown) {
  return (typeof s === "string" ? s : "").trim().toLowerCase();
}

export default function NearestBranchWidget() {
  const [status, setStatus] = useState("Idle");
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
    const out: (MapBranch & {
      country?: string | null;
      city?: string | null;
      phone?: string | null;
    })[] = [];

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

  // ✅ City-mode filtered branches (Mode A)
  const cityBranches = useMemo(() => {
    if (!parsedBranches.length) return [];
    const wanted = norm(cityQuery);
    if (!wanted) return [];
    return parsedBranches.filter((b) => norm(b.city ?? "") === wanted);
  }, [parsedBranches, cityQuery]);

  // ✅ For city mode: compute a simple center (centroid) of the filtered results
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

  const handleFindNearest = async () => {
    try {
      setMode("nearest");
      setStatus("Requesting location permission...");
      setNearestId(null);
      setNearestDistance(null);
      // Keep cityQuery as-is; it just won’t be used in this mode

      const loc = await getUserLocation();
      setUserLoc(loc);

      setStatus("Loading branches...");
      const items = branches ?? (await fetchBranchesCached());
      setBranches(items);

      setStatus("Calculating nearest branch...");

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
        setStatus("No branches found with valid coordinates.");
        return;
      }

      setNearestId(bestId);
      setNearestDistance(bestD);
      setStatus("Done");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? "Unknown error"}`);
    }
  };

  // ✅ Mode A: show all branches in selected city on the map
  const handleSearchCity = async () => {
    try {
      setMode("city");
      setStatus("Searching city...");
      setUserLoc(null); // no GPS marker in city mode
      setNearestId(null);
      setNearestDistance(null);

      const items = branches ?? (await fetchBranchesCached());
      setBranches(items);

      const wanted = norm(cityQuery);
      if (!wanted) {
        setStatus("Please select a city.");
        return;
      }

      const count = items.filter((b) => norm(b.City ?? "") === wanted).length;
      if (count === 0) {
        setStatus("No branches found for that city.");
        return;
      }

      setStatus("Done");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? "Unknown error"}`);
    }
  };

  // What to render on the map
  const mapBranches = useMemo(() => {
    if (mode === "city") return cityBranches;
    return parsedBranches; // nearest mode shows all branches (you can change to only nearby later)
  }, [mode, cityBranches, parsedBranches]);

  // Where to center the map
  const mapCenter = useMemo(() => {
    if (mode === "city" && cityCenter)
      return { lat: cityCenter.lat, lon: cityCenter.lon, zoom: 11 };
    if (mode === "nearest" && nearestBranch)
      return { lat: nearestBranch.lat, lon: nearestBranch.lon, zoom: 13 };
    if (mode === "nearest" && userLoc)
      return { lat: userLoc.lat, lon: userLoc.lon, zoom: 6 };

    return null;
  }, [mode, cityCenter, nearestBranch, userLoc, parsedBranches]);

  function googleMapsDirectionsLink(lat: number, lon: number) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  }

  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1.4 1 420px", minWidth: 360 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(3rem, 7vw, 4rem)",
              fontWeight: 700,
              color: "#0A1628",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
              letterSpacing: "-2px",
            }}
          >
            Brighstream Branch Finder
          </h1>

          {/* Intro */}
          {!(
            mode === "nearest" &&
            nearestBranch &&
            nearestDistance != null
          ) && (
            <>
              <p
                style={{
                  marginTop: 6,
                  color: "#64748b",
                  lineHeight: 1.8,
                  fontWeight: 600,
                  marginBottom: 18,
                }}
              >
                Find the nearest branch using GPS, or search branches by city.
              </p>
              <button
                onClick={handleFindNearest}
                style={{
                  padding: "12px 16px",
                  borderRadius: 20,
                  backgroundColor: "#D4AF37",
                  color: "#FEFDFB",
                  cursor: "pointer",
                  fontSize: 16,
                  width: 240,
                  border: "none",
                  height: 46,
                }}
              >
                Find Nearest Branch
              </button>
            </>
          )}

          {mode === "nearest" && nearestBranch && nearestDistance != null && (
            <div style={{ marginTop: 30, padding: 14 }}>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.8rem",
                  fontWeight: 600,
                  color: "#8b9d83",
                  margin: 0,
                }}
              >
                The nearest branch is at
              </div>

              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "2rem",
                  fontWeight: 600,
                  color: "#0A1628",
                  marginTop: 10,
                }}
              >
                {nearestBranch.name}
              </h3>

              <p style={{ color: "#64748b", lineHeight: 1.8, fontWeight: 400 }}>
                {nearestBranch.city}, {nearestBranch.country} ·{" "}
                {nearestDistance.toFixed(2)} km
              </p>

              {nearestBranch.phone && (
                <p
                  style={{ color: "#64748b", lineHeight: 1.8, fontWeight: 400 }}
                >
                  Call us : {nearestBranch.phone}
                </p>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${nearestBranch.lat},${nearestBranch.lon}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  color: "#0A1628",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                Open in Google Maps →
              </a>
            </div>
          )}

          {/* City dropdown + Button 2 */}
          <p
            style={{
              marginTop: 30,
              color: "#64748b",
              lineHeight: 1.8,
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            Or search branches by city.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-start",
              marginTop: mode === "nearest" ? 30 : 18,
            }}
          >
            <div style={{ width: "20rem" }}>
              <CitySelect
                cities={cities}
                value={cityQuery}
                onChange={setCityQuery}
                placeholder="Search by city"
                disabled={cities.length === 0}
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                {cities.length > 0
                  ? `Suggestions loaded (${cities.length})`
                  : "Loading city suggestions…"}
              </div>
            </div>

            <button
              onClick={handleSearchCity}
              style={{
                padding: "12px 16px",
                borderRadius: 20,
                backgroundColor: "#D4AF37",
                color: "#FEFDFB",
                cursor: "pointer",
                fontSize: 16,
                width: 200,
                border: "none",
                height: 46,
              }}
            >
              Search City
            </button>
          </div>

          {/* Results */}

          {mode === "city" && (
            <div style={{ marginTop: 18, color: "#64748b", lineHeight: 1.7 }}>
              {cityQuery.trim() ? (
                <>
                  Showing <strong>{cityBranches.length}</strong> branches in{" "}
                  <strong>{cityQuery.trim()}</strong>.
                </>
              ) : (
                <>Pick a city to show branches.</>
              )}
            </div>
          )}

          {/* Debug if needed */}
          {/* <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>{status}</div> */}
        </div>

        {/* Map */}

        {/* Map */}
        {mapCenter &&
          ((mode === "nearest" && userLoc && parsedBranches.length > 0) ||
            (mode === "city" && cityBranches.length > 0)) && (
            <div style={{ flex: "1.1 1 420px", minWidth: 320 }}>
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
          )}
      </div>
    </div>
  );
}
