export function findGridContainer() {
  // Strategy 1: Walk up from hero, find the first ancestor with a next sibling.
  // Handles both SSR (hero and grid are siblings under main) and hydrated DOM
  // (hero and grid are nested inside a wrapper div).
  const hero = document.querySelector('[data-testid="hero"]');
  if (hero) {
    let el = hero;
    while (el && el.parentElement) {
      if (el.nextElementSibling) {
        let target = el.nextElementSibling;
        // If the next sibling contains the category tab bar, inject
        // after it so our sections sit below the filter they respond to.
        if (target.querySelector('[role="tablist"]') && target.nextElementSibling) {
          target = target.nextElementSibling;
        }
        return { before: target };
      }
      if (el.parentElement.tagName === "MAIN") {
        break;
      }
      el = el.parentElement;
    }
  }

  // Strategy 2: Find main and append after the first child (the hero wrapper).
  // Covers pages where the hero element isn't marked with data-testid.
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
