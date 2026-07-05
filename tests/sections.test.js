import { describe, it, expect } from "vitest";
import { createSection, setRailContent } from "../src/sections.js";

describe("createSection", () => {
  it("creates a section with the given id and title", () => {
    const section = createSection("zk-test", "Test Section");
    expect(section.tagName).toBe("SECTION");
    expect(section.id).toBe("zk-test");
    expect(section.className).toBe("zk-section");
  });

  it("has a title element", () => {
    const section = createSection("zk-test", "My Title");
    const title = section.querySelector(".zk-section-title");
    expect(title.textContent).toBe("My Title");
    expect(title.tagName).toBe("H2");
  });

  it("has a count element", () => {
    const section = createSection("zk-test", "Title");
    const count = section.querySelector(".zk-section-count");
    expect(count).not.toBeNull();
    expect(count.textContent).toBe("");
  });

  it("has an empty rail element", () => {
    const section = createSection("zk-test", "Title");
    const rail = section.querySelector(".zk-rail");
    expect(rail).not.toBeNull();
    expect(rail.children).toHaveLength(0);
  });
});

describe("setRailContent", () => {
  it("sets text content for plain strings", () => {
    const section = createSection("zk-test", "Title");
    setRailContent(section, "zk-empty", "No results");
    const rail = section.querySelector(".zk-rail");
    expect(rail.children).toHaveLength(1);
    expect(rail.firstChild.className).toBe("zk-empty");
    expect(rail.firstChild.textContent).toBe("No results");
  });

  it("sets innerHTML for HTML strings", () => {
    const section = createSection("zk-test", "Title");
    setRailContent(section, "zk-loading", '<span class="spinner"></span>');
    const rail = section.querySelector(".zk-rail");
    const inner = rail.querySelector(".spinner");
    expect(inner).not.toBeNull();
  });

  it("clears previous content", () => {
    const section = createSection("zk-test", "Title");
    setRailContent(section, "zk-loading", "Loading...");
    setRailContent(section, "zk-empty", "Empty");
    const rail = section.querySelector(".zk-rail");
    expect(rail.children).toHaveLength(1);
    expect(rail.firstChild.textContent).toBe("Empty");
  });
});
