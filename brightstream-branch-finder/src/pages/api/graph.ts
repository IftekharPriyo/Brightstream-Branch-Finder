import type { APIRoute } from "astro";

const PAGE_SIZE = 100;

const BRANCH_LIST_QUERY = `
  query BranchList($limit: Int!, $skip: Int!) {
    Branch(limit: $limit, skip: $skip) {
      items {
        _id
        Name
        Coordinates
        Country
      }
      total
    }
  }
`;

export const POST: APIRoute = async ({ request }) => {
    try {
        const baseUrl = import.meta.env.OPTIMIZELY_GRAPH_URL as string | undefined;
        const key = import.meta.env.OPTIMIZELY_GRAPH_KEY as string | undefined;

        if (!baseUrl || !key) {
            return new Response(JSON.stringify({ error: "Missing OPTIMIZELY_GRAPH_URL/KEY" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // same-origin guard (keeps random other sites from using your endpoint)
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        if (origin && host) {
            try {
                if (new URL(origin).host !== host) {
                    return new Response(JSON.stringify({ error: "Forbidden" }), {
                        status: 403,
                        headers: { "Content-Type": "application/json" },
                    });
                }
            } catch {
                return new Response(JSON.stringify({ error: "Forbidden" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        // Fetch all pages
        let skip = 0;
        let total: number | null = null;
        const allItems: any[] = [];

        while (true) {
            const upstream = await fetch(`${baseUrl}?auth=${encodeURIComponent(key)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: BRANCH_LIST_QUERY,
                    variables: { limit: PAGE_SIZE, skip },
                }),
            });

            const json = await upstream.json();

            if (!upstream.ok || json.errors?.length) {
                return new Response(JSON.stringify(json), {
                    status: upstream.status || 500,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const page = json?.data?.Branch;
            const items = page?.items ?? [];
            total = total ?? page?.total ?? null;

            allItems.push(...items);

            skip += PAGE_SIZE;

            // Stop conditions:
            if (items.length < PAGE_SIZE) break;
            if (typeof total === "number" && allItems.length >= total) break;

            // Safety stop to avoid infinite loops in case of weird totals
            if (skip > 50_000) break;
        }

        return new Response(
            JSON.stringify({
                data: { Branch: { items: allItems, total: total ?? allItems.length } },
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
                },
            }
        );
    } catch (e: any) {
        return new Response(JSON.stringify({ error: e?.message ?? "Proxy error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};
