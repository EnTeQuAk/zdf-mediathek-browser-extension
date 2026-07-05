let historyPatched = false;

function patchHistoryApi() {
  if (historyPatched) return;
  historyPatched = true;

  const script = document.createElement("script");
  script.textContent = `
    (function() {
      var orig = {
        pushState: history.pushState.bind(history),
        replaceState: history.replaceState.bind(history)
      };
      history.pushState = function() {
        orig.pushState.apply(null, arguments);
        window.dispatchEvent(new Event("zk:navigation"));
      };
      history.replaceState = function() {
        orig.replaceState.apply(null, arguments);
        window.dispatchEvent(new Event("zk:navigation"));
      };
    })();
  `;
  document.documentElement.appendChild(script);
  script.remove();
}

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

  return "";
}

export function observeFilterChanges(onFilterChange) {
  patchHistoryApi();

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
  window.addEventListener("zk:navigation", scheduleCheck);

  const main = document.querySelector("main");
  if (main) {
    const observer = new MutationObserver(scheduleCheck);
    observer.observe(main, { childList: true, subtree: false });
  }
}
