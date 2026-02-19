import { useEffect, useRef } from "react";

export type MapBranch = {
  id: string;
  name: string;
  lat: number;
  lon: number;
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
  const layerGroupRef = useRef<any>(null);
  const lastViewKeyRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapDivRef.current) return;

    let isCancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (isCancelled) return;

      // Create map once
      if (!mapRef.current) {
        mapRef.current = L.map(mapDivRef.current).setView(
          [centerLat, centerLon],
          zoom,
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);

        layerGroupRef.current = L.layerGroup().addTo(mapRef.current);

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
      }

      //  VIEW UPDATE: fitBounds(user+nearest) else flyTo center
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
        const viewKey = `center:${centerLat.toFixed(6)},${centerLon.toFixed(
          6,
        )},${zoom}`;
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

      // Clear previous markers
      if (layerGroupRef.current) layerGroupRef.current.clearLayers();

      //  USER LOCATION
      if (hasUser) {
        const userCircle = L.circleMarker([userLat!, userLon!], {
          radius: 8,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 1,
          weight: 2,
        });

        userCircle.bindPopup(
          `<div style="font-weight:700">📍 You are here</div>`,
        );
        userCircle.addTo(layerGroupRef.current);

        const accuracyRing = L.circle([userLat!, userLon!], {
          radius: 500,
          color: "#3b82f6",
          fillColor: "#93c5fd",
          fillOpacity: 0.15,
          weight: 1,
        });

        accuracyRing.addTo(layerGroupRef.current);
      }

      //  BRANCH MARKERS
      for (const b of branches) {
        const isNearest = highlightId && b.id === highlightId;
        const label = isNearest ? `⭐ ${b.name}` : b.name;

        const marker = L.marker([b.lat, b.lon]);
        marker.bindPopup(
          `<div style="font-weight:700">${escapeHtml(label)}</div>
           <div style="font-size:12px;opacity:.8">
             ${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}
           </div>`,
        );
        marker.addTo(layerGroupRef.current);
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
        layerGroupRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapDivRef}
      style={{
        height: 420,
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
