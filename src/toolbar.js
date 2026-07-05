import { createPill } from "./pills.js";

function createSegmentControl(options, onChange) {
  const control = document.createElement("div");
  control.className = "zk-segment-control";

  for (const opt of options) {
    const btn = document.createElement("button");
    btn.className = `zk-segment-btn${opt.active ? " zk-segment-btn--active" : ""}`;
    btn.textContent = opt.label;
    btn.type = "button";
    btn.dataset.value = opt.value ?? "";
    control.appendChild(btn);
  }

  control.addEventListener("click", (e) => {
    const btn = e.target.closest(".zk-segment-btn");
    if (!btn) {
      return;
    }
    for (const b of control.querySelectorAll(".zk-segment-btn")) {
      b.classList.toggle("zk-segment-btn--active", b === btn);
    }
    const value = btn.dataset.value || null;
    onChange(value);
  });

  return control;
}

function createBrandBar(brands, onChange) {
  const bar = document.createElement("div");
  bar.className = "zk-toolbar-brands";

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

  const controls = document.createElement("div");
  controls.className = "zk-toolbar-controls";

  const sortControl = createSegmentControl(
    [
      { label: "Empfohlen", value: "", active: true },
      { label: "Neueste", value: "date", active: false },
      { label: "Meist gesehen", value: "views", active: false },
    ],
    onSortChange,
  );
  controls.appendChild(sortControl);

  const typeControl = createSegmentControl(
    [
      { label: "Einzelbeiträge", value: "page-video", active: true },
      { label: "Serien & Reihen", value: "page-index", active: false },
    ],
    onTypeChange,
  );
  controls.appendChild(typeControl);

  toolbar.appendChild(controls);

  if (brands.length > 0) {
    const brandBar = createBrandBar(brands, onBrandChange);
    toolbar.appendChild(brandBar);
  }

  return toolbar;
}
