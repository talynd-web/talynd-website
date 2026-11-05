// Maakt de butler-svg's uit de reel-clips (zelfde tekening, niets nagetekend). Draaien: node tools-butler.mjs
import vm from "node:vm";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const C = "/Users/dimas/Library/Mobile Documents/com~apple~CloudDocs/Geniuses_OF_Talynd/Marketing/Video/launches/talynd-butler/clips/";
const ctx = { Math }; vm.createContext(ctx);
vm.runInContext(readFileSync(C + "_basis.js", "utf8"), ctx);
vm.runInContext(readFileSync(C + "_ober.js", "utf8"), ctx);
const api = vm.runInContext("({ OB, oberBenen, oberLijf, oberDas, draagArm, bladSvg2, dekselSvg2, dekselPose, armLagen, polsBijKnop })", ctx);
const { OB } = api, B = OB.blad;
const das = api.oberDas().replace("../assets/talynd-mark.png", "assets/butler/talynd-mark.png");
const dekselAt = (k) => { const p = api.dekselPose(k); return { tr: `translate(${(B.x + p.dx).toFixed(1)} ${(B.y + p.dy).toFixed(1)}) rotate(${p.rot.toFixed(2)})`, K: { x: B.x + p.kx, y: B.y + p.ky } }; };
const armAt = (k) => api.armLagen(OB.schouderR, api.polsBijKnop(dekselAt(k).K), 1, "greep");
const d0 = dekselAt(0), d1 = dekselAt(1), a0 = armAt(0), a1 = armAt(1);
// Staand met dienblad, deksel dicht (k=0) en open (k=1) als twee standen; CSS schakelt via .is-open
const figuur = (id) => `<svg class="butler" viewBox="290 500 720 1330" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<g class="butler__benen">${api.oberBenen()}</g>
<g class="butler__boven">
${api.oberLijf()}${das}
<g class="butler__armL">${api.draagArm(0)}</g>
<g class="butler__blad">${api.bladSvg2()}</g>
<g class="butler__mouw butler__mouw--dicht">${a0.mouw}</g><g class="butler__mouw butler__mouw--open">${a1.mouw}</g>
<g class="butler__deksel" data-dicht="${d0.tr}" data-open="${d1.tr}" transform="${d0.tr}">${api.dekselSvg2()}</g>
<g class="butler__hand butler__hand--dicht">${a0.hand}</g><g class="butler__hand butler__hand--open">${a1.hand}</g>
</g>
</svg>`;
mkdirSync("partials", { recursive: true });
writeFileSync("partials/butler.svg", figuur());
console.log("partials/butler.svg", readFileSync("partials/butler.svg").length, "bytes; deksel open:", d1.tr);
