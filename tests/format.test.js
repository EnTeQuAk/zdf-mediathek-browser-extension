import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeHtml,
  daysBetween,
  formatDate,
  formatAvailability,
  formatDuration,
} from "../src/format.js";

describe("escapeHtml", () => {
  it("escapes all special HTML characters", () => {
    expect(escapeHtml("&<>\"'")).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World 123")).toBe("Hello World 123");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("escapes characters within a sentence", () => {
    expect(escapeHtml('Tom & Jerry: "Best <Friends>"')).toBe(
      "Tom &amp; Jerry: &quot;Best &lt;Friends&gt;&quot;",
    );
  });
});

describe("daysBetween", () => {
  it("returns 0 for same timestamp", () => {
    const now = Date.now();
    expect(daysBetween(now, now)).toBe(0);
  });

  it("returns positive for future date", () => {
    const now = Date.now();
    const threeDaysLater = now + 3 * 86400000;
    expect(daysBetween(threeDaysLater, now)).toBe(3);
  });

  it("returns negative for past date", () => {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 86400000;
    expect(daysBetween(twoDaysAgo, now)).toBe(-2);
  });

  it("rounds to nearest day", () => {
    const now = Date.now();
    const almostTwoDays = now + 1.6 * 86400000;
    expect(daysBetween(almostTwoDays, now)).toBe(2);
  });
});

describe("formatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty string for falsy input", () => {
    expect(formatDate("")).toBe("");
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
  });

  it("returns 'Heute' for today", () => {
    expect(formatDate("2026-07-05T08:00:00Z")).toBe("Heute");
  });

  it("returns 'Gestern' for yesterday", () => {
    expect(formatDate("2026-07-04T08:00:00Z")).toBe("Gestern");
  });

  it("returns 'Morgen' for tomorrow", () => {
    expect(formatDate("2026-07-06T12:00:00Z")).toBe("Morgen");
  });

  it("returns 'In N Tagen' for 2-7 days in future", () => {
    expect(formatDate("2026-07-08T12:00:00Z")).toBe("In 3 Tagen");
    expect(formatDate("2026-07-12T12:00:00Z")).toBe("In 7 Tagen");
  });

  it("returns localized date for older dates in same year", () => {
    const result = formatDate("2026-03-15T12:00:00Z");
    expect(result).toContain("15");
    expect(result).toContain("Mär");
  });

  it("includes year for dates in different year", () => {
    const result = formatDate("2025-12-01T12:00:00Z");
    expect(result).toContain("2025");
  });
});

describe("formatAvailability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for falsy input", () => {
    expect(formatAvailability("")).toBeNull();
    expect(formatAvailability(null)).toBeNull();
    expect(formatAvailability(undefined)).toBeNull();
  });

  it("returns null for already-expired content", () => {
    expect(formatAvailability("2026-07-01T00:00:00Z")).toBeNull();
  });

  it("returns soon=true for content expiring within 3 days", () => {
    const result = formatAvailability("2026-07-07T12:00:00Z");
    expect(result.soon).toBe(true);
    expect(result.text).toContain("Noch 2 Tag");
  });

  it("uses singular 'Tag' for 1 day", () => {
    const result = formatAvailability("2026-07-06T12:00:00Z");
    expect(result.soon).toBe(true);
    expect(result.text).toBe("Noch 1 Tag");
  });

  it("returns soon=false for content expiring later", () => {
    const result = formatAvailability("2026-08-10T12:00:00Z");
    expect(result.soon).toBe(false);
    expect(result.text).toMatch(/^Bis/);
  });

  it("includes year when more than 30 days out", () => {
    const result = formatAvailability("2027-03-01T12:00:00Z");
    expect(result.soon).toBe(false);
    expect(result.text).toContain("2027");
  });
});

describe("formatDuration", () => {
  it("returns null for falsy input", () => {
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(undefined)).toBeNull();
  });

  it("formats minutes for durations under 60 min", () => {
    expect(formatDuration(300)).toBe("5 min");
    expect(formatDuration(2700)).toBe("45 min");
  });

  it("rounds to nearest minute", () => {
    expect(formatDuration(89)).toBe("1 min");
    expect(formatDuration(150)).toBe("3 min");
  });

  it("formats hours and minutes for longer durations", () => {
    expect(formatDuration(5400)).toBe("1:30 Std");
    expect(formatDuration(7200)).toBe("2 Std");
    expect(formatDuration(3660)).toBe("1:01 Std");
  });

  it("omits minutes when exactly on the hour", () => {
    expect(formatDuration(3600)).toBe("1 Std");
    expect(formatDuration(7200)).toBe("2 Std");
  });
});
