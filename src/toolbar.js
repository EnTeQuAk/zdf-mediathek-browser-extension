import { createPill } from "./pills.js";

function createSortLinks(onChange) {
  const container = document.createElement("div");
  container.className = "zk-sort-links";

  const options = [
    { label: "Empfohlen", value: "" },
    { label: "Neueste", value: "date" },
    { label: "Meist gesehen", value: "views" },
  ];

  for (let i = 0; i < options.length; i++) {
    if (i > 0) {
      const sep = document.createElement("span");
      sep.className = "zk-sort-sep";
      sep.textContent = "·";
      container.appendChild(sep);
    }
    const btn = document.createElement("button");
    btn.className = `zk-sort-link${i === 0 ? " zk-sort-link--active" : ""}`;
    btn.textContent = options[i].label;
    btn.type = "button";
    btn.dataset.value = options[i].value;
    container.appendChild(btn);
  }

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".zk-sort-link");
    if (!btn) {
      return;
    }
    for (const b of container.querySelectorAll(".zk-sort-link")) {
      b.classList.toggle("zk-sort-link--active", b === btn);
    }
    onChange(btn.dataset.value || null);
  });

  return container;
}

function createTypeToggle(onChange) {
  const toggle = document.createElement("div");
  toggle.className = "zk-type-toggle";

  const options = [
    { label: "Videos", value: "page-video", active: true },
    { label: "Serien", value: "page-index", active: false },
  ];

  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = `zk-type-btn${opt.active ? " zk-type-btn--active" : ""}`;
    btn.textContent = opt.label;
    btn.type = "button";
    btn.dataset.value = opt.value;
    toggle.appendChild(btn);
  }

  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".zk-type-btn");
    if (!btn) {
      return;
    }
    for (const b of toggle.querySelectorAll(".zk-type-btn")) {
      b.classList.toggle("zk-type-btn--active", b === btn);
    }
    onChange(btn.dataset.value || null);
  });

  return toggle;
}

function createBrandBar(brands, onChange) {
  const bar = document.createElement("div");
  bar.className = "zk-toolbar-filters";

  const allPill = createPill("Alle", true);
  bar.appendChild(allPill);

  for (const brand of brands) {
    bar.appendChild(createPill(brand, false));
  }

  bar.addEventListener("click", (e) => {
    const pill = e.target.closest(".zk-pill");
    if (!pill) {
      return;
    }
    for (const p of bar.querySelectorAll(".zk-pill")) {
      p.classList.toggle("zk-pill--active", p === pill);
    }
    onChange(pill.dataset.brand || "");
  });

  return bar;
}

export function createToolbar({ brands = [], onBrandChange, onSortChange, onTypeChange }) {
  const toolbar = document.createElement("div");
  toolbar.className = "zk-toolbar";

  // Left zone: brand pills
  if (brands.length > 0) {
    toolbar.appendChild(createBrandBar(brands, onBrandChange));
  }

  // Right zone: sort links, type toggle, filter button
  const controls = document.createElement("div");
  controls.className = "zk-toolbar-controls";

  controls.appendChild(createSortLinks(onSortChange));
  controls.appendChild(createTypeToggle(onTypeChange));

  const filterBtn = document.createElement("button");
  filterBtn.className = "zk-filter-btn";
  filterBtn.type = "button";
  filterBtn.title = "Bald verfügbar";
  filterBtn.disabled = true;
  filterBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
  controls.appendChild(filterBtn);

  toolbar.appendChild(controls);

  return toolbar;
}
