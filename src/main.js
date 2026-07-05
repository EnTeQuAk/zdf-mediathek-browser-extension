import { RESULTS_PER_SECTION, detectCurrentPage } from "./config.js";
import { extractApiToken, fetchContent } from "./api.js";
import { createSection, setRailContent, renderCards } from "./sections.js";
import { findGridContainer, injectContainer } from "./dom.js";
import { detectActiveFilter, observeFilterChanges } from "./filters.js";

const LOADING_HTML = '<div class="zk-loading-spinner"></div><span>Lade Inhalte…</span>';

async function loadSections(token, page, expectedFilter) {
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
    const result = await fetchContent(token, {
      query: expectedFilter,
      limit: RESULTS_PER_SECTION,
      path: page.apiPath,
    });
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
          ? `Keine neuen Inhalte in "${expectedFilter}" gefunden.`
          : `Keine neuen Inhalte gefunden.`
      );
    } else {
      const title = expectedFilter
        ? `Neu: ${page.label} · ${expectedFilter}`
        : `Neu: ${page.label}`;
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
  const existing = document.getElementById("zk-container");
  if (existing) {
    existing.remove();
  }

  const page = detectCurrentPage();
  if (!page) return;

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
  const neueDokusSection = createSection("zk-neue-dokus", `Neu: ${page.label}`);

  container.appendChild(vorabSection);
  container.appendChild(neueDokusSection);

  injectContainer(grid, container);

  const filter = detectActiveFilter();
  await loadSections(token, page, filter);
  observeFilterChanges((newFilter) => loadSections(token, page, newFilter));
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

function observeNavigation() {
  let lastPath = window.location.pathname;
  let debounceTimer = null;

  const check = () => {
    debounceTimer = null;
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      lastPath = currentPath;
      tryInit(0);
    }
  };

  const scheduleCheck = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(check, 500);
  };

  window.addEventListener("popstate", scheduleCheck);

  const main = document.querySelector("main");
  if (main) {
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(main, { childList: true, subtree: false });
  }
}

if (document.readyState !== "loading") {
  setTimeout(tryInit, 300);
  setTimeout(observeNavigation, 500);
} else {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(tryInit, 300);
    setTimeout(observeNavigation, 500);
  });
}
