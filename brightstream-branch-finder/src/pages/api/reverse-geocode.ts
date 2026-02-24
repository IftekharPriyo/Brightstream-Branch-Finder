import type { APIRoute } from "astro";

const NOMINATIM_REVERSE_URL =
  "https://nominatim.openstreetmap.org/reverse?format=jsonv2";

export const GET: APIRoute = async ({ url }) => {
  try {
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "Missing lat/lon query parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const upstream = await fetch(
      `${NOMINATIM_REVERSE_URL}&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Brightstream-Branch-Finder/1.0",
        },
      },
    );

    const json = await upstream.json();

    if (!upstream.ok) {
      return new Response(JSON.stringify(json), {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        displayName:
          typeof json?.display_name === "string" ? json.display_name : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? "Reverse geocode proxy error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
