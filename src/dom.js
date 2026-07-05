export function findGridContainer() {
  // Strategy 1: Find the category tab bar and inject right after it.
  // The tabs filter our sections too, so we should appear below them.
  // Walk up from the tablist through single-child wrappers until we
  // reach a parent with multiple children (the content area).
  const tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    let el = tablist;
    while (el.parentElement) {
      if (el.parentElement.tagName === "MAIN" || el.parentElement.children.length > 1) {
        if (el.nextElementSibling) {
          return { before: el.nextElementSibling };
        }
        return { parent: el.parentElement };
      }
      el = el.parentElement;
    }
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
