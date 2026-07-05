import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCard } from "../src/cards.js";

function makeItem(overrides = {}) {
  return {
    title: "Test Doku",
    description: "A test documentary",
    editorialDate: "2026-07-01T10:00:00Z",
    endDate: "2027-01-01T00:00:00Z",
    duration: 2700,
    contentType: "episode",
    category: "Dokumentation",
    url: "https://www.zdf.de/doku/test",
    imagePortrait: "https://img.zdf.de/portrait.jpg",
    imageLandscape: "https://img.zdf.de/landscape.jpg",
    ...overrides,
  };
}

describe("createCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an anchor element", () => {
    const card = createCard(makeItem(), Date.now());
    expect(card.tagName).toBe("A");
    expect(card.className).toBe("zk-card");
    expect(card.href).toBe("https://www.zdf.de/doku/test");
  });

  it("renders an image with portrait source", () => {
    const card = createCard(makeItem(), Date.now());
    const img = card.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.src).toBe("https://img.zdf.de/portrait.jpg");
    expect(img.loading).toBe("lazy");
  });

  it("falls back to landscape image when portrait is empty", () => {
    const card = createCard(makeItem({ imagePortrait: "" }), Date.now());
    const img = card.querySelector("img");
    expect(img.src).toBe("https://img.zdf.de/landscape.jpg");
  });

  it("renders no image when both are empty", () => {
    const card = createCard(makeItem({ imagePortrait: "", imageLandscape: "" }), Date.now());
    const img = card.querySelector("img");
    expect(img).toBeNull();
  });

  it("renders the title overlay", () => {
    const card = createCard(makeItem({ title: "Mein Titel" }), Date.now());
    const overlay = card.querySelector(".zk-card-title-overlay");
    expect(overlay.textContent).toBe("Mein Titel");
  });

  it("escapes HTML in title", () => {
    const card = createCard(makeItem({ title: '<script>alert("xss")</script>' }), Date.now());
    const overlay = card.querySelector(".zk-card-title-overlay");
    expect(overlay.innerHTML).not.toContain("<script>");
    expect(overlay.textContent).toContain("<script>");
  });

  it("renders duration pill", () => {
    const card = createCard(makeItem({ duration: 2700 }), Date.now());
    const dur = card.querySelector(".zk-card-duration");
    expect(dur.textContent).toBe("45 min");
  });

  it("omits duration pill when duration is null", () => {
    const card = createCard(makeItem({ duration: null }), Date.now());
    const dur = card.querySelector(".zk-card-duration");
    expect(dur).toBeNull();
  });

  it("renders category and date in meta", () => {
    const card = createCard(makeItem(), Date.now());
    const meta = card.querySelector(".zk-card-meta");
    expect(meta.textContent).toContain("Dokumentation");
    expect(meta.textContent).toContain("·");
  });

  describe("badge logic", () => {
    it("shows 'Vorab' badge for future editorial date", () => {
      const card = createCard(makeItem({ editorialDate: "2026-07-10T10:00:00Z" }), Date.now());
      const badge = card.querySelector(".zk-card-badge--vorab");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Vorab");
    });

    it("shows 'Neu' badge for content within 3 days", () => {
      const card = createCard(makeItem({ editorialDate: "2026-07-03T10:00:00Z" }), Date.now());
      const badge = card.querySelector(".zk-card-badge--neu");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Neu");
    });

    it("shows no 'Neu' badge for content older than 3 days", () => {
      const card = createCard(makeItem({ editorialDate: "2026-06-20T10:00:00Z" }), Date.now());
      const badge = card.querySelector(".zk-card-badge--neu");
      expect(badge).toBeNull();
    });

    it("shows 'Läuft ab' badge for content expiring within 3 days", () => {
      const card = createCard(
        makeItem({
          editorialDate: "2026-06-01T10:00:00Z",
          endDate: "2026-07-07T12:00:00Z",
        }),
        Date.now(),
      );
      const badge = card.querySelector(".zk-card-badge--expiring");
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe("Läuft ab");
    });

    it("prioritizes Vorab over other badges", () => {
      const card = createCard(
        makeItem({
          editorialDate: "2026-07-10T10:00:00Z",
          endDate: "2026-07-07T12:00:00Z",
        }),
        Date.now(),
      );
      const vorab = card.querySelector(".zk-card-badge--vorab");
      const expiring = card.querySelector(".zk-card-badge--expiring");
      expect(vorab).not.toBeNull();
      expect(expiring).toBeNull();
    });

    it("shows no badge for old content not expiring soon", () => {
      const card = createCard(
        makeItem({
          editorialDate: "2026-05-01T10:00:00Z",
          endDate: "2027-01-01T00:00:00Z",
        }),
        Date.now(),
      );
      const badges = card.querySelectorAll(".zk-card-badge");
      expect(badges).toHaveLength(0);
    });
  });
});
