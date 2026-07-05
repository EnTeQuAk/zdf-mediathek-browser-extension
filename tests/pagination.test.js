import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPaginationButton, updatePaginationState } from "../src/pagination.js";

describe("createPaginationButton", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a wrapper with a button", () => {
    const wrapper = createPaginationButton(() => {});
    expect(wrapper.className).toBe("zk-load-more-wrapper");
    const btn = wrapper.querySelector(".zk-load-more");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Mehr laden");
    expect(btn.type).toBe("button");
  });

  it("calls onLoadMore and disables button on click", () => {
    const onLoadMore = vi.fn();
    const wrapper = createPaginationButton(onLoadMore);
    document.body.appendChild(wrapper);

    const btn = wrapper.querySelector(".zk-load-more");
    btn.click();

    expect(onLoadMore).toHaveBeenCalledOnce();
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains("zk-load-more--loading")).toBe(true);
  });

  it("does not call onLoadMore again while disabled", () => {
    const onLoadMore = vi.fn();
    const wrapper = createPaginationButton(onLoadMore);
    document.body.appendChild(wrapper);

    const btn = wrapper.querySelector(".zk-load-more");
    btn.click();
    btn.click();

    expect(onLoadMore).toHaveBeenCalledOnce();
  });
});

describe("updatePaginationState", () => {
  it("re-enables button and shows wrapper when more items available", () => {
    const wrapper = createPaginationButton(() => {});
    const btn = wrapper.querySelector(".zk-load-more");
    btn.disabled = true;
    btn.classList.add("zk-load-more--loading");

    updatePaginationState(wrapper, { currentCount: 12, total: 42 });

    expect(btn.disabled).toBe(false);
    expect(btn.classList.contains("zk-load-more--loading")).toBe(false);
    expect(wrapper.style.display).toBe("");
  });

  it("hides wrapper when all items are loaded", () => {
    const wrapper = createPaginationButton(() => {});

    updatePaginationState(wrapper, { currentCount: 42, total: 42 });

    expect(wrapper.style.display).toBe("none");
  });

  it("hides wrapper when current exceeds total", () => {
    const wrapper = createPaginationButton(() => {});

    updatePaginationState(wrapper, { currentCount: 50, total: 42 });

    expect(wrapper.style.display).toBe("none");
  });
});
