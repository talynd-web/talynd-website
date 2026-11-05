// Zet header en footer uit partials/ in elke pagina en geeft css en js een versie op basis van hun inhoud.
// Draaien: node build.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const PAGES = readdirSync(".").filter((f) => f.endsWith(".html"));
const header = readFileSync("partials/header.html", "utf8").trimEnd();
const footer = readFileSync("partials/footer.html", "utf8").trimEnd();
const hash = (p) => createHash("sha1").update(readFileSync(p)).digest("hex").slice(0, 8);
const cssV = hash("css/styles.css");
const jsV = hash("js/main.js");

const NAV_RE = /  <!-- ============ NAVBAR ============ -->[\s\S]*?\n  <\/nav>/;
const INC_RE = /  <!-- include:([\w-]+) -->[\s\S]*?<!-- \/include:\1 -->/g;
const FOOT_RE = /  <!-- ============ FOOTER ============ -->[\s\S]*?\n  <\/footer>/;

for (const page of PAGES) {
  const slug = page.replace(/\.html$/, "");
  let html = readFileSync(page, "utf8");
  if (!NAV_RE.test(html)) throw new Error(`${page}: geen navbar-blok`);
  const nav = header.replace(new RegExp(`<a href="${slug}">`, "g"), `<a href="${slug}" class="active">`);
  html = html.replace(NAV_RE, nav);
  if (FOOT_RE.test(html)) html = html.replace(FOOT_RE, footer);
  html = html.replace(INC_RE, (_, naam) => `  <!-- include:${naam} -->\n${readFileSync(`partials/${naam}.svg`, "utf8").trimEnd()}\n  <!-- /include:${naam} -->`);
  html = html.replace(/css\/styles\.css\?v=[\w-]+/g, `css/styles.css?v=${cssV}`);
  html = html.replace(/js\/main\.js\?v=[\w-]+/g, `js/main.js?v=${jsV}`);
  writeFileSync(page, html);
  console.log(`${page}: nav${FOOT_RE.test(html) ? " + footer" : ""}, css ${cssV}, js ${jsV}`);
}
