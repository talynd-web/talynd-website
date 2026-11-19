/* ═══════════════════════════════════════════════════════════════
   MARKDOWN OP HETZELFDE ADRES (19-11, Is Agentic / acceptmarkdown.com)
   Vraagt een AI-agent met "Accept: text/markdown" om een pagina, dan
   krijgt hij de Markdown-versie die build.mjs naast elke pagina zet,
   met Content-Type text/markdown en Vary: Accept. Gewone bezoekers en
   Google (Accept: text/html) merken niets: dan doet dit niets.
   Geen Node-modules hier: dit draait in de middleware (edge).
   ═══════════════════════════════════════════════════════════════ */

export function wilMarkdown(accept) {
  if (!accept) return false;
  const q = {};
  for (const deel of String(accept).toLowerCase().split(",")) {
    const [type, ...params] = deel.trim().split(";");
    const qp = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
    q[type.trim()] = qp ? parseFloat(qp.slice(2)) : 1;
  }
  const md = q["text/markdown"];
  if (!(md > 0)) return false;
  return md >= (q["text/html"] ?? 0);
}

// talynd.com heeft platte pagina's (diensten.html met cleanUrls), dus
// /diensten hoort bij /diensten.md en / bij /index.md.
export function markdownPad(pathname) {
  const p = String(pathname || "/").replace(/\/+$/, "");
  return (p || "/index") + ".md";
}

export async function markdownAntwoord(request, fetchFn = fetch) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  if (!wilMarkdown(request.headers.get("accept"))) return null;
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/") || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  // Cookie en bypass meesturen: op een afgeschermde preview komt het
  // bestand anders niet door de toegangscontrole van Vercel.
  const headers = { accept: "text/markdown, text/plain;q=0.9" };
  const cookie = request.headers.get("cookie");
  const bypass = request.headers.get("x-vercel-protection-bypass");
  if (cookie) headers.cookie = cookie;
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;

  // Alleen echte Markdown telt: een HTML-pagina met status 200 niet.
  const isMarkdown = (x) => x.ok && !/text\/html/i.test(x.headers.get("content-type") || "");
  let status = 200;
  let r = await fetchFn(new URL(markdownPad(url.pathname), url.origin), { headers, signal: AbortSignal.timeout(5000) });
  if (!isMarkdown(r)) {
    if (r.status !== 404 && r.ok === false) return null; // 401, 500: gewoon HTML
    status = 404;
    r = await fetchFn(new URL("/404.md", url.origin), { headers, signal: AbortSignal.timeout(5000) });
    if (!isMarkdown(r)) return null;
  }
  const tekst = await r.text();
  if (!tekst.trim()) return null;
  return new Response(request.method === "HEAD" ? null : tekst, {
    status,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
