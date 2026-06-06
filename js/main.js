// TALYND — Main JavaScript

/* ---------- Announcement bar ---------- */
const announce = document.getElementById("announce");
const announceClose = document.getElementById("announceClose");
if (announce && announceClose) {
  if (sessionStorage.getItem("talynd_announce_closed") === "1") announce.classList.add("hidden");
  announceClose.addEventListener("click", () => {
    announce.classList.add("hidden");
    sessionStorage.setItem("talynd_announce_closed", "1");
  });
}

/* ---------- Hero video: ensure autoplay loop ---------- */
document.querySelectorAll("video").forEach((vid) => {
  vid.muted = true;
  const tryPlay = () => { const p = vid.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  vid.addEventListener("loadeddata", tryPlay);
  vid.addEventListener("canplay", tryPlay);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });
});

/* ---------- Mobile menu ---------- */
const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
if (navbar && navToggle) {
  navToggle.addEventListener("click", () => navbar.classList.toggle("open"));
  navbar.querySelectorAll(".navbar__mobile a").forEach(a =>
    a.addEventListener("click", () => navbar.classList.remove("open"))
  );
}

/* ---------- Smooth anchor scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const id = link.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "smooth" });
    }
  });
});

/* ---------- Rotating hero word ---------- */
const rotator = document.getElementById("rotator");
if (rotator) {
  const words = ["makelaars", "beleggers", "beheerders", "operators"];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    rotator.style.animation = "none";
    void rotator.offsetWidth;
    rotator.textContent = words[i];
    rotator.style.animation = "wordIn 0.5s ease";
  }, 2600);
}

/* ---------- Feature tabs (How it works) ---------- */
const tabs = document.querySelectorAll("#tabs .tab");
const howPanel = document.getElementById("howPanel");
const panelLabels = [
  "[SCREENSHOT: dashboard / Pipedrive pipeline, stap 1: Intake op locatie]",
  "[SCREENSHOT: analyse & plan, tools, scope en verwacht resultaat]",
  "[SCREENSHOT: systeem in aanbouw, workflows, koppelingen, database]",
  "[SCREENSHOT: opgeleverd systeem, training & overdracht afgerond]"
];
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const idx = parseInt(tab.dataset.tab, 10);
    if (howPanel && panelLabels[idx]) howPanel.setAttribute("data-label", panelLabels[idx]);
  });
});

/* ---------- Testimonial slider ---------- */
const track = document.getElementById("tmnlTrack");
const prevBtn = document.getElementById("tmnlPrev");
const nextBtn = document.getElementById("tmnlNext");
if (track && prevBtn && nextBtn) {
  const slides = track.children.length;
  let pos = 0;
  const render = () => { track.style.transform = `translateX(-${pos * 100}%)`; };
  prevBtn.addEventListener("click", () => { pos = (pos - 1 + slides) % slides; render(); });
  nextBtn.addEventListener("click", () => { pos = (pos + 1) % slides; render(); });
}

/* ---------- Fade-in-up on scroll ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
const reveals = Array.from(document.querySelectorAll(".fade-in-up"));

function runCounters(el) {
  el.querySelectorAll("[data-count]").forEach(animateCount);
}

if (reduceMotion || !("IntersectionObserver" in window)) {
  root.classList.add("reveal-fallback");
  reveals.forEach(el => { el.classList.add("visible"); runCounters(el); });
} else {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        runCounters(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  reveals.forEach(el => io.observe(el));

  // Robustness: in some contexts (inactive/background/capture iframes) the
  // IntersectionObserver callback never fires AND CSS transitions are frozen,
  // so a 0->1 opacity transition stays pinned at 0 and the page reads blank.
  // Timers still fire, so probe after load: if nothing revealed or a revealed
  // element is still stuck at opacity 0, force everything visible with no
  // transition. Active viewers pass this probe and keep the animation.
  setTimeout(() => {
    const probe = reveals.find(el => el.classList.contains("visible"));
    const frozen = !probe || getComputedStyle(probe).opacity === "0";
    if (frozen) {
      root.classList.add("reveal-fallback");
      reveals.forEach(runCounters);
    }
  }, 700);
}

/* ---------- Animated counters ---------- */
function animateCount(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = "1";
  const target = parseFloat(el.dataset.count);
  if (isNaN(target)) return;
  if (reduceMotion) { el.textContent = el.dataset.count; return; }
  const duration = 1100;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(ease(p) * target).toString();
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target.toString();
  }
  requestAnimationFrame(frame);
}

/* ---------- Cookie notice ---------- */
(function () {
  if (localStorage.getItem("talynd_cookie_ok") === "1") return;

  // Inject CSS
  var style = document.createElement("style");
  style.textContent = [
    ".ck-bar{position:fixed;bottom:0;left:0;right:0;z-index:9999;",
    "background:var(--black,#040e1f);color:rgba(255,255,255,0.88);",
    "padding:16px 24px;display:flex;align-items:center;justify-content:space-between;",
    "gap:16px;flex-wrap:wrap;font-family:'Inter',sans-serif;font-size:13.5px;",
    "line-height:1.5;border-top:1px solid rgba(255,255,255,0.08);",
    "transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.22,1,0.36,1);}",
    ".ck-bar.ck-visible{transform:translateY(0);}",
    ".ck-bar__text{flex:1;min-width:0;}",
    ".ck-bar__text a{color:var(--teal,#00beb1);text-decoration:underline;text-underline-offset:3px;}",
    ".ck-bar__actions{display:flex;gap:10px;flex-shrink:0;}",
    ".ck-btn{font-family:'Inter',sans-serif;font-size:13px;font-weight:500;",
    "padding:8px 18px;border-radius:20px;border:none;cursor:pointer;transition:opacity 0.18s ease;}",
    ".ck-btn--accept{background:var(--teal,#00beb1);color:#040e1f;}",
    ".ck-btn--accept:hover{opacity:0.85;}",
    ".ck-btn--info{background:transparent;color:rgba(255,255,255,0.55);",
    "border:1px solid rgba(255,255,255,0.18);}",
    ".ck-btn--info:hover{color:#fff;border-color:rgba(255,255,255,0.5);}"
  ].join("");
  document.head.appendChild(style);

  // Inject HTML
  var bar = document.createElement("div");
  bar.className = "ck-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Cookiemelding");
  bar.innerHTML = [
    '<p class="ck-bar__text">',
    "Wij gebruiken geen tracking cookies. Onze website verzamelt geanonimiseerde bezoekersstatistieken ",
    "zonder persoonlijke gegevens op te slaan. ",
    '<a href="/privacybeleid.html">Meer informatie</a>.',
    "</p>",
    '<div class="ck-bar__actions">',
    '<button class="ck-btn ck-btn--info" id="ckDecline">Weigeren</button>',
    '<button class="ck-btn ck-btn--accept" id="ckAccept">Begrepen</button>',
    "</div>"
  ].join("");
  document.body.appendChild(bar);

  // Animate in after short delay
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      bar.classList.add("ck-visible");
    });
  });

  function dismiss() {
    bar.classList.remove("ck-visible");
    localStorage.setItem("talynd_cookie_ok", "1");
    setTimeout(function () { bar.remove(); }, 400);
  }

  document.getElementById("ckAccept").addEventListener("click", dismiss);
  document.getElementById("ckDecline").addEventListener("click", dismiss);
})();
