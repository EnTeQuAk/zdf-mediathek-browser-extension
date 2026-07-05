import { RESULTS_PER_SECTION } from "./config.js";
import { extractApiToken, fetchContent } from "./api.js";
import { createSection, setRailContent, renderCards } from "./sections.js";
import { findGridContainer } from "./dom.js";
import { detectActiveFilter, observeFilterChanges } from "./filters.js";

const LOADING_HTML = '<div class="zk-loading-spinner"></div><span>Lade Inhalte…</span>';

async function loadSections(token, expectedFilter) {
  const container = document.getElementById("zk-container");
  if (!container) return;

  const neueDokus = container.querySelector("#zk-neue-dokus");
  const vorab = container.querySelector("#zk-vorab");

  setRailContent(neueDokus, "zk-loading", LOADING_HTML);
  if (vorab) {
    setRailContent(vorab, "zk-loading", LOADING_HTML);
  }

  const now = new Date().toISOString();

  try {
    const result = await fetchContent(token, { query: expectedFilter, limit: RESULTS_PER_SECTION });
    if (detectActiveFilter() !== expectedFilter) return;

    const vorabItems = result.items.filter(
      (r) => r.editorialDate && r.editorialDate > now
    );
    const neueItems = result.items.filter(
      (r) => !r.editorialDate || r.editorialDate <= now
    );

    if (vorab) {
      if (vorabItems.length === 0) {
        vorab.style.display = "none";
      } else {
        vorab.style.display = "";
        renderCards(vorab, vorabItems);
      }
    }

    if (neueItems.length === 0) {
      setRailContent(neueDokus, "zk-empty",
        expectedFilter
          ? `Keine neuen Dokus in "${expectedFilter}" gefunden.`
          : "Keine neuen Dokus gefunden."
      );
    } else {
      const title = expectedFilter ? `Neue Dokus: ${expectedFilter}` : "Neue Dokus";
      neueDokus.querySelector(".zk-section-title").textContent = title;
      renderCards(neueDokus, neueItems, result.total);
    }
  } catch (err) {
    console.error("[ZDF Klassik]", err);
    setRailContent(neueDokus, "zk-error", "Inhalte konnten nicht geladen werden.");
    if (vorab) setRailContent(vorab, "zk-error", "");
  }
}

async function init() {
  if (document.getElementById("zk-container")) return;

  const token = extractApiToken();
  if (!token) {
    console.warn("[ZDF Klassik] Kein API-Token gefunden");
    return;
  }

  const grid = findGridContainer();
  if (!grid) {
    console.warn("[ZDF Klassik] Grid-Container nicht gefunden");
    return;
  }

  const container = document.createElement("div");
  container.id = "zk-container";

  const vorabSection = createSection("zk-vorab", "Vorab verfügbar");
  const neueDokusSection = createSection("zk-neue-dokus", "Neue Dokus");

  container.appendChild(vorabSection);
  container.appendChild(neueDokusSection);

  if (grid.before) {
    grid.before.parentNode.insertBefore(container, grid.before);
  } else {
    grid.parent.appendChild(container);
  }

  const filter = detectActiveFilter();
  await loadSections(token, filter);
  observeFilterChanges((newFilter) => loadSections(token, newFilter));
}

function tryInit(attempts = 0) {
  if (document.getElementById("zk-container")) return;
  if (findGridContainer()) {
    init();
    return;
  }
  if (attempts > 30) {
    console.warn("[ZDF Klassik] Gave up waiting for grid container");
    return;
  }
  setTimeout(() => tryInit(attempts + 1), 300);
}

if (document.readyState !== "loading") {
  setTimeout(tryInit, 300);
} else {
  document.addEventListener("DOMContentLoaded", () =>
    setTimeout(tryInit, 300)
  );
}
