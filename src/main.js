import { RESULTS_PER_SECTION, detectCurrentPage } from "./config.js";
import { extractApiToken, fetchContent } from "./api.js";
import { createSection, setRailContent, renderCards, showSkeletons } from "./sections.js";
import { findGridContainer, injectContainer } from "./dom.js";
import { detectActiveFilter, observeFilterChanges } from "./filters.js";
import { createPillBar } from "./pills.js";

let activeController = null;

function buildQuery(filter, brand) {
  return [filter, brand].filter(Boolean).join(" ");
}

async function fetchNeue(token, page, filter, brand, signal) {
  const query = buildQuery(filter, brand);
  return fetchContent(token, {
    query,
    limit: RESULTS_PER_SECTION,
    path: page.apiPath,
    signal,
  });
}

async function fetchSerien(token, page, signal) {
  const params = new URLSearchParams({
    hasVideo: "true",
    sortOrder: "desc",
    sortBy: "date",
    paths: page.apiPath,
    page: "1",
    limit: String(RESULTS_PER_SECTION),
    types: "page-index",
  });
  const { apiFetch } = await import("./api.js");
  return apiFetch(token, `/search/documents?${params}`, { signal });
}

function renderNeue(section, page, items, total, filter, brand) {
  const now = new Date().toISOString();
  const neueItems = items.filter(
    (r) => !r.editorialDate || r.editorialDate <= now
  );

  if (neueItems.length === 0) {
    const query = buildQuery(filter, brand);
    setRailContent(section, "zk-empty",
      query
        ? `Keine neuen Inhalte für "${query}" gefunden.`
        : "Keine neuen Inhalte gefunden."
    );
  } else {
    const parts = [page.label];
    if (filter) parts.push(filter);
    if (brand) parts.push(brand);
    section.querySelector(".zk-section-title").textContent = `Neu: ${parts.join(" · ")}`;
    renderCards(section, neueItems, total);
  }
}

function renderVorab(section, items) {
  const now = new Date().toISOString();
  const vorabItems = items.filter(
    (r) => r.editorialDate && r.editorialDate > now
  );
  if (vorabItems.length === 0) {
    section.style.display = "none";
  } else {
    section.style.display = "";
    renderCards(section, vorabItems);
  }
}

async function loadSections(token, page, filter, brand) {
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  const { signal } = activeController;

  const container = document.getElementById("zk-container");
  if (!container) return;

  const sectionDefs = page.sections || [];
  for (const def of sectionDefs) {
    const el = container.querySelector(`#${def.id}`);
    if (el) {
      showSkeletons(el);
      el.style.display = "";
    }
  }

  try {
    const result = await fetchNeue(token, page, filter, brand, signal);
    const neueSection = container.querySelector("#zk-neue-dokus");
    const vorabSection = container.querySelector("#zk-vorab");

    if (neueSection) {
      renderNeue(neueSection, page, result.items, result.total, filter, brand);
    }
    if (vorabSection) {
      renderVorab(vorabSection, result.items);
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("[ZDF Klassik]", err);
    const neueSection = container.querySelector("#zk-neue-dokus");
    const vorabSection = container.querySelector("#zk-vorab");
    if (neueSection) {
      setRailContent(neueSection, "zk-error", "Inhalte konnten nicht geladen werden.");
    }
    if (vorabSection) setRailContent(vorabSection, "zk-error", "");
  }

  // Serien section loads independently
  const serienSection = container.querySelector("#zk-serien");
  if (serienSection) {
    loadSerien(token, page, serienSection, signal);
  }
}

async function loadSerien(token, page, section, signal) {
  try {
    const data = await fetchSerien(token, page, signal);
    const { parseSearchResults } = await import("./api.js");
    const items = parseSearchResults(data);
    if (items.length === 0) {
      section.style.display = "none";
    } else {
      renderCards(section, items, data.totalResultsCount);
    }
  } catch (err) {
    if (err.name === "AbortError") return;
    console.error("[ZDF Klassik] Serien:", err);
    section.style.display = "none";
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

  const sectionDefs = page.sections || [];
  for (const def of sectionDefs) {
    container.appendChild(createSection(def.id, def.title));
  }

  // Add brand pills to the "neue" section
  let activeBrand = "";
  const neueSection = container.querySelector("#zk-neue-dokus");
  if (neueSection) {
    const pillBar = createPillBar(page.brands, (brand) => {
      activeBrand = brand;
      loadSections(token, page, detectActiveFilter(), activeBrand);
    });
    if (pillBar) {
      neueSection.insertBefore(pillBar, neueSection.querySelector(".zk-rail-wrapper"));
    }
  }

  injectContainer(grid, container);

  const filter = detectActiveFilter();
  await loadSections(token, page, filter, activeBrand);
  observeFilterChanges((newFilter) => loadSections(token, page, newFilter, activeBrand));
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
