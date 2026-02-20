
export type Branch = {
  _id: string;
  Name?: string | null;
  Coordinates?: string | null;
  Country?: string | null;
  City?: string | null;
  Phone?: string | null;
};

export type UserLoc = { lat: number; lon: number };

export function parseCoordinates(
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


// calculate shortest distance between 2 coordinates in km using Haversine formula
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
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

export async function getUserLocation(): Promise<UserLoc> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

const BRANCH_CACHE_KEY = "branches_cache_v2";
const BRANCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export async function fetchBranchesCached(): Promise<Branch[]> {
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
    } catch { }
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

export function norm(s: unknown) {
  return (typeof s === "string" ? s : "").trim().toLowerCase();
}
