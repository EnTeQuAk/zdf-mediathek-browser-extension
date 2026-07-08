import { describe, it, expect, beforeEach, vi } from "vitest";
import { createToolbar } from "../src/toolbar.js";

describe("createToolbar", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates toolbar with filters and controls zones", () => {
    const toolbar = createToolbar({
      brands: [
        { title: "Terra X", path: "/zdf/dokumentation/terra-x" },
        { title: "37 Grad", path: "/zdf/dokumentation/37-grad" },
      ],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    expect(toolbar.className).toBe("zk-toolbar");
    expect(toolbar.querySelector(".zk-toolbar-filters")).not.toBeNull();
    expect(toolbar.querySelector(".zk-toolbar-controls")).not.toBeNull();
  });

  it("puts brand pills in the filters zone (left)", () => {
    const toolbar = createToolbar({
      brands: [{ title: "Terra X", path: "/zdf/dokumentation/terra-x" }],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const filters = toolbar.querySelector(".zk-toolbar-filters");
    const pills = filters.querySelectorAll(".zk-pill");
    expect(pills.length).toBe(2);
    expect(pills[0].textContent).toBe("Alle");
    expect(pills[1].textContent).toBe("Terra X");
  });

  it("omits filters zone when no brands provided", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    expect(toolbar.querySelector(".zk-toolbar-filters")).toBeNull();
  });

  it("has sort links with Empfohlen active by default", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const links = toolbar.querySelectorAll(".zk-sort-link");
    expect(links.length).toBe(3);
    expect(links[0].textContent).toBe("Empfohlen");
    expect(links[0].classList.contains("zk-sort-link--active")).toBe(true);
    expect(links[1].textContent).toBe("Neueste");
    expect(links[2].textContent).toBe("Meist gesehen");
  });

  it("has type toggle with Videos active by default", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const buttons = toolbar.querySelectorAll(".zk-type-btn");
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe("Videos");
    expect(buttons[0].classList.contains("zk-type-btn--active")).toBe(true);
    expect(buttons[1].textContent).toBe("Serien");
  });

  it("has a filter icon button that delegates to ZDF native filter", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const btn = toolbar.querySelector(".zk-filter-btn");
    expect(btn).not.toBeNull();
    expect(btn.disabled).toBe(false);
    expect(btn.title).toBe("Filtern");
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

    toolbar.querySelectorAll(".zk-sort-link")[0].click();
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

    toolbar.querySelectorAll(".zk-sort-link")[1].click();
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

    toolbar.querySelectorAll(".zk-sort-link")[2].click();
    expect(onSortChange).toHaveBeenCalledWith("views");
  });

  it("updates active state on sort link click", () => {
    const toolbar = createToolbar({
      brands: [],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const links = toolbar.querySelectorAll(".zk-sort-link");
    links[1].click();

    expect(links[0].classList.contains("zk-sort-link--active")).toBe(false);
    expect(links[1].classList.contains("zk-sort-link--active")).toBe(true);
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

    toolbar.querySelectorAll(".zk-type-btn")[1].click();
    expect(onTypeChange).toHaveBeenCalledWith("page-index");
  });

  it("calls onBrandChange with brand object when pill is clicked", () => {
    const onBrandChange = vi.fn();
    const brands = [
      { title: "Terra X", path: "/zdf/dokumentation/terra-x" },
      { title: "37 Grad", path: "/zdf/dokumentation/37-grad" },
    ];
    const toolbar = createToolbar({
      brands,
      onBrandChange,
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const pills = toolbar.querySelectorAll(".zk-pill");
    pills[1].click();
    expect(onBrandChange).toHaveBeenCalledWith(brands[0]);
  });

  it("calls onBrandChange with null for Alle", () => {
    const onBrandChange = vi.fn();
    const brands = [{ title: "Terra X", path: "/zdf/dokumentation/terra-x" }];
    const toolbar = createToolbar({
      brands,
      onBrandChange,
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    const pills = toolbar.querySelectorAll(".zk-pill");
    pills[1].click();
    pills[0].click();
    expect(onBrandChange).toHaveBeenLastCalledWith(null);
  });

  it("setBrands adds brand pills dynamically", () => {
    const onBrandChange = vi.fn();
    const toolbar = createToolbar({
      brands: [],
      onBrandChange,
      onSortChange: () => {},
      onTypeChange: () => {},
    });
    document.body.appendChild(toolbar);

    expect(toolbar.querySelector(".zk-toolbar-filters")).toBeNull();

    toolbar.setBrands([
      { title: "Terra X", path: "/zdf/dokumentation/terra-x" },
      { title: "37 Grad", path: "/zdf/dokumentation/37-grad" },
    ]);

    const filters = toolbar.querySelector(".zk-toolbar-filters");
    expect(filters).not.toBeNull();
    const pills = filters.querySelectorAll(".zk-pill");
    expect(pills.length).toBe(3);
    expect(pills[0].textContent).toBe("Alle");
    expect(pills[1].textContent).toBe("Terra X");
    expect(pills[2].textContent).toBe("37 Grad");

    pills[1].click();
    expect(onBrandChange).toHaveBeenCalledWith({ title: "Terra X", path: "/zdf/dokumentation/terra-x" });
  });

  it("controls zone is after filters zone in DOM order", () => {
    const toolbar = createToolbar({
      brands: [{ title: "Terra X", path: "/zdf/dokumentation/terra-x" }],
      onBrandChange: () => {},
      onSortChange: () => {},
      onTypeChange: () => {},
    });

    const children = Array.from(toolbar.children);
    const filtersIdx = children.findIndex((el) => el.classList.contains("zk-toolbar-filters"));
    const controlsIdx = children.findIndex((el) => el.classList.contains("zk-toolbar-controls"));
    expect(filtersIdx).toBeLessThan(controlsIdx);
  });
});
