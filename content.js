(function () {
  "use strict";

  const API_BASE = "https://api.zdf.de";
  const DOKU_PATH = "/zdf/dokumentation";
  const RESULTS_PER_SECTION = 30;

  let currentFilter = "";
  let apiToken = null;

  function extractApiToken() {
    const html = document.documentElement.innerHTML;
    const escaped = html.match(/apiToken\\":\\"([^\\]+)\\"/);
    if (escaped) return escaped[1];
    const plain = html.match(/"apiToken":"([^"]+)"/);
    if (plain) return plain[1];
    return null;
  }

  async function apiFetch(path) {
    if (!apiToken) return null;
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { "Api-Auth": `Bearer ${apiToken}` },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
    return res.json();
  }

  async function fetchDokus({ query = "", limit = RESULTS_PER_SECTION } = {}) {
    const params = new URLSearchParams({
      q: query,
      hasVideo: "true",
      sortOrder: "desc",
      sortBy: "date",
      paths: DOKU_PATH,
      page: "1",
      limit: String(limit),
      types: "page-video",
    });
    const data = await apiFetch(`/search/documents?${params}`);
    return {
      total: data.totalResultsCount || 0,
      items: parseSearchResults(data),
    };
  }

  function parseSearchResults(data) {
    const results = data["http://zdf.de/rels/search/results"] || [];
    return results.map((r) => {
      const target = r["http://zdf.de/rels/target"] || {};
      const image = target.teaserImageRef || {};
      const category = target["http://zdf.de/rels/category"] || {};
      return {
        title: target.teaserHeadline || target.title || "",
        description: target.teasertext || "",
        editorialDate: target.editorialDate || "",
        endDate: target.endDate || "",
        duration: target.duration || null,
        contentType: target.contentType || "",
        category: category.title || "",
        url: target.webCanonical || `https://www.zdf.de${target.self || ""}`,
        imagePortrait: pickImage(image.layouts, "portrait"),
        imageLandscape: pickImage(image.layouts, "landscape"),
      };
    });
  }

  function pickImage(layouts, mode) {
    if (!layouts) return "";
    if (mode === "portrait") {
      return (
        layouts["276x311"] ||
        layouts["240x270"] ||
        layouts["640x720"] ||
        layouts["225x400"] ||
        layouts["384x216"] ||
        ""
      );
    }
    return (
      layouts["384x216"] ||
      layouts["768x432"] ||
      layouts["276x155"] ||
      ""
    );
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = d - now;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === -1) return "Gestern";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} Tagen`;

    return d.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  function formatAvailability(endDate) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const daysLeft = Math.round((end - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return null;
    if (daysLeft <= 3)
      return {
        text: `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""}`,
        soon: true,
      };
    if (daysLeft <= 30)
      return {
        text: `Bis ${end.toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`,
        soon: false,
      };
    return {
      text: `Bis ${end.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}`,
      soon: false,
    };
  }

  function formatDuration(seconds) {
    if (!seconds) return null;
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}:${String(m).padStart(2, "0")} Std` : `${h} Std`;
  }

  function isNew(editorialDate) {
    if (!editorialDate) return false;
    const d = new Date(editorialDate);
    const now = new Date();
    const diffDays = (now - d) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  }

  function escapeHtml(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
  }

  function createCard(item) {
    const card = document.createElement("a");
    card.className = "zk-card";
    card.href = item.url;

    const isVorab =
      item.editorialDate && new Date(item.editorialDate) > new Date();
    const availability = formatAvailability(item.endDate);
    const duration = formatDuration(item.duration);
    const neu = isNew(item.editorialDate);

    const img = item.imagePortrait || item.imageLandscape;

    let badge = "";
    if (isVorab) badge = '<span class="zk-card-badge zk-card-badge--vorab">Vorab</span>';
    else if (availability?.soon) badge = '<span class="zk-card-badge zk-card-badge--expiring">Läuft ab</span>';
    else if (neu) badge = '<span class="zk-card-badge zk-card-badge--neu">Neu</span>';

    card.innerHTML = `
      <div class="zk-card-image">
        ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy">` : ""}
        ${badge}
        ${duration ? `<span class="zk-card-duration">${duration}</span>` : ""}
        <div class="zk-card-gradient"></div>
        <div class="zk-card-title-overlay">${escapeHtml(item.title)}</div>
      </div>
      <div class="zk-card-body">
        <p class="zk-card-meta">${escapeHtml(item.category)}${item.editorialDate ? ` · ${formatDate(item.editorialDate)}` : ""}</p>
        ${availability ? `<p class="zk-card-availability${availability.soon ? " zk-card-availability--soon" : ""}">${availability.text}</p>` : ""}
      </div>
    `;
    return card;
  }

  function createSection(id, title) {
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

  function setLoading(section) {
    const rail = section.querySelector(".zk-rail");
    rail.innerHTML = "";
    const el = document.createElement("div");
    el.className = "zk-loading";
    el.innerHTML =
      '<div class="zk-loading-spinner"></div><span>Lade Inhalte…</span>';
    rail.appendChild(el);
  }

  function setError(section, msg) {
    const rail = section.querySelector(".zk-rail");
    rail.innerHTML = "";
    const el = document.createElement("div");
    el.className = "zk-error";
    el.textContent = msg;
    rail.appendChild(el);
  }

  function setEmpty(section, msg) {
    const rail = section.querySelector(".zk-rail");
    rail.innerHTML = "";
    const el = document.createElement("div");
    el.className = "zk-empty";
    el.textContent = msg;
    rail.appendChild(el);
  }

  function renderCards(section, items, total) {
    const rail = section.querySelector(".zk-rail");
    const countEl = section.querySelector(".zk-section-count");
    rail.innerHTML = "";
    items.forEach((item) => rail.appendChild(createCard(item)));
    if (countEl && total) {
      countEl.textContent = `${total} verfügbar`;
    }
  }

  function findGridContainer() {
    const hero = document.querySelector('[data-testid="hero"]');
    if (!hero) return null;

    // Walk up from the hero, checking for a next sibling at each level.
    // The SSR HTML nests hero and grid differently than the hydrated DOM,
    // so we check every ancestor until we hit <main>.
    let el = hero;
    while (el && el.parentElement) {
      if (el.nextElementSibling) {
        return { before: el.nextElementSibling };
      }
      if (el.parentElement.tagName === "MAIN") break;
      el = el.parentElement;
    }

    // Fallback: append to the end of main's first child
    const main = document.querySelector("main");
    if (main && main.firstElementChild) {
      return { parent: main.firstElementChild };
    }

    return null;
  }

  function detectActiveFilter() {
    // The ZDF filter tabs are buttons/links inside the page.
    // When a category is active, it typically has a different visual state.
    // We observe the URL or the active tab text.
    const url = window.location.href;
    const hashMatch = url.match(/[#?].*filter=([^&]+)/);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);

    // Try to read the active tab from the DOM
    // The filter tabs typically have an aria-selected or similar attribute
    const tabs = document.querySelectorAll(
      'button[role="tab"], [role="tablist"] button'
    );
    for (const tab of tabs) {
      if (
        tab.getAttribute("aria-selected") === "true" ||
        tab.classList.contains("active")
      ) {
        const text = tab.textContent.trim();
        if (text && text !== "Alle Inhalte") return text;
      }
    }

    // Fallback: look for an underlined or differently styled tab
    // ZDF uses a bottom border on the active filter
    const allButtons = document.querySelectorAll("button");
    for (const btn of allButtons) {
      const text = btn.textContent.trim();
      const style = window.getComputedStyle(btn);
      const borderBottom = style.borderBottomColor;
      // Active tabs have a white or orange bottom border
      if (
        borderBottom &&
        borderBottom !== "rgba(0, 0, 0, 0)" &&
        borderBottom !== "transparent"
      ) {
        const CATEGORIES = [
          "Geschichte", "Gesellschaft", "Kultur", "Politik", "Sport",
          "Reise", "Natur", "True Crime", "Wirtschaft", "Stars",
          "Wissen", "Musik", "Gesundheit",
        ];
        if (CATEGORIES.includes(text)) return text;
      }
    }

    return "";
  }

  async function loadSections() {
    const container = document.getElementById("zk-container");
    if (!container) return;

    const neueDokus = container.querySelector("#zk-neue-dokus");
    const vorab = container.querySelector("#zk-vorab");

    const filter = detectActiveFilter();
    currentFilter = filter;

    setLoading(neueDokus);
    if (vorab) setLoading(vorab);

    const now = new Date().toISOString();

    try {
      const result = await fetchDokus({ query: filter, limit: RESULTS_PER_SECTION });
      // If the filter changed while we were loading, discard
      if (detectActiveFilter() !== currentFilter) return;

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
        setEmpty(
          neueDokus,
          filter
            ? `Keine neuen Dokus in "${filter}" gefunden.`
            : "Keine neuen Dokus gefunden."
        );
      } else {
        const title = filter ? `Neue Dokus: ${filter}` : "Neue Dokus";
        neueDokus.querySelector(".zk-section-title").textContent = title;
        renderCards(neueDokus, neueItems, result.total);
      }
    } catch (err) {
      console.error("[ZDF Klassik]", err);
      setError(neueDokus, "Inhalte konnten nicht geladen werden.");
      if (vorab) setError(vorab, "");
    }
  }

  function observeFilterChanges() {
    // Watch for clicks on filter tabs and URL changes
    let lastFilter = "";

    const check = () => {
      const filter = detectActiveFilter();
      if (filter !== lastFilter) {
        lastFilter = filter;
        loadSections();
      }
    };

    // Click listener on the body (delegated)
    document.body.addEventListener("click", () => {
      // Delay to let React update the DOM/URL
      setTimeout(check, 300);
    });

    // Also watch for popstate (browser navigation)
    window.addEventListener("popstate", () => setTimeout(check, 300));

    // MutationObserver on the main content area for React re-renders
    const main = document.querySelector("main");
    if (main) {
      const observer = new MutationObserver(() => {
        setTimeout(check, 200);
      });
      observer.observe(main, { childList: true, subtree: false });
    }
  }

  async function init() {
    if (document.getElementById("zk-container")) return;

    apiToken = extractApiToken();
    if (!apiToken) {
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
    await loadSections();
    observeFilterChanges();
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

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(tryInit, 300);
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(tryInit, 300)
    );
  }
})();
