export const PERMISSION_CODES = [
  "dashboard.view",
  "schedule.view",
  "schedule.manage",
  "competitions.manage",
  "choreographies.manage",
  "members.view",
  "members.manage",
  "payments.view",
  "payments.manage",
  "permissions.manage",
  "news.manage",
  "announcements.manage",
  "calendar.view",
  "statistics.view",
  "ui.view",
  "other-pages.view",
  "profile.view",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const ROUTE_PERMISSIONS: Array<{ prefix: string; permission: PermissionCode }> = [
  { prefix: "/admin/jogosultsagok", permission: "permissions.manage" },
  { prefix: "/admin/befizetesek", permission: "payments.view" },
  { prefix: "/admin/tagok", permission: "members.view" },
  { prefix: "/admin/basic-tables", permission: "members.view" },
  { prefix: "/admin/beosztas", permission: "schedule.view" },
  { prefix: "/admin/versenyek", permission: "competitions.manage" },
  { prefix: "/admin/koreok", permission: "choreographies.manage" },
  { prefix: "/admin/hirek", permission: "news.manage" },
  { prefix: "/admin/uzenetek", permission: "announcements.manage" },
  { prefix: "/admin/calendar", permission: "calendar.view" },
  { prefix: "/admin/form-elements", permission: "ui.view" },
  { prefix: "/admin/line-chart", permission: "statistics.view" },
  { prefix: "/admin/bar-chart", permission: "statistics.view" },
  { prefix: "/admin/profile", permission: "profile.view" },
  { prefix: "/admin/blank", permission: "other-pages.view" },
  { prefix: "/admin/alerts", permission: "ui.view" },
  { prefix: "/admin/avatars", permission: "ui.view" },
  { prefix: "/admin/badge", permission: "ui.view" },
  { prefix: "/admin/buttons", permission: "ui.view" },
  { prefix: "/admin/images", permission: "ui.view" },
  { prefix: "/admin/modals", permission: "ui.view" },
  { prefix: "/admin/videos", permission: "ui.view" },
  { prefix: "/admin", permission: "dashboard.view" },
];

export function permissionForPath(pathname: string): PermissionCode | null {
  if (pathname === "/admin/hozzaferes-megtagadva") return null;
  return ROUTE_PERMISSIONS.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.permission ?? null;
}
