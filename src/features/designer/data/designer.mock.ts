export const designerProjectTabs = [
  "Overview",
  "Measurement",
  "Areas",
  "Catalog",
  "Chat",
] as const;

export type DesignerProjectTab = (typeof designerProjectTabs)[number];
