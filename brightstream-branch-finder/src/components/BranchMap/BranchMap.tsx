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
          // Feel free to tweak these:
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16, // at street-level, show individual markers
        });

        mapRef.current.addLayer(clusterGroupRef.current);
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

      //  USER LOCATION — blue dot + soft ring (non-clustered)
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
        userCircle.addTo(userLayerRef.current);

        const accuracyRing = L.circle([userLat!, userLon!], {
          radius: 500, // meters (visual)
          color: "#3b82f6",
          fillColor: "#93c5fd",
          fillOpacity: 0.15,
          weight: 1,
        });

        accuracyRing.addTo(userLayerRef.current);
      }

      //  BRANCH MARKERS (clustered)
      for (const b of branches) {
        const isNearest = highlightId && b.id === highlightId;
        const label = isNearest ? `⭐ ${b.name}` : b.name;

        const marker = L.marker([b.lat, b.lon]);
        marker.bindPopup(
          `<div style="font-weight:700">${escapeHtml(label)}</div>
          <p style="color: #64748b; font-weight: 400;">
                ${b.city}, ${b.country}
              </p>
            <p style="color: #64748b; font-weight: 400;">Call us at ${b.phone}</p>
           <div style="font-size:12px;opacity:.8;margin-top:10px;">
             <a href="https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}" target="_blank" rel="noreferrer">Get Directions</a>
           </div>
           `,
        );

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
