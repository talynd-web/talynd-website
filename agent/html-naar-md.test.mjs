// Draaien: node --test agent/
import test from "node:test";
import assert from "node:assert/strict";
import { htmlNaarMd, absoluteLink, ontsnap } from "./html-naar-md.mjs";

test("koppen, alinea's, lijsten en links", () => {
  const md = htmlNaarMd(`<body><h1>Titel</h1><p>Wij <strong>bouwen</strong> het &amp; dragen <a href="contact">het over</a>.</p><ul><li>Een</li><li>Twee</li></ul><h2>Kop</h2></body>`);
  assert.equal(md, "# Titel\n\nWij **bouwen** het & dragen [het over](https://talynd.com/contact).\n\n- Een\n\n- Twee\n\n## Kop\n");
});

test("menu, scripts, formulieren, svg en verborgen kopieën vallen weg", () => {
  const md = htmlNaarMd(`<body><nav><a href="/">Menu</a></nav><script>x=1</script><h1>Titel</h1><svg><text>logo</text></svg><ul aria-hidden="true"><li>Kopie</li></ul><form><label>Naam</label></form><p>Echt</p></body>`);
  assert.equal(md, "# Titel\n\nEcht\n");
});

test("H1 komt bovenaan, ook als er een regel voor staat", () => {
  const md = htmlNaarMd(`<body><p class="hero__kicker">Bouwen. <br>Overdragen.</p><h1>Meer winst</h1></body>`);
  assert.equal(md.split("\n\n")[0], "# Meer winst");
  assert.match(md, /Bouwen\. Overdragen\./);
});

test("links: alleen https, mailto, tel en eigen paden", () => {
  assert.equal(absoluteLink("diensten#leads"), "https://talynd.com/diensten#leads");
  assert.equal(absoluteLink("/"), "https://talynd.com/");
  assert.equal(absoluteLink("mailto:info@talynd.com"), "mailto:info@talynd.com");
  assert.equal(absoluteLink("#top"), null);
  assert.equal(absoluteLink("javascript:alert(1)"), null);
  assert.equal(absoluteLink("http://onveilig.nl"), null);
});

test("entiteiten", () => {
  assert.equal(ontsnap("&euro; 6&nbsp;000 &#39;x&#x27; &copy;"), "€ 6 000 'x' ©");
});

test("dubbele regels achter elkaar komen maar één keer", () => {
  assert.equal(htmlNaarMd(`<body><h1>A</h1><p>B</p><p>B</p></body>`), "# A\n\nB\n");
});

test("losse stapnummers vallen weg", () => {
  assert.equal(htmlNaarMd(`<body><h1>A</h1><span>01</span><p>Plan</p></body>`), "# A\n\nPlan\n");
});

test("onbekende linksoorten en een kapotte tekencode", () => {
  assert.equal(absoluteLink("sms:+31600000000"), null);
  assert.equal(absoluteLink("//andere-site.nl/x"), null);
  assert.equal(absoluteLink("data:text/html,x"), null);
  assert.equal(ontsnap("a &#99999999; b"), "a &#99999999; b");
});
