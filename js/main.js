// TALYND — Main JavaScript

// Nav: add .scrolled class on scroll
const nav = document.querySelector(".nav");
if (nav) {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  });
}

// Smooth scroll for anchor links
document.querySelectorAll("a[href^=\"#\"]").forEach(link => {
  link.addEventListener("click", e => {
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });
});