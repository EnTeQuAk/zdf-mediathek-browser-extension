export const API_BASE = "https://api.zdf.de";
export const RESULTS_PER_SECTION = 30;
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const CATEGORIES = [
  "Geschichte", "Gesellschaft", "Kultur", "Politik", "Sport",
  "Reise", "Natur", "True Crime", "Wirtschaft", "Stars",
  "Wissen", "Musik", "Gesundheit",
];

const DOKU_BRANDS = ["ZDFinfo Doku", "Terra X", "37 Grad", "Die Spur", "plan b", "frontal"];

export const PAGES = [
  {
    pattern: "/dokus",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
    brands: DOKU_BRANDS,
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Dokus" },
      { id: "zk-serien", type: "serien", title: "Serien & Reihen" },
    ],
  },
  {
    pattern: "/dokumentation",
    apiPath: "/zdf/dokumentation",
    label: "Dokus",
    brands: DOKU_BRANDS,
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Dokus" },
      { id: "zk-serien", type: "serien", title: "Serien & Reihen" },
    ],
  },
  {
    pattern: "/wissen",
    apiPath: "/zdf/wissen",
    label: "Wissen",
    brands: ["Terra X", "Leschs Kosmos", "TerraXplore"],
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Wissen" },
      { id: "zk-serien", type: "serien", title: "Serien & Reihen" },
    ],
  },
  {
    pattern: "/gesellschaft",
    apiPath: "/zdf/gesellschaft",
    label: "Gesellschaft",
    brands: ["37 Grad", "plan b", "Die Spur"],
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Gesellschaft" },
    ],
  },
  {
    pattern: "/kultur",
    apiPath: "/zdf/kultur",
    label: "Kultur",
    brands: [],
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Kultur" },
    ],
  },
  {
    pattern: "/geschichte",
    apiPath: "/zdf/geschichte",
    label: "Geschichte",
    brands: ["ZDF-History", "Terra X"],
    sections: [
      { id: "zk-vorab", type: "vorab", title: "Vorab verfügbar" },
      { id: "zk-neue-dokus", type: "neue", title: "Neu: Geschichte" },
      { id: "zk-serien", type: "serien", title: "Serien & Reihen" },
    ],
  },
];

export function detectCurrentPage() {
  const path = window.location.pathname;
  return PAGES.find((p) => path.startsWith(p.pattern)) || null;
}
