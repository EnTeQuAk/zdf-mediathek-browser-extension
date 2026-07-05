import { describe, it, expect, beforeEach } from "vitest";
import { detectCurrentPage, PAGES } from "../src/config.js";

describe("detectCurrentPage", () => {
  beforeEach(() => {
    // happy-dom supports setting location
    window.location.href = "https://www.zdf.de/";
  });

  it("returns page config for /dokus", () => {
    window.location.href = "https://www.zdf.de/dokus";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/dokumentation");
    expect(page.label).toBe("Dokus");
  });

  it("returns page config for /dokumentation", () => {
    window.location.href = "https://www.zdf.de/dokumentation";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/dokumentation");
  });

  it("returns page config for /wissen", () => {
    window.location.href = "https://www.zdf.de/wissen";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/wissen");
    expect(page.label).toBe("Wissen");
  });

  it("returns page config for /gesellschaft", () => {
    window.location.href = "https://www.zdf.de/gesellschaft";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/gesellschaft");
    expect(page.label).toBe("Gesellschaft");
  });

  it("returns page config for /kultur", () => {
    window.location.href = "https://www.zdf.de/kultur";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/kultur");
    expect(page.label).toBe("Kultur");
  });

  it("returns page config for /geschichte", () => {
    window.location.href = "https://www.zdf.de/geschichte";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.apiPath).toBe("/zdf/geschichte");
    expect(page.label).toBe("Geschichte");
  });

  it("matches subpaths (e.g. /dokus/natur-und-tiere)", () => {
    window.location.href = "https://www.zdf.de/dokus/natur-und-tiere";
    const page = detectCurrentPage();
    expect(page).not.toBeNull();
    expect(page.label).toBe("Dokus");
  });

  it("returns null for unsupported pages", () => {
    window.location.href = "https://www.zdf.de/nachrichten";
    expect(detectCurrentPage()).toBeNull();
  });

  it("returns null for the homepage", () => {
    window.location.href = "https://www.zdf.de/";
    expect(detectCurrentPage()).toBeNull();
  });

  it("has a PAGES entry for every supported category", () => {
    expect(PAGES.length).toBeGreaterThanOrEqual(6);
    const patterns = PAGES.map((p) => p.pattern);
    expect(patterns).toContain("/dokus");
    expect(patterns).toContain("/wissen");
    expect(patterns).toContain("/gesellschaft");
    expect(patterns).toContain("/kultur");
    expect(patterns).toContain("/geschichte");
  });
});
