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

const DOKU_BRANDS = ["ZDFinfo Doku", "Terra X", "37 Grad", "Die Spur", "plan b", "frontal"];

export const PAGES = [
  {
    pattern: "/dokus",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
    brands: DOKU_BRANDS,
  },
  {
    pattern: "/dokumentation",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
    brands: DOKU_BRANDS,
  },
  {
    pattern: "/wissen",
    apiPath: "/zdf/wissen",
    label: "Wissen",
    brands: ["Terra X", "Leschs Kosmos", "TerraXplore"],
  },
  {
    pattern: "/gesellschaft",
    apiPath: "/zdf/gesellschaft",
    label: "Gesellschaft",
    brands: ["37 Grad", "plan b", "Die Spur"],
  },
  {
    pattern: "/kultur",
    apiPath: "/zdf/kultur",
    label: "Kultur",
    brands: [],
  },
  {
    pattern: "/geschichte",
    apiPath: "/zdf/geschichte",
    label: "Geschichte",
    brands: ["ZDF-History", "Terra X"],
  },
];

export function detectCurrentPage() {
  const path = window.location.pathname;
  return PAGES.find((p) => path.startsWith(p.pattern)) || null;
}
