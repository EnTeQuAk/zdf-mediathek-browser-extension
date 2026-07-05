import { describe, it, expect } from "vitest";
import { parseSearchResults, pickImage } from "../src/api.js";

const FIXTURE = {
  totalResultsCount: 42,
  "http://zdf.de/rels/search/results": [
    {
      "http://zdf.de/rels/target": {
        teaserHeadline: "Test Documentary",
        title: "Fallback Title",
        teasertext: "A description",
        editorialDate: "2026-07-01T10:00:00Z",
        endDate: "2027-01-01T00:00:00Z",
        duration: 2700,
        contentType: "episode",
        webCanonical: "https://www.zdf.de/doku/test",
        self: "/doku/test",
        teaserImageRef: {
          layouts: {
            "276x311": "https://img.zdf.de/276x311.jpg",
            "384x216": "https://img.zdf.de/384x216.jpg",
            "768x432": "https://img.zdf.de/768x432.jpg",
          },
        },
        "http://zdf.de/rels/category": {
          title: "Dokumentation",
        },
      },
    },
    {
      "http://zdf.de/rels/target": {
        title: "Minimal Item",
        teaserImageRef: {},
        "http://zdf.de/rels/category": {},
      },
    },
  ],
};

describe("parseSearchResults", () => {
  it("maps full API response to item objects", () => {
    const items = parseSearchResults(FIXTURE);
    expect(items).toHaveLength(2);

    const first = items[0];
    expect(first.title).toBe("Test Documentary");
    expect(first.description).toBe("A description");
    expect(first.editorialDate).toBe("2026-07-01T10:00:00Z");
    expect(first.endDate).toBe("2027-01-01T00:00:00Z");
    expect(first.duration).toBe(2700);
    expect(first.contentType).toBe("episode");
    expect(first.category).toBe("Dokumentation");
    expect(first.url).toBe("https://www.zdf.de/doku/test");
    expect(first.imagePortrait).toBe("https://img.zdf.de/276x311.jpg");
    expect(first.imageLandscape).toBe("https://img.zdf.de/384x216.jpg");
  });

  it("uses teaserHeadline over title", () => {
    const items = parseSearchResults(FIXTURE);
    expect(items[0].title).toBe("Test Documentary");
  });

  it("falls back to title when teaserHeadline is missing", () => {
    const items = parseSearchResults(FIXTURE);
    expect(items[1].title).toBe("Minimal Item");
  });

  it("handles missing fields gracefully", () => {
    const items = parseSearchResults(FIXTURE);
    const minimal = items[1];
    expect(minimal.description).toBe("");
    expect(minimal.editorialDate).toBe("");
    expect(minimal.endDate).toBe("");
    expect(minimal.duration).toBeNull();
    expect(minimal.category).toBe("");
    expect(minimal.imagePortrait).toBe("");
    expect(minimal.imageLandscape).toBe("");
  });

  it("builds URL from self when webCanonical is missing", () => {
    const data = {
      "http://zdf.de/rels/search/results": [
        {
          "http://zdf.de/rels/target": {
            title: "No Canonical",
            self: "/path/to/video",
            teaserImageRef: {},
            "http://zdf.de/rels/category": {},
          },
        },
      ],
    };
    const items = parseSearchResults(data);
    expect(items[0].url).toBe("https://www.zdf.de/path/to/video");
  });

  it("returns empty array for missing results key", () => {
    const items = parseSearchResults({});
    expect(items).toEqual([]);
  });
});

describe("pickImage", () => {
  const layouts = {
    "276x311": "portrait-276.jpg",
    "240x270": "portrait-240.jpg",
    "640x720": "portrait-640.jpg",
    "384x216": "landscape-384.jpg",
    "768x432": "landscape-768.jpg",
    "276x155": "landscape-276.jpg",
  };

  it("returns empty string for null/undefined layouts", () => {
    expect(pickImage(null, "portrait")).toBe("");
    expect(pickImage(undefined, "landscape")).toBe("");
  });

  it("picks portrait images in priority order", () => {
    expect(pickImage(layouts, "portrait")).toBe("portrait-276.jpg");
    expect(pickImage({ "240x270": "a.jpg" }, "portrait")).toBe("a.jpg");
    expect(pickImage({ "640x720": "b.jpg" }, "portrait")).toBe("b.jpg");
  });

  it("falls back to landscape size for portrait if nothing else", () => {
    expect(pickImage({ "384x216": "land.jpg" }, "portrait")).toBe("land.jpg");
  });

  it("picks landscape images in priority order", () => {
    expect(pickImage(layouts, "landscape")).toBe("landscape-384.jpg");
    expect(pickImage({ "768x432": "a.jpg" }, "landscape")).toBe("a.jpg");
    expect(pickImage({ "276x155": "b.jpg" }, "landscape")).toBe("b.jpg");
  });

  it("returns empty string when no matching layout exists", () => {
    expect(pickImage({ "100x100": "tiny.jpg" }, "portrait")).toBe("");
    expect(pickImage({ "100x100": "tiny.jpg" }, "landscape")).toBe("");
  });
});
