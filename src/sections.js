import { createCard } from "./cards.js";

const SKELETON_COUNT = 6;

function createSkeletonCard() {
  const card = document.createElement("div");
  card.className = "zk-skeleton-card";
  card.innerHTML = '<div class="zk-skeleton-image"></div><div class="zk-skeleton-text"></div>';
  return card;
}

function updateScrollAffordance(wrapper, rail) {
  const canScrollLeft = rail.scrollLeft > 0;
  const canScrollRight = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1;
  wrapper.classList.toggle("zk-rail-wrapper--fade-left", canScrollLeft);
  wrapper.classList.toggle("zk-rail-wrapper--fade-right", canScrollRight);
}

export function createSection(id, title) {
  const section = document.createElement("section");
  section.className = "zk-section";
  section.id = id;

  const header = document.createElement("div");
  header.className = "zk-section-header";

  const h2 = document.createElement("h2");
  h2.className = "zk-section-title";
  h2.textContent = title;
  header.appendChild(h2);

  const count = document.createElement("span");
  count.className = "zk-section-count";
  header.appendChild(count);

  section.appendChild(header);

  const wrapper = document.createElement("div");
  wrapper.className = "zk-rail-wrapper";

  const rail = document.createElement("div");
  rail.className = "zk-rail";
  rail.tabIndex = 0;
  rail.setAttribute("role", "list");
  rail.addEventListener("scroll", () => updateScrollAffordance(wrapper, rail));
  rail.addEventListener("keydown", (e) => {
    const scrollAmount = 276;
    if (e.key === "ArrowRight") {
      rail.scrollBy({ left: scrollAmount });
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      rail.scrollBy({ left: -scrollAmount });
      e.preventDefault();
    }
  });

  wrapper.appendChild(rail);
  section.appendChild(wrapper);

  return section;
}

export function showSkeletons(section) {
  const rail = section.querySelector(".zk-rail");
  rail.innerHTML = "";
  for (let i = 0; i < SKELETON_COUNT; i++) {
    rail.appendChild(createSkeletonCard());
  }
}

export function setRailContent(section, className, html) {
  const rail = section.querySelector(".zk-rail");
  rail.innerHTML = "";
  const el = document.createElement("div");
  el.className = className;
  if (html.startsWith("<")) {
    el.innerHTML = html;
  } else {
    el.textContent = html;
  }
  rail.appendChild(el);
}

export function renderCards(section, items, total) {
  const rail = section.querySelector(".zk-rail");
  const wrapper = rail.closest(".zk-rail-wrapper");
  const countEl = section.querySelector(".zk-section-count");
  rail.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const nowMs = Date.now();
  items.forEach((item) => {
    const card = createCard(item, nowMs);
    card.setAttribute("role", "listitem");
    fragment.appendChild(card);
  });
  rail.appendChild(fragment);
  if (countEl && total) {
    countEl.textContent = `${total} verfügbar`;
  }
  if (wrapper) {
    requestAnimationFrame(() => updateScrollAffordance(wrapper, rail));
  }
}
