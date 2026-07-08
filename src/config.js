export const API_BASE = "https://api.zdf.de";
export const RESULTS_PER_SECTION = 30;
export const RESULTS_PER_PAGE = 12;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const CATEGORIES = [
  "Geschichte",
  "Gesellschaft",
  "Kultur",
  "Politik",
  "Sport",
  "Reise",
  "Natur",
  "True Crime",
  "Wirtschaft",
  "Stars",
  "Wissen",
  "Musik",
  "Gesundheit",
];

export const PAGES = [
  {
    pattern: "/dokus",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
  },
  {
    pattern: "/dokumentation",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
  },
  {
    pattern: "/wissen",
    apiPath: "/zdf/wissen",
    label: "Wissen",
  },
  {
    pattern: "/gesellschaft",
    apiPath: "/zdf/gesellschaft",
    label: "Gesellschaft",
  },
  {
    pattern: "/kultur",
    apiPath: "/zdf/kultur",
    label: "Kultur",
  },
  {
    pattern: "/geschichte",
    apiPath: "/zdf/geschichte",
    label: "Geschichte",
  },
];

export function detectCurrentPage() {
  const path = window.location.pathname;
  return PAGES.find((p) => path.startsWith(p.pattern)) || null;
}
