(function () {
  "use strict";

  const API_BASE = "https://api.zdf.de";
  const DOKU_PATH = "/zdf/dokumentation";
  const RESULTS_PER_SECTION = 30;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const CATEGORIES = [
    "Geschichte", "Gesellschaft", "Kultur", "Politik", "Sport",
    "Reise", "Natur", "True Crime", "Wirtschaft", "Stars",
    "Wissen", "Musik", "Gesundheit",
  ];

  let apiToken = null;

  function extractApiToken() {
    for (const script of document.querySelectorAll("script")) {
      const text = script.textContent;
      const escaped = text.match(/apiToken\\":\\"([^\\]+)\\"/);
      if (escaped) return escaped[1];
      const plain = text.match(/"apiToken":"([^"]+)"/);
      if (plain) return plain[1];
    }
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

  function daysBetween(a, b) {
    return Math.round((a - b) / MS_PER_DAY);
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    const now = new Date();
    const diff = daysBetween(d, now);

    if (diff === 0) return "Heute";
    if (diff === 1) return "Morgen";
    if (diff === -1) return "Gestern";
    if (diff > 1 && diff <= 7) return `In ${diff} Tagen`;

    return d.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }

  function formatAvailability(endDate) {
    if (!endDate) return null;
    const end = new Date(endDate);
    const daysLeft = daysBetween(end, new Date());

    if (daysLeft < 0) return null;
    if (daysLeft <= 3)
      return {
        text: `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""}`,
        soon: true,
      };

    const includeYear = daysLeft > 30;
    return {
      text: `Bis ${end.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
        year: includeYear ? "numeric" : undefined,
      })}`,
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

  const HTML_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]);
  }

  function badge(modifier, label) {
    return `<span class="zk-card-badge zk-card-badge--${modifier}">${label}</span>`;
  }

  function createCard(item, nowMs) {
    const card = document.createElement("a");
    card.className = "zk-card";
    card.href = item.url;

    const edMs = item.editorialDate ? new Date(item.editorialDate).getTime() : 0;
    const isVorab = edMs > nowMs;
    const availability = formatAvailability(item.endDate);
    const duration = formatDuration(item.duration);
    const isNeu = edMs > 0 && !isVorab && (nowMs - edMs) / MS_PER_DAY <= 3;

    const img = item.imagePortrait || item.imageLandscape;

    let badgeHtml = "";
    if (isVorab) badgeHtml = badge("vorab", "Vorab");
    else if (availability?.soon) badgeHtml = badge("expiring", "Läuft ab");
    else if (isNeu) badgeHtml = badge("neu", "Neu");

    card.innerHTML = `
      <div class="zk-card-image">
        ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy">` : ""}
        ${badgeHtml}
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

  function setRailContent(section, className, html) {
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

  function renderCards(section, items, total) {
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

    const main = document.querySelector("main");
    if (main && main.firstElementChild) {
      return { parent: main.firstElementChild };
    }

    return null;
  }

  function detectActiveFilter() {
    const url = window.location.href;
    const hashMatch = url.match(/[#?].*filter=([^&]+)/);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);

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

    const allButtons = document.querySelectorAll("button");
    for (const btn of allButtons) {
      const text = btn.textContent.trim();
      if (!CATEGORIES.includes(text)) continue;
      const style = window.getComputedStyle(btn);
      const borderBottom = style.borderBottomColor;
      if (
        borderBottom &&
        borderBottom !== "rgba(0, 0, 0, 0)" &&
        borderBottom !== "transparent"
      ) {
        return text;
      }
    }

    return "";
  }

  async function loadSections(expectedFilter) {
    const container = document.getElementById("zk-container");
    if (!container) return;

    const neueDokus = container.querySelector("#zk-neue-dokus");
    const vorab = container.querySelector("#zk-vorab");

    setRailContent(neueDokus, "zk-loading",
      '<div class="zk-loading-spinner"></div><span>Lade Inhalte…</span>');
    if (vorab) {
      setRailContent(vorab, "zk-loading",
        '<div class="zk-loading-spinner"></div><span>Lade Inhalte…</span>');
    }

    const now = new Date().toISOString();

    try {
      const result = await fetchDokus({ query: expectedFilter, limit: RESULTS_PER_SECTION });
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

  function observeFilterChanges() {
    let lastFilter = "";
    let debounceTimer = null;

    const check = () => {
      debounceTimer = null;
      const filter = detectActiveFilter();
      if (filter !== lastFilter) {
        lastFilter = filter;
        loadSections(filter);
      }
    };

    const scheduleCheck = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, 300);
    };

    document.body.addEventListener("click", scheduleCheck);
    window.addEventListener("popstate", scheduleCheck);

    const main = document.querySelector("main");
    if (main) {
      const observer = new MutationObserver(scheduleCheck);
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

    const filter = detectActiveFilter();
    await loadSections(filter);
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

  if (document.readyState !== "loading") {
    setTimeout(tryInit, 300);
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      setTimeout(tryInit, 300)
    );
  }
})();
