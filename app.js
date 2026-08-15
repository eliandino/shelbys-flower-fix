"use strict";
const images = Array.from(
  { length: 18 },
  (_, i) => `assets/images/flower-${i + 1}.jpg`,
);
const titles = [
  "Seasonal Joy",
  "Thinking of You",
  "Garden Celebration",
  "A Little Encouragement",
  "Spring Cheer",
  "Made with Love",
];
const categories = ["seasonal", "comfort", "celebration"];
const carousel = document.querySelector("#carousel");
images.slice(0, 8).forEach((src, i) => {
  carousel.insertAdjacentHTML(
    "beforeend",
    `<article class="card"><img src="${src}" alt="Shelby floral arrangement ${i + 1}" loading="lazy"><div><h3>${titles[i % titles.length]}</h3><span>Handcrafted with heart ♡</span></div></article>`,
  );
});
function pauseThenResumeCarousel() {
  clearInterval(carouselTimer);
  clearTimeout(carouselResumeTimer);
  carouselResumeTimer = setTimeout(startCarouselAutoplay, 4000);
}
document.querySelector("#prev").onclick = () => {
  carousel.scrollBy({ left: -410, behavior: "smooth" });
  pauseThenResumeCarousel();
};
document.querySelector("#next").onclick = () => {
  carousel.scrollBy({ left: 410, behavior: "smooth" });
  pauseThenResumeCarousel();
};

let carouselTimer;
let carouselResumeTimer;
function autoScrollCarousel() {
  const atEnd =
    carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 10;
  carousel.scrollBy({
    left: atEnd ? -carousel.scrollLeft : 410,
    behavior: "smooth",
  });
}
function startCarouselAutoplay() {
  clearInterval(carouselTimer);
  carouselTimer = setInterval(autoScrollCarousel, 3000);
}
startCarouselAutoplay();
["pointerdown", "wheel", "touchstart"].forEach((evt) =>
  carousel.addEventListener(evt, pauseThenResumeCarousel, { passive: true }),
);
const grid = document.querySelector("#galleryGrid");
let current = 0;
function renderGallery(filter = "all") {
  grid.innerHTML = "";
  images.forEach((src, i) => {
    const cat = categories[i % 3];
    if (filter === "all" || filter === cat)
      grid.insertAdjacentHTML(
        "beforeend",
        `<figure data-index="${i}" data-cat="${cat}"><img src="${src}" alt="Custom floral design ${i + 1}" loading="lazy"></figure>`,
      );
  });
}
renderGallery();
document.querySelectorAll(".filters button").forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelector(".filters .active").classList.remove("active");
      b.classList.add("active");
      renderGallery(b.dataset.filter);
    }),
);
const dlg = document.querySelector("#lightbox"),
  lb = document.querySelector("#lightboxImg");
grid.addEventListener("click", (e) => {
  const f = e.target.closest("figure");
  if (!f) return;
  current = +f.dataset.index;
  lb.src = images[current];
  dlg.showModal();
});
document.querySelector("#closeLightbox").onclick = () => dlg.close();
document.querySelector(".lb-prev").onclick = () => {
  current = (current - 1 + images.length) % images.length;
  lb.src = images[current];
};
document.querySelector(".lb-next").onclick = () => {
  current = (current + 1) % images.length;
  lb.src = images[current];
};
document.querySelector(".menu").onclick = () =>
  document.querySelector("nav").classList.toggle("open");
document
  .querySelectorAll("nav a")
  .forEach(
    (a) =>
      (a.onclick = () =>
        document.querySelector("nav").classList.remove("open")),
  );
document.querySelector("#orderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = `Hi Shelby! I'd like to order a floral arrangement.%0A%0AOccasion: ${encodeURIComponent(occasion.value || "Not specified")}%0ABudget: ${encodeURIComponent(budget.value)}%0AColors/flowers: ${encodeURIComponent(colors.value || "Open to ideas")}%0ADate: ${encodeURIComponent(date.value || "Flexible")}%0A%0ACan you help me with some ideas?`;
  location.href = `sms:+19046163373?&body=${msg}`;
});
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((x) => io.observe(x));
document.querySelector("#year").textContent = new Date().getFullYear();
