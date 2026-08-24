export type SaleRequest = {
  id: string;
  name: string;
  customer: string;
  type: string;
  area: string;
  budget: string;
  submitted: string;
  status: string;
  priority: "urgent" | "high" | "medium";
};

export type SaleProject = {
  id: string;
  name: string;
  customer: string;
  type: string;
  designer: string;
  target: string;
  status: string;
  nextAction: string;
  color: string;
};

export type SaleConversation = {
  id: string;
  initials: string;
  name: string;
  meta: string;
  preview: string;
  time: string;
  unread?: number;
  color: string;
  online?: boolean;
};

export const saleRequests: SaleRequest[] = [
  { id: "PRJ-2026-017", name: "Garden Villa Interior", customer: "Tran Bao Chau", type: "Villa", area: "120 sqm", budget: "₫ 350M", submitted: "Aug 20, 2026", status: "Submitted", priority: "urgent" },
  { id: "PRJ-2026-016", name: "Showroom Redesign", customer: "Minh Phat Corp", type: "Retail", area: "82 sqm", budget: "₫ 180M", submitted: "Aug 19, 2026", status: "Need Basic Information", priority: "high" },
  { id: "PRJ-2026-015", name: "Home Office Upgrade", customer: "Pham Thu Ha", type: "Apartment", area: "45 sqm", budget: "₫ 80M", submitted: "Aug 23, 2026", status: "Submitted", priority: "medium" },
  { id: "PRJ-2026-014", name: "Modern Apartment Reno", customer: "Nguyen Minh Anh", type: "Apartment", area: "68 sqm", budget: "₫ 120M", submitted: "Aug 18, 2026", status: "In Consultation", priority: "high" },
  { id: "PRJ-2026-013", name: "Cafe Renovation", customer: "Le Hoang Nam", type: "Cafe", area: "96 sqm", budget: "₫ 240M", submitted: "Aug 16, 2026", status: "Waiting Info", priority: "medium" },
];

export const saleProjects: SaleProject[] = [
  { id: "PRJ-2026-014", name: "Modern Apartment Reno", customer: "Nguyen Minh Anh", type: "Apartment", designer: "—", target: "Sep 10, 2026", status: "Waiting For Designer", nextAction: "Assign Designer", color: "#E17100" },
  { id: "PRJ-2026-013", name: "Cafe Renovation", customer: "Le Hoang Nam", type: "Cafe", designer: "Linh Tran", target: "Sep 5, 2026", status: "Proposal Consulting", nextAction: "Create Quotation", color: "#9810FA" },
  { id: "PRJ-2026-011", name: "Scandinavian Kitchen", customer: "Terra Coffee", type: "Cafe", designer: "Khoa Pham", target: "Aug 28, 2026", status: "Order Confirmed", nextAction: "Create Production Req.", color: "#009966" },
  { id: "PRJ-2026-010", name: "Villa Renovation", customer: "Nguyen Van A", type: "Villa", designer: "Linh Tran", target: "Aug 25, 2026", status: "Delivering", nextAction: "Confirm Final Payment", color: "#0092B8" },
  { id: "PRJ-2026-009", name: "Coffee Lounge HCM", customer: "Coffee & Co", type: "Cafe", designer: "Khoa Pham", target: "Sep 15, 2026", status: "In Production", nextAction: "Track Production", color: "#497D00" },
  { id: "PRJ-2026-008", name: "Riverside Penthouse", customer: "Mai Thanh", type: "Apartment", designer: "An Nguyen", target: "Sep 24, 2026", status: "Active", nextAction: "Review Proposal", color: "#155DFC" },
];

export const saleConversations: SaleConversation[] = [
  { id: "customer-014", initials: "NA", name: "Nguyen Minh Anh", meta: "Customer · PRJ-2026-014", preview: "Khi nào bạn có thể cho tôi biết tiến độ dự án?", time: "10m ago", unread: 3, color: "#3A6B9A", online: true },
  { id: "designer-014", initials: "LT", name: "Linh Tran", meta: "Designer · PRJ-2026-014", preview: "I'll schedule the measurement visit for Aug 26.", time: "1h ago", unread: 1, color: "#4A7A5A", online: true },
  { id: "customer-013", initials: "LH", name: "Le Hoang Nam", meta: "Customer · PRJ-2026-013", preview: "Tôi muốn xem lại bản đề xuất trước khi xác nhận.", time: "2h ago", color: "#7B5EA7" },
  { id: "sale-team", initials: "TM", name: "Sale Team", meta: "Internal · 5 members", preview: "Viet: PRJ-2026-011 đã được xác nhận đơn hàng.", time: "Yesterday", color: "#C9A86A" },
  { id: "customer-011", initials: "TC", name: "Terra Coffee", meta: "Customer · PRJ-2026-011", preview: "Please confirm the delivery schedule.", time: "Yesterday", color: "#5A6A7A" },
  { id: "designer-009", initials: "KP", name: "Khoa Pham", meta: "Designer · PRJ-2026-009", preview: "Production order submitted. ETA 3 weeks.", time: "2 days ago", color: "#9A5050" },
];

export const overviewMetrics = [
  ["7", "New Requests", "#C9A86A", "+2"],
  ["23", "Active Projects", "#3A3330", "+1"],
  ["5", "Waiting Customer", "#7A6F68", "—"],
  ["8", "Waiting Internal", "#7A6F68", "-1"],
  ["4", "Quotes Pending", "#D97706", "+1"],
  ["3", "Payment Follow-up", "#DC2626", "—"],
  ["2", "At-Risk Projects", "#DC2626", "+1"],
  ["11", "Completed / Mo.", "#059669", "+3"],
] as const;

export const projectTabs = ["Overview", "Member", "Files", "Chat", "Schedules"] as const;
export type ProjectDetailTab = (typeof projectTabs)[number];
