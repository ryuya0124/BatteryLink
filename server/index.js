import route from "./api/route.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      // route.jsのfetchに委譲
      return route.fetch(request, env, ctx);
    }
    return new Response(null, { status: 404 });
  },
}
