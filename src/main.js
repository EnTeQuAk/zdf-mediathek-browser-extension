import { RESULTS_PER_PAGE, detectCurrentPage } from "./config.js";
import { extractApiToken, fetchContent, clearCache } from "./api.js";
import { createSection, renderCards, showSkeletons } from "./sections.js";
import { createGrid, renderGridCards, showGridSkeletons, setGridMessage, updateGridCount } from "./grid.js";
import { createPaginationButton, updatePaginationState } from "./pagination.js";
import { findGridContainer, injectContainer, hideNativeContent, observeTabpanelMutations } from "./dom.js";
import { detectActiveFilter, observeFilterChanges } from "./filters.js";
import { createToolbar } from "./toolbar.js";

let activeController = null;

function buildQuery(filter, brand) {
  return [filter, brand].filter(Boolean).join(" ");
}

async function loadGrid(token, page, { filter, brand, sortBy, types, pageNum, signal }) {
  const query = buildQuery(filter, brand);
  return fetchContent(token, {
    query,
    limit: RESULTS_PER_PAGE,
    path: page.apiPath,
    sortBy,
    types,
    page: pageNum,
    signal,
  });
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

  // Vorab shelf
  const vorabSection = createSection("zk-vorab", "Vorab verfügbar");
  vorabSection.style.display = "none";
  container.appendChild(vorabSection);

  // State
  let activeBrand = "";
  let activeSort = null;
  let activeType = "page-video";
  let currentPage = 1;
  let totalResults = 0;

  // Main grid
  const gridSection = createGrid("zk-main-grid");
  const paginationWrapper = createPaginationButton(() => {
    currentPage++;
    loadNextPage();
  });
  gridSection.querySelector(".zk-grid-footer").appendChild(paginationWrapper);
  paginationWrapper.style.display = "none";

  async function loadFirstPage() {
    if (activeController) {
      activeController.abort();
    }
    activeController = new AbortController();
    const { signal } = activeController;

    currentPage = 1;
    totalResults = 0;
    showGridSkeletons(gridSection);
    showSkeletons(vorabSection);

    try {
      const result = await loadGrid(token, page, {
        filter: detectActiveFilter(),
        brand: activeBrand,
        sortBy: activeSort,
        types: activeType,
        pageNum: 1,
        signal,
      });

      totalResults = result.total;
      const now = new Date().toISOString();
      const currentItems = result.items.filter((r) => !r.editorialDate || r.editorialDate <= now);

      // Vorab: only from first page, only when showing videos
      if (activeType === "page-video") {
        renderVorab(vorabSection, result.items);
      } else {
        vorabSection.style.display = "none";
      }

      if (currentItems.length === 0) {
        const query = buildQuery(detectActiveFilter(), activeBrand);
        setGridMessage(
          gridSection,
          "zk-empty",
          query ? `Keine Inhalte für "${query}" gefunden.` : "Keine Inhalte gefunden.",
        );
        updateGridCount(gridSection, 0, 0);
      } else {
        renderGridCards(gridSection, currentItems);
        updateGridCount(gridSection, currentItems.length, totalResults);
      }

      updatePaginationState(paginationWrapper, {
        currentCount: currentItems.length,
        total: totalResults,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("[ZDF Klassik]", err);
      setGridMessage(gridSection, "zk-error", "Inhalte konnten nicht geladen werden.");
      vorabSection.style.display = "none";
    }
  }

  async function loadNextPage() {
    if (activeController) {
      activeController.abort();
    }
    activeController = new AbortController();
    const { signal } = activeController;

    try {
      const result = await loadGrid(token, page, {
        filter: detectActiveFilter(),
        brand: activeBrand,
        sortBy: activeSort,
        types: activeType,
        pageNum: currentPage,
        signal,
      });

      const now = new Date().toISOString();
      const currentItems = result.items.filter((r) => !r.editorialDate || r.editorialDate <= now);

      renderGridCards(gridSection, currentItems, true);
      const totalShown = gridSection.querySelector(".zk-grid").children.length;
      updateGridCount(gridSection, totalShown, totalResults);
      updatePaginationState(paginationWrapper, {
        currentCount: totalShown,
        total: totalResults,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("[ZDF Klassik]", err);
      currentPage--;
      updatePaginationState(paginationWrapper, {
        currentCount: gridSection.querySelector(".zk-grid").children.length,
        total: totalResults,
      });
    }
  }

  // Toolbar
  const toolbar = createToolbar({
    brands: page.brands,
    onBrandChange: (brand) => {
      activeBrand = brand;
      loadFirstPage();
    },
    onSortChange: (sort) => {
      activeSort = sort;
      loadFirstPage();
    },
    onTypeChange: (type) => {
      activeType = type;
      loadFirstPage();
    },
  });

  container.appendChild(toolbar);
  container.appendChild(gridSection);

  injectContainer(grid, container);
  hideNativeContent();
  observeTabpanelMutations();

  await loadFirstPage();
  observeFilterChanges(() => loadFirstPage());
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
      clearCache();
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
