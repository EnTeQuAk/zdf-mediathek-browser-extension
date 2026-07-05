import { describe, it, expect, beforeEach } from "vitest";
import { findGridContainer, injectContainer } from "../src/dom.js";

describe("findGridContainer", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null when no hero or main exists", () => {
    expect(findGridContainer()).toBeNull();
  });

  it("injects after tablist inside a content wrapper", () => {
    document.body.innerHTML = `
      <main>
        <div data-testid="hero">Hero</div>
        <div class="content">
          <nav><div role="tablist"><button role="tab">Alle</button></div></nav>
          <div class="grid">Grid</div>
        </div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("grid");
  });

  it("injects after tablist when tabs are a direct sibling of grid", () => {
    document.body.innerHTML = `
      <main>
        <div data-testid="hero">Hero</div>
        <div class="tabs"><div role="tablist"><button role="tab">Alle</button></div></div>
        <div class="grid">Grid</div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("grid");
  });

  it("appends to parent when tablist has no next sibling", () => {
    document.body.innerHTML = `
      <main>
        <div class="content">
          <div role="tablist"><button role="tab">Alle</button></div>
          <div class="grid">Grid</div>
        </div>
      </main>
    `;
    const result = findGridContainer();
    expect(result).not.toBeNull();
    expect(result.before.className).toBe("grid");
  });

  it("falls back to hero strategy when no tablist exists", () => {
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

  it("finds injection point when no hero or tablist exists but main has children", () => {
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
