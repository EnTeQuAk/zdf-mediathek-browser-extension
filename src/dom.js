export function findGridContainer() {
  const hero = document.querySelector('[data-testid="hero"]');
  if (!hero) return null;

  let el = hero;
  while (el && el.parentElement) {
    if (el.nextElementSibling) {
      return { before: el.nextElementSibling };
    }
    if (el.parentElement.tagName === "MAIN") break;
    el = el.parentElement;
  }

  const main = document.querySelector("main");
  if (main && main.firstElementChild) {
    return { parent: main.firstElementChild };
  }

  return null;
}
