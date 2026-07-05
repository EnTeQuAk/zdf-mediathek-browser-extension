export function createPillBar(brands, onSelect) {
  if (!brands || brands.length === 0) {
    return null;
  }

  const bar = document.createElement("div");
  bar.className = "zk-pills";

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

    const selected = pill.dataset.brand || "";
    onSelect(selected);
  });

  return bar;
}

export function createPill(label, active) {
  const btn = document.createElement("button");
  btn.className = `zk-pill${active ? " zk-pill--active" : ""}`;
  btn.textContent = label;
  btn.type = "button";
  if (label !== "Alle") {
    btn.dataset.brand = label;
  }
  return btn;
}
