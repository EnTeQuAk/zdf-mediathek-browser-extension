import { createCard } from "./cards.js";

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

  const rail = document.createElement("div");
  rail.className = "zk-rail";
  section.appendChild(rail);

  return section;
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
  const countEl = section.querySelector(".zk-section-count");
  rail.innerHTML = "";
  const fragment = document.createDocumentFragment();
  const nowMs = Date.now();
  items.forEach((item) => fragment.appendChild(createCard(item, nowMs)));
  rail.appendChild(fragment);
  if (countEl && total) {
    countEl.textContent = `${total} verfügbar`;
  }
}
