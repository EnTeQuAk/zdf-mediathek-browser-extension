import { describe, it, expect, beforeEach } from "vitest";
import {
  findGridContainer,
  injectContainer,
  hideNativeContent,
  restoreNativeContent,
  observeTabpanelMutations,
} from "../src/dom.js";

describe("findGridContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null when no hero or main exists", () => {
    expect(findGridContainer()).toBeNull();
  });

  it("injects before first tabpanel (Radix Tabs structure)", () => {
    document.body.innerHTML = `
      <main>
        <div>
          <div data-testid="hero">Hero</div>
          <div id="tab-navigation">
            <div>
              <div role="region"><div role="tablist"><button role="tab">Alle</button></div></div>
              <div role="tabpanel" class="active-panel">Grid</div>
              <div role="tabpanel"></div>
            </div>
          </div>
        </div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("active-panel");
  });

  it("falls back to hero strategy when no tabpanel exists", () => {
    document.body.innerHTML = `
      <main>
        <div data-testid="hero">Hero</div>
        <div class="grid">Grid</div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("grid");
  });

  it("walks up from hero to find sibling (hydrated structure)", () => {
    document.body.innerHTML = `
      <main>
        <div class="wrapper">
          <div class="inner">
            <div data-testid="hero">Hero</div>
          </div>
          <div class="grid">Grid</div>
        </div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("grid");
  });

  it("falls back to main first child when hero has no siblings up to main", () => {
    document.body.innerHTML = `
      <main>
        <div class="single-wrapper">
          <div data-testid="hero">Hero</div>
        </div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.parent.className).toBe("single-wrapper");
  });

  it("finds injection point when no hero or tabpanel exists but main has children", () => {
    document.body.innerHTML = `
      <main>
        <div class="first">First</div>
        <div class="second">Second</div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("second");
  });
});

describe("injectContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("inserts before the target element", () => {
    document.body.innerHTML = '<main><div class="hero"></div><div class="grid"></div></main>';
    const grid = document.querySelector(".grid");
    const container = document.createElement("div");
    container.id = "zk-container";

    injectContainer({ before: grid }, container);

    const main = document.querySelector("main");
    expect(main.children[1].id).toBe("zk-container");
    expect(main.children[2].className).toBe("grid");
  });

  it("appends to parent when no before target", () => {
    document.body.innerHTML = '<main><div class="wrapper"></div></main>';
    const wrapper = document.querySelector(".wrapper");
    const container = document.createElement("div");
    container.id = "zk-container";

    injectContainer({ parent: wrapper }, container);

    expect(wrapper.lastElementChild.id).toBe("zk-container");
  });
});

describe("hideNativeContent", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("hides all tabpanel elements", () => {
    document.body.innerHTML = `
      <div role="tabpanel" class="p1">Content 1</div>
      <div role="tabpanel" class="p2">Content 2</div>
    `;
    hideNativeContent();

    const panels = document.querySelectorAll('[role="tabpanel"]');
    expect(panels[0].style.display).toBe("none");
    expect(panels[1].style.display).toBe("none");
  });

  it("does nothing when no tabpanels exist", () => {
    document.body.innerHTML = "<div>No panels</div>";
    hideNativeContent();
    expect(document.querySelector("div").style.display).toBe("");
  });
});

describe("restoreNativeContent", () => {
  it("restores display on all tabpanel elements", () => {
    document.body.innerHTML = `
      <div role="tabpanel" style="display: none">Content</div>
    `;
    restoreNativeContent();

    const panel = document.querySelector('[role="tabpanel"]');
    expect(panel.style.display).toBe("");
  });
});

describe("observeTabpanelMutations", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    restoreNativeContent();
  });

  it("does not throw when tab-navigation element is missing", () => {
    expect(() => observeTabpanelMutations()).not.toThrow();
  });

  it("re-hides tabpanels when new ones are added", async () => {
    document.body.innerHTML = '<div id="tab-navigation"></div>';
    observeTabpanelMutations();

    const tabNav = document.getElementById("tab-navigation");
    const panel = document.createElement("div");
    panel.setAttribute("role", "tabpanel");
    tabNav.appendChild(panel);

    // MutationObserver is async, wait a tick
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(panel.style.display).toBe("none");

    restoreNativeContent();
  });
});
