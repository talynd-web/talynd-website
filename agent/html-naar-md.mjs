/* HTML NAAR MARKDOWN (19-11, Is Agentic)
   build.mjs zet met deze functie naast elke pagina een .md-versie, die de
   middleware aan AI-agents geeft. Leest alleen wat een bezoeker ook leest:
   geen menu, scripts, formulieren of verborgen kopieën (aria-hidden). */

const SITE = "https://talynd.com";
const OVERSLAAN = new Set(["head", "nav", "script", "style", "svg", "noscript", "template", "form", "video", "iframe", "select"]);
const LEEG = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const BLOK = new Set(["p", "div", "section", "article", "main", "header", "footer", "aside", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "figure", "figcaption", "table", "tr", "dl", "dt", "dd"]);
const ENTITEITEN = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", hellip: "…", ndash: "–", mdash: "-", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', middot: "·", copy: "©" };

export function ontsnap(tekst) {
  return tekst.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (heel, e) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : heel;
    }
    return ENTITEITEN[e.toLowerCase()] ?? heel;
  });
}

function attribuut(attrs, naam) {
  const m = attrs.match(new RegExp(`\\s${naam}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? (m[2] ?? m[3]) : null;
}

export function absoluteLink(href) {
  if (!href) return null;
  const h = href.trim();
  if (!h || h.startsWith("#") || /^javascript:/i.test(h)) return null;
  if (/^(https:|mailto:|tel:)/i.test(h)) return h;
  if (/^[a-z][a-z0-9+.-]*:/i.test(h) || h.startsWith("//")) return null; // http, sms, data, andere hosts
  const pad = h.replace(/^\.?\//, "");
  return `${SITE}/${pad}`;
}

function verborgen(attrs) {
  return /\saria-hidden\s*=\s*["']true["']/i.test(attrs) || /\shidden(\s|=|$)/i.test(attrs) || /class\s*=\s*["'][^"']*\bck-bar\b/i.test(attrs);
}

export function htmlNaarMd(html) {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1];
  const regels = [];
  let buf = "";
  let soort = null; // h1..h6, li, blockquote
  const stapel = [];
  const links = [];
  let overslaanDiepte = 0;

  const spoel = () => {
    const t = buf.replace(/\s+/g, " ").trim();
    buf = "";
    if (!t) return;
    if (soort && /^h[1-6]$/.test(soort)) regels.push("#".repeat(Number(soort[1])) + " " + t.replace(/\*\*/g, ""));
    else if (soort === "li") regels.push("- " + t);
    else if (soort === "blockquote") regels.push("> " + t);
    else regels.push(t);
  };

  const tokens = body.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][a-zA-Z0-9-]*[^>]*>|[^<]+/g) || [];
  for (const tok of tokens) {
    if (tok.startsWith("<!--")) continue;
    const m = tok.match(/^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*)>$/);
    if (!m) {
      if (!overslaanDiepte) buf += ontsnap(tok);
      continue;
    }
    const [, sluit, rauweNaam, attrs] = m;
    const naam = rauweNaam.toLowerCase();
    if (!sluit) {
      if (LEEG.has(naam) || /\/\s*$/.test(attrs)) {
        if (!overslaanDiepte && naam === "br") buf += " ";
        continue;
      }
      const overslaan = overslaanDiepte > 0 || OVERSLAAN.has(naam) || verborgen(attrs);
      stapel.push({ naam, overslaan });
      if (overslaan) { overslaanDiepte++; continue; }
      if (BLOK.has(naam)) {
        spoel();
        if (/^h[1-6]$/.test(naam) || naam === "li" || naam === "blockquote") soort = naam;
      } else if (naam === "a") {
        links.push({ start: buf.length, href: absoluteLink(attribuut(attrs, "href")) });
      } else if (naam === "strong" || naam === "b") {
        buf += "**";
      }
      continue;
    }
    // sluitende tag: zoek het bijbehorende open element
    let i = stapel.length - 1;
    while (i >= 0 && stapel[i].naam !== naam) i--;
    if (i < 0) continue;
    while (stapel.length > i) {
      const el = stapel.pop();
      if (el.overslaan) { overslaanDiepte--; continue; }
      if (BLOK.has(el.naam)) {
        spoel();
        if (soort === el.naam) soort = null;
      } else if (el.naam === "a") {
        const l = links.pop();
        if (l && l.href) {
          const tekst = buf.slice(l.start).replace(/\s+/g, " ").trim();
          buf = buf.slice(0, l.start) + (tekst ? ` [${tekst}](${l.href}) ` : "");
        }
      } else if (el.naam === "strong" || el.naam === "b") {
        buf = /\*\*\s*$/.test(buf) ? buf.replace(/\*\*\s*$/, "") : buf + "**";
      }
    }
  }
  spoel();

  // Opschonen: dubbele regels na elkaar weg, lege vet-markeringen weg
  const schoon = [];
  for (const r of regels) {
    const t = r.replace(/\*\*\s*\*\*/g, "").replace(/\s+([.,:;!?])/g, "$1").trim();
    if (!t || t === "-" || t === "**" || /^\d{1,2}$/.test(t)) continue; // losse stapnummers ("01") zeggen een agent niets
    if (schoon.length && schoon[schoon.length - 1] === t) continue;
    schoon.push(t);
  }
  // De H1 bovenaan, zoals een agent verwacht
  const h1 = schoon.findIndex((r) => r.startsWith("# "));
  if (h1 > 0) schoon.unshift(schoon.splice(h1, 1)[0]);
  return schoon.join("\n\n") + "\n";
}
