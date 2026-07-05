import { createCard } from "./cards.js";

const SKELETON_COUNT = 12;

function createSkeletonCard() {
  const card = document.createElement("div");
  card.className = "zk-grid-skeleton-card";
  card.innerHTML = '<div class="zk-grid-skeleton-image"></div><div class="zk-grid-skeleton-text"></div>';
  return card;
}

export function createGrid(id) {
  const section = document.createElement("section");
  section.className = "zk-grid-section";
  section.id = id;

  const header = document.createElement("div");
  header.className = "zk-grid-header";

  const count = document.createElement("span");
  count.className = "zk-grid-count";
  header.appendChild(count);

  section.appendChild(header);

  const grid = document.createElement("div");
  grid.className = "zk-grid";
  section.appendChild(grid);

  const footer = document.createElement("div");
  footer.className = "zk-grid-footer";
  section.appendChild(footer);

  return section;
}

export function renderGridCards(section, items, append = false) {
  const grid = section.querySelector(".zk-grid");
  if (!append) {
    grid.innerHTML = "";
  }
  const fragment = document.createDocumentFragment();
  const nowMs = Date.now();
  for (const item of items) {
    const card = createCard(item, nowMs, { landscape: true });
    fragment.appendChild(card);
  }
  grid.appendChild(fragment);
}

export function showGridSkeletons(section, count = SKELETON_COUNT) {
  const grid = section.querySelector(".zk-grid");
  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

export function clearGrid(section) {
  const grid = section.querySelector(".zk-grid");
  grid.innerHTML = "";
}

export function setGridMessage(section, className, text) {
  const grid = section.querySelector(".zk-grid");
  grid.innerHTML = "";
  const el = document.createElement("div");
  el.className = className;
  el.textContent = text;
  grid.appendChild(el);
}

export function updateGridCount(section, current, total) {
  const count = section.querySelector(".zk-grid-count");
  if (count && total > 0) {
    count.textContent = `${current} von ${total}`;
  } else if (count) {
    count.textContent = "";
  }
}
