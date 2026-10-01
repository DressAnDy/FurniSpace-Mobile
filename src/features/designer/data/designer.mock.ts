export const designerProjectTabs = [
  "Overview",
  "Measurement",
  "Areas",
  "Catalog",
  "Customization",
] as const;

export type DesignerProjectTab = (typeof designerProjectTabs)[number];
