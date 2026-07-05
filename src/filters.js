import { CATEGORIES } from "./config.js";

export function detectActiveFilter() {
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

export function observeFilterChanges(onFilterChange) {
  let lastFilter = "";
  let debounceTimer = null;

  const check = () => {
    debounceTimer = null;
    const filter = detectActiveFilter();
    if (filter !== lastFilter) {
      lastFilter = filter;
      onFilterChange(filter);
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
