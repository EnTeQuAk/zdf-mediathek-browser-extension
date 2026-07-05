import { RESULTS_PER_SECTION, detectCurrentPage } from "./config.js";
import { extractApiToken, fetchContent } from "./api.js";
import { createSection, setRailContent, renderCards, showSkeletons } from "./sections.js";
import { findGridContainer, injectContainer } from "./dom.js";
import { detectActiveFilter, observeFilterChanges } from "./filters.js";
import { createToolbar } from "./toolbar.js";

let activeController = null;

function buildQuery(filter, brand) {
  return [filter, brand].filter(Boolean).join(" ");
}

async function fetchNeue(token, page, filter, brand, sortBy, types, signal) {
  const query = buildQuery(filter, brand);
  return fetchContent(token, {
    query,
    limit: RESULTS_PER_SECTION,
    path: page.apiPath,
    sortBy,
    types,
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
  const neueItems = items.filter((r) => !r.editorialDate || r.editorialDate <= now);

  if (neueItems.length === 0) {
    const query = buildQuery(filter, brand);
    setRailContent(
      section,
      "zk-empty",
      query ? `Keine neuen Inhalte für "${query}" gefunden.` : "Keine neuen Inhalte gefunden.",
    );
  } else {
    const parts = [page.label];
    if (filter) {
      parts.push(filter);
    }
    if (brand) {
      parts.push(brand);
    }
    section.querySelector(".zk-section-title").textContent = `Neu: ${parts.join(" · ")}`;
    renderCards(section, neueItems, total);
  }
}

function renderVorab(section, items) {
  const now = new Date().toISOString();
  const vorabItems = items.filter((r) => r.editorialDate && r.editorialDate > now);
  if (vorabItems.length === 0) {
    section.style.display = "none";
  } else {
    section.style.display = "";
    renderCards(section, vorabItems);
  }
}

async function loadSections(token, page, filter, brand, sortBy = null, types = "page-video") {
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();
  const { signal } = activeController;

  const container = document.getElementById("zk-container");
  if (!container) {
    return;
  }

  const sectionDefs = page.sections || [];
  for (const def of sectionDefs) {
    const el = container.querySelector(`#${def.id}`);
    if (el) {
      showSkeletons(el);
      el.style.display = "";
    }
  }

  try {
    const result = await fetchNeue(token, page, filter, brand, sortBy, types, signal);
    const neueSection = container.querySelector("#zk-neue-dokus");
    const vorabSection = container.querySelector("#zk-vorab");

    if (neueSection) {
      renderNeue(neueSection, page, result.items, result.total, filter, brand);
    }
    if (vorabSection) {
      renderVorab(vorabSection, result.items);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      return;
    }
    console.error("[ZDF Klassik]", err);
    const neueSection = container.querySelector("#zk-neue-dokus");
    const vorabSection = container.querySelector("#zk-vorab");
    if (neueSection) {
      setRailContent(neueSection, "zk-error", "Inhalte konnten nicht geladen werden.");
    }
    if (vorabSection) {
      setRailContent(vorabSection, "zk-error", "");
    }
  }

  const lazySections = [
    {
      el: container.querySelector("#zk-neu-mediathek"),
      load: (s) => loadCrossPage(token, s, signal),
    },
    { el: container.querySelector("#zk-serien"), load: (s) => loadSerien(token, page, s, signal) },
  ].filter((s) => s.el);

  if (lazySections.length > 0) {
    const loaded = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const match = lazySections.find((s) => s.el === entry.target);
          if (match && !loaded.has(match.el)) {
            loaded.add(match.el);
            match.load(match.el);
            observer.unobserve(match.el);
          }
        }
      },
      { rootMargin: "200px" },
    );
    for (const s of lazySections) {
      observer.observe(s.el);
    }
  }
}

async function loadCrossPage(token, section, signal) {
  try {
    const { apiFetch, parseSearchResults } = await import("./api.js");
    const params = new URLSearchParams({
      hasVideo: "true",
      sortOrder: "desc",
      sortBy: "date",
      page: "1",
      limit: String(RESULTS_PER_SECTION),
      types: "page-video",
    });
    const data = await apiFetch(token, `/search/documents?${params}`, { signal });
    const items = parseSearchResults(data);
    const now = new Date().toISOString();
    const neueItems = items.filter((r) => !r.editorialDate || r.editorialDate <= now);
    if (neueItems.length === 0) {
      section.style.display = "none";
    } else {
      renderCards(section, neueItems, data.totalResultsCount);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      return;
    }
    console.error("[ZDF Klassik] Cross-page:", err);
    section.style.display = "none";
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
    if (err.name === "AbortError") {
      return;
    }
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
  if (!page) {
    return;
  }

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

  let activeBrand = "";
  let activeSort = null;
  let activeType = "page-video";

  const reload = () =>
    loadSections(token, page, detectActiveFilter(), activeBrand, activeSort, activeType);

  const toolbar = createToolbar({
    brands: page.brands,
    onBrandChange: (brand) => {
      activeBrand = brand;
      reload();
    },
    onSortChange: (sort) => {
      activeSort = sort;
      reload();
    },
    onTypeChange: (type) => {
      activeType = type;
      const serienSection = container.querySelector("#zk-serien");
      if (serienSection) {
        serienSection.style.display = type === "page-index" ? "none" : "";
      }
      reload();
    },
  });
  container.insertBefore(toolbar, container.firstChild);

  injectContainer(grid, container);

  await reload();
  observeFilterChanges(() => reload());
}

function tryInit(attempts = 0) {
  if (document.getElementById("zk-container")) {
    return;
  }
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
