type PopupBranch = {
  name: string;
  lat: number;
  lon: number;
  phone: string;
  city: string;
  country: string;
};

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildBranchPopupHtml({
  b,
  label,
  address,
  isLoading = false,
}: {
  b: PopupBranch;
  label: string;
  address: string | null;
  isLoading?: boolean;
}) {
  const cityCountry = `${b.city}, ${b.country}`;
  const safePhone = escapeHtml(b.phone || "Unavailable");
  const safeAddress = address ? escapeHtml(address) : "";
  const addressRow = isLoading
    ? `<p style="color: #64748b; font-weight: 400;">Loading address...</p>`
    : address
      ? `<p style="color: #64748b; font-weight: 400;">${safeAddress}</p>`
      : "";

  return `<div style="font-weight:700">${escapeHtml(label)}</div>
          ${addressRow}
          <p style="color: #64748b; font-weight: 400;">${escapeHtml(cityCountry)}</p>
          <p style="color: #64748b; font-weight: 400;">Call us at ${safePhone}</p>
          <div style="font-size:12px;opacity:.8;margin-top:10px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}" target="_blank" rel="noreferrer">Get Directions</a>
          </div>`;
}

export async function fetchRouteLatLngs(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
): Promise<Array<[number, number]>> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${encodeURIComponent(String(startLon))},${encodeURIComponent(String(startLat))};` +
    `${encodeURIComponent(String(endLon))},${encodeURIComponent(String(endLat))}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Route request failed");
  }

  const json = (await res.json()) as {
    routes?: Array<{ geometry?: { coordinates?: Array<[number, number]> } }>;
  };

  const coords = json.routes?.[0]?.geometry?.coordinates;
  if (!coords || coords.length === 0) {
    throw new Error("No route geometry");
  }

  return coords.map(([lon, lat]) => [lat, lon]);
}

export function buildPinDataUrl(fillColor: string, strokeColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41">
    <path d="M12.5 0C6.15 0 1 5.15 1 11.5c0 8.24 11.5 29.5 11.5 29.5S24 19.74 24 11.5C24 5.15 18.85 0 12.5 0z"
      fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.3"/>
    <circle cx="12.5" cy="11.5" r="4.5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
