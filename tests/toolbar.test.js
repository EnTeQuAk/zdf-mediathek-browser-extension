import { describe, it, expect, beforeEach, vi } from "vitest";
import { createToolbar } from "../src/toolbar.js";

describe("createToolbar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates toolbar with controls and brand bar", () => {
    const toolbar = createToolbar({
      brands: ["Terra X", "37 Grad"],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    expect(toolbar.className).toBe("zk-toolbar");
    expect(toolbar.querySelector(".zk-toolbar-controls")).not.toBeNull();
    expect(toolbar.querySelector(".zk-toolbar-brands")).not.toBeNull();
  });

  it("omits brand bar when no brands provided", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    expect(toolbar.querySelector(".zk-toolbar-brands")).toBeNull();
  });

  it("has two segment controls (sort and type)", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const segments = toolbar.querySelectorAll(".zk-segment-control");
    expect(segments.length).toBe(2);
  });

  it("sort control has three options with Empfohlen active by default", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const sortControl = toolbar.querySelectorAll(".zk-segment-control")[0];
    const buttons = sortControl.querySelectorAll(".zk-segment-btn");
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toBe("Empfohlen");
    expect(buttons[0].classList.contains("zk-segment-btn--active")).toBe(true);
    expect(buttons[1].textContent).toBe("Neueste");
    expect(buttons[2].textContent).toBe("Meist gesehen");
  });

  it("type control has two options with Einzelbeiträge active by default", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const typeControl = toolbar.querySelectorAll(".zk-segment-control")[1];
    const buttons = typeControl.querySelectorAll(".zk-segment-btn");
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe("Einzelbeiträge");
    expect(buttons[0].classList.contains("zk-segment-btn--active")).toBe(true);
    expect(buttons[1].textContent).toBe("Serien & Reihen");
  });

  it("calls onSortChange with null for Empfohlen", () => {
    const onSortChange = vi.fn();
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange,
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const sortControl = toolbar.querySelectorAll(".zk-segment-control")[0];
    sortControl.querySelectorAll(".zk-segment-btn")[0].click();

    expect(onSortChange).toHaveBeenCalledWith(null);
  });

  it("calls onSortChange with 'date' for Neueste", () => {
    const onSortChange = vi.fn();
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange,
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const sortControl = toolbar.querySelectorAll(".zk-segment-control")[0];
    sortControl.querySelectorAll(".zk-segment-btn")[1].click();

    expect(onSortChange).toHaveBeenCalledWith("date");
  });

  it("calls onSortChange with 'views' for Meist gesehen", () => {
    const onSortChange = vi.fn();
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange,
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const sortControl = toolbar.querySelectorAll(".zk-segment-control")[0];
    sortControl.querySelectorAll(".zk-segment-btn")[2].click();

    expect(onSortChange).toHaveBeenCalledWith("views");
  });

  it("calls onTypeChange with correct type value", () => {
    const onTypeChange = vi.fn();
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange,
    });
    document.body.appendChild(toolbar);

    const typeControl = toolbar.querySelectorAll(".zk-segment-control")[1];
    typeControl.querySelectorAll(".zk-segment-btn")[1].click();

    expect(onTypeChange).toHaveBeenCalledWith("page-index");
  });

  it("calls onBrandChange when pill is clicked", () => {
    const onBrandChange = vi.fn();
    const toolbar = createToolbar({
      brands: ["Terra X", "37 Grad"],
      onBrandChange,
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const pills = toolbar.querySelectorAll(".zk-pill");
    expect(pills.length).toBe(3);
    pills[1].click();

    expect(onBrandChange).toHaveBeenCalledWith("Terra X");
  });

  it("calls onBrandChange with empty string for Alle", () => {
    const onBrandChange = vi.fn();
    const toolbar = createToolbar({
      brands: ["Terra X"],
      onBrandChange,
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const pills = toolbar.querySelectorAll(".zk-pill");
    pills[1].click();
    pills[0].click();

    expect(onBrandChange).toHaveBeenLastCalledWith("");
  });

  it("updates active state on segment click", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const sortControl = toolbar.querySelectorAll(".zk-segment-control")[0];
    const buttons = sortControl.querySelectorAll(".zk-segment-btn");

    buttons[1].click();

    expect(buttons[0].classList.contains("zk-segment-btn--active")).toBe(false);
    expect(buttons[1].classList.contains("zk-segment-btn--active")).toBe(true);
  });
});
