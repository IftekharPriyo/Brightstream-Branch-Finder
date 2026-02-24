import { useEffect, useRef } from "react";

export type MapBranch = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  phone: string;
  city: string;
  country: string;
};

export default function BranchMap(props: {
  centerLat: number;
  centerLon: number;
  zoom?: number;
  branches: MapBranch[];
  highlightId?: string;
  userLat?: number;
  userLon?: number;
}) {
  const {
    centerLat,
    centerLon,
    zoom = 12,
    branches,
    highlightId,
    userLat,
    userLon,
  } = props;

  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  // Separate layers: one for user marker, one clustered for branches
  const userLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);

  const lastViewKeyRef = useRef<string>("");
  const reverseAddressCacheRef = useRef<Map<string, string | null>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapDivRef.current) return;

    let isCancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      // Plugin patches Leaflet and adds L.markerClusterGroup()
      await import("leaflet.markercluster");

      if (isCancelled) return;

      // Create map once
      if (!mapRef.current) {
        mapRef.current = L.map(mapDivRef.current!).setView(
          [centerLat, centerLon],
          zoom,
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);

        // Fix default marker icons (CDN URLs)
        // @ts-ignore
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl:
            "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // User layer (non-clustered)
        userLayerRef.current = L.layerGroup().addTo(mapRef.current);

        // Cluster group for branches
        clusterGroupRef.current = (L as any).markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16, // at street-level, show individual markers
        });

        mapRef.current.addLayer(clusterGroupRef.current);
      }

      // View update: fitBounds(user+nearest) else flyTo center
      const hasUser =
        typeof userLat === "number" && typeof userLon === "number";

      const nearestBranch = highlightId
        ? branches.find((b) => b.id === highlightId)
        : null;

      if (hasUser && nearestBranch) {
        const viewKey = `bounds:${userLat},${userLon}:${nearestBranch.lat},${nearestBranch.lon}`;
        if (lastViewKeyRef.current !== viewKey) {
          lastViewKeyRef.current = viewKey;

          const bounds = L.latLngBounds(
            [userLat!, userLon!],
            [nearestBranch.lat, nearestBranch.lon],
          );

          mapRef.current.fitBounds(bounds, {
            padding: [60, 60],
            animate: true,
            duration: 1.25,
          });
        }
      } else {
        const viewKey = `center:${centerLat.toFixed(6)},${centerLon.toFixed(6)},${zoom}`;
        if (lastViewKeyRef.current !== viewKey) {
          lastViewKeyRef.current = viewKey;

          if (mapRef.current?.flyTo) {
            mapRef.current.flyTo([centerLat, centerLon], zoom, {
              animate: true,
              duration: 1.25,
            });
          } else {
            mapRef.current.setView([centerLat, centerLon], zoom, {
              animate: true,
            });
          }
        }
      }

      // Clear existing layers
      if (userLayerRef.current) userLayerRef.current.clearLayers();
      if (clusterGroupRef.current) clusterGroupRef.current.clearLayers();

      // User location marker
      if (hasUser) {
        const userCircle = L.circleMarker([userLat!, userLon!], {
          radius: 8,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 2,
        });

        userCircle.bindPopup(`<div style="font-weight:700">You are here</div>`);
        userCircle.addTo(userLayerRef.current);

        const accuracyRing = L.circle([userLat!, userLon!], {
          radius: 500,
          color: "#3b82f6",
          fillColor: "#93c5fd",
          fillOpacity: 0.15,
          weight: 1,
        });

        accuracyRing.addTo(userLayerRef.current);
      }

      const nearestBranchIcon = L.icon({
        iconUrl: buildPinDataUrl("#d4af37", "#0a1628"),
        iconRetinaUrl: buildPinDataUrl("#d4af37", "#0a1628"),
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Branch markers (clustered)
      for (const b of branches) {
        const isNearest = highlightId && b.id === highlightId;
        const label = isNearest ? `⭐ ${b.name}` : b.name;

        const marker = isNearest
          ? L.marker([b.lat, b.lon], { icon: nearestBranchIcon })
          : L.marker([b.lat, b.lon]);
        marker.bindPopup(buildBranchPopupHtml({ b, label, address: null }));

        marker.on("popupopen", async () => {
          const cacheKey = `${b.lat},${b.lon}`;
          const cachedAddress = reverseAddressCacheRef.current.get(cacheKey);

          if (cachedAddress !== undefined) {
            marker.setPopupContent(
              buildBranchPopupHtml({ b, label, address: cachedAddress }),
            );
            return;
          }

          marker.setPopupContent(
            buildBranchPopupHtml({ b, label, address: null, isLoading: true }),
          );

          try {
            const params = new URLSearchParams({
              lat: String(b.lat),
              lon: String(b.lon),
            });
            const res = await fetch(
              `/api/reverse-geocode?${params.toString()}`,
            );
            if (!res.ok) throw new Error("Reverse geocoding failed");

            const json = (await res.json()) as { displayName?: string | null };
            const address =
              typeof json.displayName === "string" && json.displayName.trim()
                ? json.displayName
                : null;

            reverseAddressCacheRef.current.set(cacheKey, address);
            marker.setPopupContent(buildBranchPopupHtml({ b, label, address }));
          } catch {
            reverseAddressCacheRef.current.set(cacheKey, null);
            marker.setPopupContent(
              buildBranchPopupHtml({ b, label, address: null }),
            );
          }
        });

        marker.addTo(clusterGroupRef.current);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [centerLat, centerLon, zoom, branches, highlightId, userLat, userLon]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        userLayerRef.current = null;
        clusterGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapRef.current) return;

    const onResize = () => {
      mapRef.current?.invalidateSize?.();
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [branches.length]);

  return (
    <div
      ref={mapDivRef}
      style={{
        height: "clamp(300px, 55vh, 500px)",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildBranchPopupHtml({
  b,
  label,
  address,
  isLoading = false,
}: {
  b: MapBranch;
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

function buildPinDataUrl(fillColor: string, strokeColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 41">
    <path d="M12.5 0C6.15 0 1 5.15 1 11.5c0 8.24 11.5 29.5 11.5 29.5S24 19.74 24 11.5C24 5.15 18.85 0 12.5 0z"
      fill="${fillColor}" stroke="${strokeColor}" stroke-width="1.3"/>
    <circle cx="12.5" cy="11.5" r="4.5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
