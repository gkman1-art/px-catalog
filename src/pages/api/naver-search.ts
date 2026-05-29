import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("query");
  if (!query) {
    return new Response(JSON.stringify({ error: "query required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const clientId = import.meta.env.NAVER_CLIENT_ID;
  const clientSecret = import.meta.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: "API not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiUrl = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5&sort=sim`;
  const resp = await fetch(apiUrl, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  const data = await resp.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
};
