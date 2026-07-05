const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttlMs = 60000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function clear() {
  store.clear();
}
