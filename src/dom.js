let tabpanelObserver = null;

export function findGridContainer() {
  // Strategy 1: Inject before the first tabpanel (replaces it visually).
  // ZDF uses Radix Tabs: region (tab bar) + tabpanels are siblings.
  const tabpanel = document.querySelector('[role="tabpanel"]');
  if (tabpanel) {
    return { before: tabpanel };
  }

  // Strategy 2: Walk up from hero, find the first ancestor with a next sibling.
  const hero = document.querySelector('[data-testid="hero"]');
  if (hero) {
    let el = hero;
    while (el && el.parentElement) {
      if (el.nextElementSibling) {
        return { before: el.nextElementSibling };
      }
      if (el.parentElement.tagName === "MAIN") {
        break;
      }
      el = el.parentElement;
    }
  }

  // Strategy 3: Find main and append after the first child (the hero wrapper).
  const main = document.querySelector("main");
  if (main && main.firstElementChild) {
    const firstChild = main.firstElementChild;
    if (firstChild.nextElementSibling) {
      return { before: firstChild.nextElementSibling };
    }
    return { parent: firstChild };
  }

  return null;
}

export function injectContainer(grid, container) {
  if (grid.before) {
    grid.before.parentNode.insertBefore(container, grid.before);
  } else {
    grid.parent.appendChild(container);
  }
}

export function hideNativeContent() {
  const tabpanels = document.querySelectorAll('[role="tabpanel"]');
  for (const panel of tabpanels) {
    panel.style.display = "none";
  }
}

export function restoreNativeContent() {
  const tabpanels = document.querySelectorAll('[role="tabpanel"]');
  for (const panel of tabpanels) {
    panel.style.display = "";
  }
  stopTabpanelObserver();
}

export function observeTabpanelMutations() {
  stopTabpanelObserver();

  const tabNav = document.getElementById("tab-navigation");
  if (!tabNav) {
    return;
  }

  tabpanelObserver = new MutationObserver(() => {
    hideNativeContent();
  });
  tabpanelObserver.observe(tabNav, { childList: true, subtree: true });
}

function stopTabpanelObserver() {
  if (tabpanelObserver) {
    tabpanelObserver.disconnect();
    tabpanelObserver = null;
  }
}
