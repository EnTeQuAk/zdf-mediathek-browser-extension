import { API_BASE, RESULTS_PER_SECTION } from "./config.js";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export function extractApiToken() {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent;
    const escaped = text.match(/apiToken\\":\\"([^\\]+)\\"/);
    if (escaped) {
      return escaped[1];
    }
    const plain = text.match(/"apiToken":"([^"]+)"/);
    if (plain) {
      return plain[1];
    }
  }
  return null;
}

function isAuthError(status) {
  return status === 401 || status === 403;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(token, path, { signal } = {}) {
  if (!token) {
    return null;
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }
    try {
      const res = await fetch(url, {
        headers: { "Api-Auth": `Bearer ${token}` },
        signal,
      });
      if (isAuthError(res.status)) {
        const newToken = extractApiToken();
        if (newToken && newToken !== token) {
          token = newToken;
          continue;
        }
        throw new Error(`API ${res.status}: ${url}`);
      }
      if (!res.ok) {
        throw new Error(`API ${res.status}: ${url}`);
      }
      return res.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw err;
      }
      lastError = err;
      if (attempt === MAX_RETRIES) {
        break;
      }
    }
  }
  throw lastError;
}

export async function fetchContent(
  token,
  { query = "", limit = RESULTS_PER_SECTION, path, signal, sortBy = "date" } = {},
) {
  const params = new URLSearchParams({
    q: query,
    hasVideo: "true",
    sortOrder: "desc",
    sortBy,
    paths: path,
    page: "1",
    limit: String(limit),
    types: "page-video",
  });
  const data = await apiFetch(token, `/search/documents?${params}`, { signal });
  return {
    total: data.totalResultsCount || 0,
    items: parseSearchResults(data),
  };
}

export function parseSearchResults(data) {
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

export function pickImage(layouts, mode) {
  if (!layouts) {
    return "";
  }
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
  return layouts["384x216"] || layouts["768x432"] || layouts["276x155"] || "";
}
