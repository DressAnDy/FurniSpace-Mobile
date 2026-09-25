export const designerProjectTabs = [
  "Overview",
  "Measurement",
  "Areas",
  "Catalog",
  "Customization",
  "Chat",
] as const;

export type DesignerProjectTab = (typeof designerProjectTabs)[number];
