(function () {
  "use strict";

  const API_BASE = "https://api.zdf.de";
  const DOKU_PATH = "/zdf/dokumentation";
  const RESULTS_PER_SECTION = 20;

  function extractApiToken() {
    const html = document.documentElement.innerHTML;
    // Token appears as apiToken\":\"xxx\" (JSON-escaped inside script tags)
    const escaped = html.match(/apiToken\\":\\"([^\\]+)\\"/);
    if (escaped) return escaped[1];
    // Fallback: unescaped form
    const plain = html.match(/"apiToken":"([^"]+)"/);
    if (plain) return plain[1];
    return null;
  }

  async function apiFetch(path, token) {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const res = await fetch(url, {
      headers: { "Api-Auth": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
    return res.json();
  }

  async function fetchNewestDokus(token, { limit = RESULTS_PER_SECTION } = {}) {
    const params = new URLSearchParams({
      q: "",
      hasVideo: "true",
      sortOrder: "desc",
      sortBy: "date",
      paths: DOKU_PATH,
      page: "1",
      limit: String(limit),
      types: "page-video",
    });
    const data = await apiFetch(`/search/documents?${params}`, token);
    return parseSearchResults(data);
  }

  async function fetchVorabDokus(token) {
    const now = new Date().toISOString();
    const params = new URLSearchParams({
      q: "",
      hasVideo: "true",
      sortOrder: "desc",
      sortBy: "date",
      paths: DOKU_PATH,
      page: "1",
      limit: "20",
      types: "page-video",
    });
    const data = await apiFetch(`/search/documents?${params}`, token);
    const results = parseSearchResults(data);
    return results.filter((r) => r.editorialDate && r.editorialDate > now);
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
        image: pickImage(image.layouts),
        brand: extractBrand(target),
      };
    });
  }

  function pickImage(layouts) {
    if (!layouts) return "";
    return (
      layouts["384x216"] ||
      layouts["768x432"] ||
      layouts["276x155"] ||
      layouts["1280x720"] ||
      Object.values(layouts)[0] ||
      ""
    );
  }

  function extractBrand(target) {
    const brand = target["http://zdf.de/rels/brand"];
    if (brand) return brand.title || "";
    const tracking = target.trackingTitle || "";
    return "";
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
    if (daysLeft <= 3) return { text: `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""}`, soon: true };
    if (daysLeft <= 30) return { text: `Verfügbar bis ${end.toLocaleDateString("de-DE", { day: "numeric", month: "short" })}`, soon: false };
    return {
      text: `Bis ${end.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}`,
      soon: false,
    };
  }

  function formatDuration(seconds) {
    if (!seconds) return null;
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} Min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h} Std ${m} Min` : `${h} Std`;
  }

  function createCard(item) {
    const card = document.createElement("a");
    card.className = "zk-card";
    card.href = item.url;

    const isVorab = item.editorialDate && new Date(item.editorialDate) > new Date();
    const availability = formatAvailability(item.endDate);
    const duration = formatDuration(item.duration);

    card.innerHTML = `
      <div class="zk-card-image">
        ${item.image ? `<img src="${item.image}" alt="" loading="lazy">` : ""}
        ${isVorab ? '<span class="zk-card-badge zk-card-badge--vorab">Vorab</span>' : ""}
        ${availability?.soon ? '<span class="zk-card-badge zk-card-badge--expiring">Läuft ab</span>' : ""}
        ${duration ? `<span class="zk-card-duration">${duration}</span>` : ""}
      </div>
      <div class="zk-card-body">
        <p class="zk-card-title">${escapeHtml(item.title)}</p>
        <p class="zk-card-meta">${escapeHtml(item.category)}${item.editorialDate ? ` · ${formatDate(item.editorialDate)}` : ""}</p>
        ${availability ? `<p class="zk-card-availability${availability.soon ? " zk-card-availability--soon" : ""}">${availability.text}</p>` : ""}
      </div>
    `;
    return card;
  }

  function createSection(title, subtitle) {
    const section = document.createElement("section");
    section.className = "zk-section";
    section.innerHTML = `
      <div class="zk-section-header">
        <h2 class="zk-section-title">${escapeHtml(title)}</h2>
        ${subtitle ? `<span class="zk-section-subtitle">${escapeHtml(subtitle)}</span>` : ""}
      </div>
      <div class="zk-rail"></div>
    `;
    return section;
  }

  function createLoading() {
    const el = document.createElement("div");
    el.className = "zk-loading";
    el.innerHTML = '<div class="zk-loading-spinner"></div><span>Lade Inhalte...</span>';
    return el;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function findInjectionPoint() {
    const hero = document.querySelector('[data-testid="hero"]');
    if (hero) {
      let target = hero;
      while (target.parentElement && target.parentElement.tagName !== "MAIN") {
        target = target.parentElement;
      }
      return { element: target, position: "afterend" };
    }

    const main = document.querySelector("main");
    if (main && main.firstElementChild) {
      return { element: main.firstElementChild, position: "afterend" };
    }

    return null;
  }

  async function init() {
    const token = extractApiToken();
    if (!token) {
      console.warn("[ZDF Klassik] Kein API-Token gefunden");
      return;
    }

    const injection = findInjectionPoint();
    if (!injection) {
      console.warn("[ZDF Klassik] Kein Injektionspunkt gefunden");
      return;
    }

    const container = document.createElement("div");
    container.id = "zk-container";

    const neueDokusSection = createSection("Neue Dokus", "Chronologisch nach Erscheinungsdatum");
    const vorabSection = createSection("Vorab verfügbar", "Bereits vor TV-Ausstrahlung streambar");

    const neueDokusLoading = createLoading();
    neueDokusSection.querySelector(".zk-rail").appendChild(neueDokusLoading);

    const vorabLoading = createLoading();
    vorabSection.querySelector(".zk-rail").appendChild(vorabLoading);

    container.appendChild(vorabSection);

    const divider1 = document.createElement("hr");
    divider1.className = "zk-divider";
    container.appendChild(divider1);

    container.appendChild(neueDokusSection);

    const divider2 = document.createElement("hr");
    divider2.className = "zk-divider";
    container.appendChild(divider2);

    injection.element.insertAdjacentElement(injection.position, container);

    try {
      const vorabResults = await fetchVorabDokus(token);
      const vorabRail = vorabSection.querySelector(".zk-rail");
      vorabRail.innerHTML = "";

      if (vorabResults.length === 0) {
        vorabSection.style.display = "none";
        divider1.style.display = "none";
      } else {
        vorabResults.forEach((item) => vorabRail.appendChild(createCard(item)));
      }
    } catch (err) {
      console.error("[ZDF Klassik] Vorab-Fehler:", err);
      const vorabRail = vorabSection.querySelector(".zk-rail");
      vorabRail.innerHTML = '<div class="zk-error">Vorab-Inhalte konnten nicht geladen werden.</div>';
    }

    try {
      const neueDokus = await fetchNewestDokus(token);
      const neueDokusRail = neueDokusSection.querySelector(".zk-rail");
      neueDokusRail.innerHTML = "";
      neueDokus.forEach((item) => neueDokusRail.appendChild(createCard(item)));
    } catch (err) {
      console.error("[ZDF Klassik] Neue Dokus Fehler:", err);
      const neueDokusRail = neueDokusSection.querySelector(".zk-rail");
      neueDokusRail.innerHTML = '<div class="zk-error">Inhalte konnten nicht geladen werden.</div>';
    }
  }

  function tryInit(attempts = 0) {
    if (document.getElementById("zk-container")) return;
    if (findInjectionPoint()) {
      init();
      return;
    }
    if (attempts > 20) {
      console.warn("[ZDF Klassik] Gave up waiting for injection point");
      return;
    }
    setTimeout(() => tryInit(attempts + 1), 300);
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(tryInit, 300);
  } else {
    document.addEventListener("DOMContentLoaded", () => setTimeout(tryInit, 300));
  }
})();
