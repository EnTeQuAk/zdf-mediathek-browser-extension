import { MS_PER_DAY } from "./config.js";
import { escapeHtml, formatAvailability, formatDate, formatDuration } from "./format.js";

function badge(modifier, label) {
  return `<span class="zk-card-badge zk-card-badge--${modifier}">${label}</span>`;
}

export function createCard(item, nowMs, { landscape = false } = {}) {
  const card = document.createElement("a");
  card.className = landscape ? "zk-card zk-card--landscape" : "zk-card";
  card.href = item.url;

  const edMs = item.editorialDate ? new Date(item.editorialDate).getTime() : 0;
  const isVorab = edMs > nowMs;
  const availability = formatAvailability(item.endDate);
  const duration = formatDuration(item.duration);
  const isNeu = edMs > 0 && !isVorab && (nowMs - edMs) / MS_PER_DAY <= 3;

  const img = landscape
    ? item.imageLandscape || item.imagePortrait
    : item.imagePortrait || item.imageLandscape;

  let badgeHtml = "";
  if (isVorab) {
    badgeHtml = badge("vorab", "Vorab");
  } else if (availability?.soon) {
    badgeHtml = badge("expiring", "Läuft ab");
  } else if (isNeu) {
    badgeHtml = badge("neu", "Neu");
  }

  if (landscape) {
    card.innerHTML = `
      <div class="zk-card-image">
        ${img ? `<img src="${escapeHtml(img)}" alt="" loading="lazy">` : ""}
        ${badgeHtml}
        ${duration ? `<span class="zk-card-duration">${duration}</span>` : ""}
      </div>
      <div class="zk-card-body">
        <p class="zk-card-title">${escapeHtml(item.title)}</p>
        <p class="zk-card-meta">${escapeHtml(item.category)}${item.editorialDate ? ` · ${formatDate(item.editorialDate)}` : ""}</p>
        ${availability ? `<p class="zk-card-availability${availability.soon ? " zk-card-availability--soon" : ""}">${availability.text}</p>` : ""}
      </div>
    `;
  } else {
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
  }
  return card;
}
