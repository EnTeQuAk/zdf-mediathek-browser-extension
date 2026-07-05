import { describe, it, expect, beforeEach } from "vitest";
import {
  createGrid,
  renderGridCards,
  showGridSkeletons,
  clearGrid,
  setGridMessage,
  updateGridCount,
} from "../src/grid.js";

function makeItem(overrides = {}) {
  return {
    title: "Test Title",
    description: "desc",
    editorialDate: "2025-01-01T10:00:00Z",
    endDate: "",
    duration: 3600,
    contentType: "video",
    category: "Doku",
    url: "https://www.zdf.de/test",
    imagePortrait: "https://img.zdf.de/portrait.jpg",
    imageLandscape: "https://img.zdf.de/landscape.jpg",
    ...overrides,
  };
}

describe("createGrid", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a section with grid, header, and footer", () => {
    const section = createGrid("zk-main-grid");
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("zk-main-grid");
    expect(section.className).toBe("zk-grid-section");
    expect(section.querySelector(".zk-grid")).not.toBeNull();
    expect(section.querySelector(".zk-grid-header")).not.toBeNull();
    expect(section.querySelector(".zk-grid-footer")).not.toBeNull();
  });

  it("contains a count element in the header", () => {
    const section = createGrid("test");
    const count = section.querySelector(".zk-grid-count");
    expect(count).not.toBeNull();
    expect(count.textContent).toBe("");
  });
});

describe("renderGridCards", () => {
  let section;

  beforeEach(() => {
    document.body.innerHTML = "";
    section = createGrid("test");
    document.body.appendChild(section);
  });

  it("renders items as landscape cards into the grid", () => {
    const items = [makeItem({ title: "Card 1" }), makeItem({ title: "Card 2" })];
    renderGridCards(section, items);

    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(2);
    expect(grid.children[0].classList.contains("zk-card--landscape")).toBe(true);
    expect(grid.children[0].href).toContain("/test");
  });

  it("replaces existing content when append is false", () => {
    renderGridCards(section, [makeItem()]);
    renderGridCards(section, [makeItem(), makeItem()]);

    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(2);
  });

  it("appends to existing content when append is true", () => {
    renderGridCards(section, [makeItem()]);
    renderGridCards(section, [makeItem(), makeItem()], true);

    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(3);
  });
});

describe("showGridSkeletons", () => {
  let section;

  beforeEach(() => {
    section = createGrid("test");
    document.body.appendChild(section);
  });

  it("renders 12 skeleton cards by default", () => {
    showGridSkeletons(section);
    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(12);
    expect(grid.children[0].className).toBe("zk-grid-skeleton-card");
  });

  it("renders custom count of skeletons", () => {
    showGridSkeletons(section, 6);
    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(6);
  });

  it("clears previous content", () => {
    renderGridCards(section, [makeItem()]);
    showGridSkeletons(section);
    const grid = section.querySelector(".zk-grid");
    expect(grid.querySelector(".zk-card")).toBeNull();
  });
});

describe("clearGrid", () => {
  it("removes all children from the grid", () => {
    const section = createGrid("test");
    document.body.appendChild(section);
    renderGridCards(section, [makeItem(), makeItem()]);

    clearGrid(section);
    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(0);
  });
});

describe("setGridMessage", () => {
  it("displays a message element in the grid", () => {
    const section = createGrid("test");
    document.body.appendChild(section);

    setGridMessage(section, "zk-empty", "Keine Ergebnisse");
    const grid = section.querySelector(".zk-grid");
    expect(grid.children.length).toBe(1);
    expect(grid.children[0].className).toBe("zk-empty");
    expect(grid.children[0].textContent).toBe("Keine Ergebnisse");
  });
});

describe("updateGridCount", () => {
  it("displays current and total count", () => {
    const section = createGrid("test");
    updateGridCount(section, 12, 42);
    expect(section.querySelector(".zk-grid-count").textContent).toBe("12 von 42");
  });

  it("clears count when total is 0", () => {
    const section = createGrid("test");
    updateGridCount(section, 0, 0);
    expect(section.querySelector(".zk-grid-count").textContent).toBe("");
  });
});
