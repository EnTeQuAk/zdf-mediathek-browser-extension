export function findGridContainer() {
  // Strategy 1: Inject before the first tabpanel, right after the tab bar.
  // ZDF uses Radix Tabs: region (tab bar) + tabpanels are siblings inside
  // #tab-navigation. Injecting before the first tabpanel places our
  // sections below the category filter that controls them.
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
