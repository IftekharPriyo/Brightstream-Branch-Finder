import { useMemo, useState } from "react";
import BranchMap, { type MapBranch } from "./BranchMap";

type Branch = {
  _id: string;
  Name?: string | null;
  Coordinates?: string | null;
  Country?: string | null;
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

const BRANCH_CACHE_KEY = "branches_cache_v1";
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
    body: JSON.stringify({ limit: 100, skip: 0 }), // server clamps anyway
  });

  const json = await res.json();
  if (json.errors?.length)
    throw new Error(json.errors[0].message ?? "GraphQL error");

  const items: Branch[] = json?.data?.Branch?.items ?? [];
  localStorage.setItem(
    BRANCH_CACHE_KEY,
    JSON.stringify({ ts: Date.now(), items }),
  );
  return items;
}

export default function NearestBranchWidget() {
  const [status, setStatus] = useState("Idle");
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [nearestId, setNearestId] = useState<string | null>(null);
  const [nearestDistance, setNearestDistance] = useState<number | null>(null);

  const parsedBranches = useMemo(() => {
    if (!branches) return [];
    const out: (MapBranch & { country?: string | null })[] = [];
    for (const b of branches) {
      const c = parseCoordinates(b.Coordinates);
      if (!c) continue;
      out.push({
        id: b._id,
        name: b.Name ?? "Unnamed branch",
        lat: c.lat,
        lon: c.lon,
        country: b.Country ?? null,
      });
    }
    return out;
  }, [branches]);

  const nearestBranch = useMemo(() => {
    if (!nearestId) return null;
    return parsedBranches.find((b) => b.id === nearestId) ?? null;
  }, [nearestId, parsedBranches]);

  const handleClick = async () => {
    try {
      setStatus("Requesting location permission…");
      setNearestId(null);
      setNearestDistance(null);

      const loc = await getUserLocation();
      setUserLoc(loc);

      setStatus("Loading branches…");
      const items = await fetchBranchesCached();
      setBranches(items);

      setStatus("Calculating nearest branch…");

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
      setStatus("Done ✅");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? "Unknown error"}`);
    }
  };

  // Map branches: show nearest
  const mapBranches = parsedBranches;

  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 900 }}>
      <button
        onClick={handleClick}
        style={{
          padding: "12px 16px",
          borderRadius: 10,
          border: "1px solid #ccc",
          cursor: "pointer",
          fontSize: 16,
          width: 240,
        }}
      >
        Find Nearest Branch
      </button>

      <div>
        <strong>Status:</strong> {status}
      </div>

      {nearestBranch && nearestDistance != null && (
        <div
          style={{ padding: 14, border: "1px solid #ddd", borderRadius: 12 }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {nearestBranch.name}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Distance:</strong> {nearestDistance.toFixed(2)} km
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
            {nearestBranch.lat.toFixed(5)}, {nearestBranch.lon.toFixed(5)}
          </div>
        </div>
      )}

      {/* Render map after we have user loc and branches */}
      {userLoc && mapBranches.length > 0 && (
        <BranchMap
          centerLat={nearestBranch?.lat ?? userLoc.lat}
          centerLon={nearestBranch?.lon ?? userLoc.lon}
          zoom={nearestBranch ? 13 : 6}
          branches={mapBranches}
          highlightId={nearestId ?? undefined}
          // ✅ add these:
          userLat={userLoc.lat}
          userLon={userLoc.lon}
        />
      )}

      {branches && (
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Loaded branches: {branches.length} | With valid coords:{" "}
          {parsedBranches.length}
        </div>
      )}
    </div>
  );
}
