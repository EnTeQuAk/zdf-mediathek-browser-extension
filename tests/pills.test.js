import { describe, it, expect, vi } from "vitest";
import { createPillBar } from "../src/pills.js";

describe("createPillBar", () => {
  it("returns null for empty brands", () => {
    expect(createPillBar([], vi.fn())).toBeNull();
  });

  it("returns null for null brands", () => {
    expect(createPillBar(null, vi.fn())).toBeNull();
  });

  it("creates a pill bar with 'Alle' plus brand pills", () => {
    const bar = createPillBar(["Terra X", "37 Grad"], vi.fn());
    const pills = bar.querySelectorAll(".zk-pill");
    expect(pills).toHaveLength(3);
    expect(pills[0].textContent).toBe("Alle");
    expect(pills[1].textContent).toBe("Terra X");
    expect(pills[2].textContent).toBe("37 Grad");
  });

  it("marks 'Alle' as active by default", () => {
    const bar = createPillBar(["Terra X"], vi.fn());
    const alle = bar.querySelector(".zk-pill--active");
    expect(alle.textContent).toBe("Alle");
  });

  it("calls onSelect with brand name when pill is clicked", () => {
    const onSelect = vi.fn();
    const bar = createPillBar(["Terra X", "37 Grad"], onSelect);
    const pills = bar.querySelectorAll(".zk-pill");

    pills[1].click();
    expect(onSelect).toHaveBeenCalledWith("Terra X");
  });

  it("calls onSelect with empty string when 'Alle' is clicked", () => {
    const onSelect = vi.fn();
    const bar = createPillBar(["Terra X"], onSelect);
    const pills = bar.querySelectorAll(".zk-pill");

    pills[1].click();
    pills[0].click();
    expect(onSelect).toHaveBeenLastCalledWith("");
  });

  it("toggles active class on click", () => {
    const bar = createPillBar(["Terra X", "37 Grad"], vi.fn());
    const pills = bar.querySelectorAll(".zk-pill");

    pills[1].click();
    expect(pills[0].classList.contains("zk-pill--active")).toBe(false);
    expect(pills[1].classList.contains("zk-pill--active")).toBe(true);
    expect(pills[2].classList.contains("zk-pill--active")).toBe(false);
  });

  it("sets button type to prevent form submission", () => {
    const bar = createPillBar(["Terra X"], vi.fn());
    const pills = bar.querySelectorAll(".zk-pill");
    for (const pill of pills) {
      expect(pill.type).toBe("button");
    }
  });
});
