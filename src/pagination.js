export function createPaginationButton(onLoadMore) {
  const wrapper = document.createElement("div");
  wrapper.className = "zk-load-more-wrapper";

  const btn = document.createElement("button");
  btn.className = "zk-load-more";
  btn.type = "button";
  btn.textContent = "Mehr laden";

  btn.addEventListener("click", () => {
    btn.disabled = true;
    btn.classList.add("zk-load-more--loading");
    onLoadMore();
  });

  wrapper.appendChild(btn);
  return wrapper;
}

export function updatePaginationState(wrapper, { currentCount, total }) {
  const btn = wrapper.querySelector(".zk-load-more");
  if (!btn) {
    return;
  }

  btn.disabled = false;
  btn.classList.remove("zk-load-more--loading");

  if (currentCount >= total) {
    wrapper.style.display = "none";
  } else {
    wrapper.style.display = "";
  }
}
