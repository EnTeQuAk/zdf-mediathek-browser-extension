import { MS_PER_DAY } from "./config.js";

const HTML_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c]);
}

export function daysBetween(a, b) {
  return Math.round((a - b) / MS_PER_DAY);
}

export function formatDate(isoStr) {
  if (!isoStr) {
    return "";
  }
  const d = new Date(isoStr);
  const now = new Date();
  const diff = daysBetween(d, now);

  if (diff === 0) {
    return "Heute";
  }
  if (diff === 1) {
    return "Morgen";
  }
  if (diff === -1) {
    return "Gestern";
  }
  if (diff > 1 && diff <= 7) {
    return `In ${diff} Tagen`;
  }

  return d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function formatAvailability(endDate) {
  if (!endDate) {
    return null;
  }
  const end = new Date(endDate);
  const daysLeft = daysBetween(end, new Date());

  if (daysLeft < 0) {
    return null;
  }
  if (daysLeft <= 3) {
    return {
      text: `Noch ${daysLeft} Tag${daysLeft !== 1 ? "e" : ""}`,
      soon: true,
    };
  }

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

export function formatDuration(seconds) {
  if (!seconds) {
    return null;
  }
  const min = Math.round(seconds / 60);
  if (min < 60) {
    return `${min} min`;
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}:${String(m).padStart(2, "0")} Std` : `${h} Std`;
}
