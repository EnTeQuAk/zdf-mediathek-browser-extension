import { describe, it, expect, beforeEach } from "vitest";
import { detectActiveFilter } from "../src/filters.js";

describe("detectActiveFilter", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    window.location.href = "https://www.zdf.de/dokus";
  });

  it("returns empty string when no filter is active", () => {
    expect(detectActiveFilter()).toBe("");
  });

  it("extracts filter from URL query parameter", () => {
    window.location.href = "https://www.zdf.de/dokus?filter=Natur";
    expect(detectActiveFilter()).toBe("Natur");
  });

  it("extracts filter from URL hash parameter", () => {
    window.location.href = "https://www.zdf.de/dokus#filter=Geschichte";
    expect(detectActiveFilter()).toBe("Geschichte");
  });

  it("decodes URL-encoded filter values", () => {
    window.location.href = "https://www.zdf.de/dokus?filter=True%20Crime";
    expect(detectActiveFilter()).toBe("True Crime");
  });

  it("detects selected tab via aria-selected", () => {
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab" aria-selected="false">Alle Inhalte</button>
        <button role="tab" aria-selected="true">Natur</button>
        <button role="tab" aria-selected="false">Politik</button>
      </div>
    `;
    expect(detectActiveFilter()).toBe("Natur");
  });

  it("ignores 'Alle Inhalte' as a filter", () => {
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab" aria-selected="true">Alle Inhalte</button>
      </div>
    `;
    expect(detectActiveFilter()).toBe("");
  });

  it("detects active class on tab buttons", () => {
    document.body.innerHTML = `
      <div role="tablist">
        <button>Alle Inhalte</button>
        <button class="active">Geschichte</button>
      </div>
    `;
    expect(detectActiveFilter()).toBe("Geschichte");
  });

  it("prefers URL filter over aria-selected", () => {
    window.location.href = "https://www.zdf.de/dokus?filter=Wissen";
    document.body.innerHTML = `
      <div role="tablist">
        <button role="tab" aria-selected="true">Natur</button>
      </div>
    `;
    expect(detectActiveFilter()).toBe("Wissen");
  });
});
