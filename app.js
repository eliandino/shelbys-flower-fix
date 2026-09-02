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
const placeholderDesc =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
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
        `<figure data-index="${i}" data-cat="${cat}"><img src="${src}" alt="Custom floral design ${i + 1}" loading="lazy"><figcaption><h4>${titles[i % titles.length]}</h4><p>${placeholderDesc}</p></figcaption></figure>`,
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
  lb = document.querySelector("#lightboxImg"),
  lbTitle = document.querySelector("#lightboxTitle"),
  lbDesc = document.querySelector("#lightboxDesc");
function showImage(i) {
  current = i;
  lb.src = images[current];
  lbTitle.textContent = titles[current % titles.length];
  lbDesc.textContent = placeholderDesc;
}
grid.addEventListener("click", (e) => {
  const f = e.target.closest("figure");
  if (!f) return;
  showImage(+f.dataset.index);
  dlg.showModal();
});
document.querySelector("#closeLightbox").onclick = () => dlg.close();
document.querySelector(".lb-prev").onclick = () => {
  showImage((current - 1 + images.length) % images.length);
};
document.querySelector(".lb-next").onclick = () => {
  showImage((current + 1) % images.length);
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
// Builds a short, human-readable order number like SFF-260902-A7K4.
// This is generated in the browser for now since there's no backend yet
// (Phase 1). Once a backend exists (Phase 3-4), it becomes the source of
// truth for order numbers and this becomes just a display fallback.
function generateOrderId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  // Ambiguous characters (0/O, 1/I) are left out so IDs are easy to read
  // back over the phone or type in by hand.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SFF-${yy}${mm}${dd}-${suffix}`;
}

// Delivery address is only relevant when "Delivery" is chosen, so it stays
// hidden (and not required) until then.
document.querySelector("#fulfillment").addEventListener("change", () => {
  const isDelivery = fulfillment.value === "Delivery";
  deliveryAddressWrap.hidden = !isDelivery;
  deliveryAddress.required = isDelivery;
});

document.querySelector("#orderForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const orderId = generateOrderId();
  const isDelivery = fulfillment.value === "Delivery";

  // Each entry becomes one line of the text to Shelby; `null` entries are
  // dropped so optional fields don't show up as empty lines.
  const lines = [
    "🌸 Shelby's Flower Fix Order Request",
    "",
    `Order: ${orderId}`,
    `Customer: ${customerName.value}`,
    `Phone: ${customerPhone.value}`,
    customerEmail.value ? `Email: ${customerEmail.value}` : null,
    "",
    `Occasion: ${occasion.value || "Not specified"}`,
    `Budget: ${budget.value}`,
    `Colors / Flowers: ${colors.value || "Open to ideas"}`,
    `Requested Date: ${date.value || "Flexible"}`,
    `Pickup / Delivery: ${fulfillment.value}`,
    isDelivery ? `Delivery Address: ${deliveryAddress.value}` : null,
    specialInstructions.value
      ? `Special Instructions: ${specialInstructions.value}`
      : null,
    "",
    "Please review my request and send me a final quote.",
  ].filter((line) => line !== null);

  orderConfirmation.hidden = false;
  document.querySelector("#confirmedOrderId").textContent = orderId;

  const msg = encodeURIComponent(lines.join("\n"));
  location.href = `sms:+19046163373?&body=${msg}`;
});
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
  { threshold: 0.15 },
);
document.querySelectorAll(".reveal").forEach((x) => io.observe(x));
document.querySelector("#year").textContent = new Date().getFullYear();
