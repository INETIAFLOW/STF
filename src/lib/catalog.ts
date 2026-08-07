/**
 * STF platform catalog — the single definition of modules, features,
 * permissions and role templates. Seeded into the database and referenced
 * by navigation, guards and the flag evaluator.
 *
 * Source documents: MODULES.md, FEATURE-FLAGS.md, USER-ROLES.md (Pack 01).
 * Do not add modules, features, roles or permissions beyond those documents
 * (design handoff README §8).
 */

export type ModuleCategory = "CORE" | "STANDARD" | "OPTIONAL";

export const MODULES = {
  EMPLOYEES: {
    key: "EMPLOYEES",
    name: "Employee Management",
    description:
      "Profiles, employment information, reporting manager, documents, status and timeline.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 10,
  },
  ATTENDANCE: {
    key: "ATTENDANCE",
    name: "Attendance",
    description:
      "Check-in/out, time and location capture, shifts, exceptions, calendar, late rules and admin review.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 20,
  },
  LEAVE: {
    key: "LEAVE",
    name: "Leave",
    description:
      "Request, approve or reject, half-day and emergency leave, and payroll effect.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 30,
  },
  PAYROLL: {
    key: "PAYROLL",
    name: "Payroll",
    description:
      "Salary structures, period calculations, adjustments, review and payslips.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 40,
  },
  TASKS: {
    key: "TASKS",
    name: "Tasks",
    description:
      "Assignments, priority, due dates, notes, files, proof, status and recurring templates.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 50,
  },
  DAILY_REPORTING: {
    key: "DAILY_REPORTING",
    name: "Daily Reporting",
    description:
      "Summaries of attendance, task status and exceptions with configured delivery.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 60,
  },
  PERFORMANCE: {
    key: "PERFORMANCE",
    name: "Performance & Leaderboards",
    description:
      "Attendance and task-derived indicators only, with transparent definitions.",
    category: "STANDARD" as ModuleCategory,
    sortOrder: 70,
  },
  NOTIFICATIONS: {
    key: "NOTIFICATIONS",
    name: "Notifications",
    description:
      "In-app, push, email, SMS or WhatsApp delivery through configured providers.",
    category: "CORE" as ModuleCategory,
    sortOrder: 80,
  },
  EXPENSES: {
    key: "EXPENSES",
    name: "Expenses",
    description: "Optional module — enabled only after its rules are approved.",
    category: "OPTIONAL" as ModuleCategory,
    sortOrder: 110,
  },
  ASSETS: {
    key: "ASSETS",
    name: "Assets",
    description: "Optional module — enabled only after its rules are approved.",
    category: "OPTIONAL" as ModuleCategory,
    sortOrder: 120,
  },
  ANNOUNCEMENTS: {
    key: "ANNOUNCEMENTS",
    name: "Announcements",
    description: "Optional module — enabled only after its rules are approved.",
    category: "OPTIONAL" as ModuleCategory,
    sortOrder: 130,
  },
  APPROVALS: {
    key: "APPROVALS",
    name: "Approvals",
    description: "Optional module — enabled only after its rules are approved.",
    category: "OPTIONAL" as ModuleCategory,
    sortOrder: 140,
  },
  GPS_TRACKING: {
    key: "GPS_TRACKING",
    name: "GPS Tracking",
    description:
      "Event-based attendance and task proof — not continuous tracking. Optional; rules must be approved first.",
    category: "OPTIONAL" as ModuleCategory,
    sortOrder: 150,
  },
} as const;

export type ModuleKey = keyof typeof MODULES;

/**
 * Dependency rules (MODULES.md). Entries sharing a non-null `anyOfGroup`
 * are satisfied when ANY module of the group is enabled.
 */
export const MODULE_DEPENDENCIES: ReadonlyArray<{
  module: ModuleKey;
  requires: ModuleKey;
  anyOfGroup?: string;
}> = [
  { module: "PAYROLL", requires: "EMPLOYEES" },
  { module: "PAYROLL", requires: "ATTENDANCE" },
  { module: "LEAVE", requires: "EMPLOYEES" },
  { module: "TASKS", requires: "EMPLOYEES" },
  { module: "PERFORMANCE", requires: "ATTENDANCE", anyOfGroup: "perf-source" },
  { module: "PERFORMANCE", requires: "TASKS", anyOfGroup: "perf-source" },
];

/** Initial feature flags (FEATURE-FLAGS.md). */
export const FEATURES: ReadonlyArray<{
  module: ModuleKey;
  key: string;
  name: string;
  defaultEnabled: boolean;
}> = [
  { module: "ATTENDANCE", key: "gps_capture", name: "GPS capture", defaultEnabled: true },
  { module: "ATTENDANCE", key: "geofence", name: "Permitted-area check", defaultEnabled: true },
  { module: "ATTENDANCE", key: "outside_area_approval", name: "Outside-area approval", defaultEnabled: true },
  { module: "ATTENDANCE", key: "multiple_punch", name: "Multiple punches per day", defaultEnabled: false },
  { module: "ATTENDANCE", key: "offline_capture", name: "Offline capture", defaultEnabled: true },
  { module: "ATTENDANCE", key: "missed_punch_correction", name: "Missed-punch correction", defaultEnabled: true },
  { module: "ATTENDANCE", key: "late_penalty", name: "Late penalty", defaultEnabled: true },
  { module: "ATTENDANCE", key: "late_exemption", name: "Late exemption", defaultEnabled: true },
  { module: "PAYROLL", key: "overtime", name: "Overtime", defaultEnabled: false },
  { module: "PAYROLL", key: "advances", name: "Advances", defaultEnabled: false },
  { module: "PAYROLL", key: "loans", name: "Loans", defaultEnabled: false },
  { module: "PAYROLL", key: "incentives", name: "Incentives", defaultEnabled: false },
  { module: "PAYROLL", key: "bonus", name: "Bonus", defaultEnabled: false },
  { module: "PAYROLL", key: "payslip_delivery", name: "Payslip delivery", defaultEnabled: true },
  { module: "TASKS", key: "multiple_assignees", name: "Multiple assignees", defaultEnabled: false },
  { module: "TASKS", key: "recurring_tasks", name: "Recurring tasks", defaultEnabled: false },
  { module: "TASKS", key: "proof_photo", name: "Photo proof", defaultEnabled: true },
  { module: "TASKS", key: "proof_file", name: "File proof", defaultEnabled: true },
  { module: "TASKS", key: "proof_video", name: "Video proof", defaultEnabled: false },
  { module: "TASKS", key: "gps_proof", name: "GPS proof", defaultEnabled: false },
  { module: "TASKS", key: "daily_report", name: "Task daily report", defaultEnabled: true },
  { module: "NOTIFICATIONS", key: "push", name: "Push notifications", defaultEnabled: true },
  { module: "NOTIFICATIONS", key: "email", name: "Email notifications", defaultEnabled: true },
  { module: "NOTIFICATIONS", key: "whatsapp", name: "WhatsApp notifications", defaultEnabled: false },
  { module: "NOTIFICATIONS", key: "sms", name: "SMS notifications", defaultEnabled: false },
  { module: "PERFORMANCE", key: "leaderboard", name: "Leaderboard", defaultEnabled: false },
];

/**
 * Permission catalog. `sensitive` marks the separately-permissioned set
 * from USER-ROLES.md §"Minimum sensitive permissions".
 */
export const PERMISSIONS = [
  { key: "admin.access", name: "Access the admin area", isSensitive: false },
  { key: "employees.view", name: "View employees", isSensitive: false },
  { key: "employees.manage", name: "Add and edit employees", isSensitive: false },
  { key: "attendance.view", name: "View attendance", isSensitive: false },
  { key: "attendance.review", name: "Review attendance exceptions", isSensitive: false },
  { key: "attendance.override", name: "Override attendance records", isSensitive: true },
  { key: "leave.view", name: "View leave requests", isSensitive: false },
  { key: "leave.approve", name: "Approve leave", isSensitive: false },
  { key: "payroll.view", name: "Salary amounts — view", isSensitive: true },
  { key: "payroll.edit", name: "Salary amounts — edit", isSensitive: true },
  { key: "payroll.approve", name: "Payroll — approve and lock", isSensitive: true },
  { key: "bank.view", name: "Bank details — view", isSensitive: true },
  { key: "bank.edit", name: "Bank details — edit", isSensitive: true },
  { key: "documents.view", name: "View employee documents", isSensitive: false },
  { key: "documents.download", name: "Download employee documents", isSensitive: true },
  { key: "location.view", name: "View attendance locations", isSensitive: true },
  { key: "tasks.view", name: "View tasks", isSensitive: false },
  { key: "tasks.manage", name: "Create and manage tasks", isSensitive: false },
  { key: "tasks.reassign", name: "Reassign tasks", isSensitive: false },
  { key: "reports.view", name: "View reports", isSensitive: false },
  { key: "reports.export", name: "Export reports", isSensitive: true },
  { key: "audit.view", name: "View the activity log", isSensitive: true },
  { key: "policy.edit", name: "Edit tenant policies", isSensitive: false },
  { key: "modules.manage", name: "Manage modules and features", isSensitive: false },
  { key: "roles.manage", name: "Manage roles and permissions", isSensitive: false },
  { key: "settings.manage", name: "Manage company settings", isSensitive: false },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map(
  (p) => p.key,
);

/**
 * Role templates (USER-ROLES.md). Safe starting sets — tenants may adjust
 * within their enabled modules; a role can never exceed platform controls.
 */
export const ROLE_TEMPLATES: ReadonlyArray<{
  key: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
}> = [
  {
    key: "OWNER",
    name: "Tenant Owner",
    description:
      "Full company control, including payroll approval and retention choices.",
    permissions: [...ALL_PERMISSION_KEYS],
  },
  {
    key: "SUPER_ADMIN",
    name: "Tenant Super Admin",
    description:
      "Delegated operational authority. Payroll and bank access are granted separately.",
    permissions: [
      "admin.access",
      "employees.view",
      "employees.manage",
      "attendance.view",
      "attendance.review",
      "attendance.override",
      "leave.view",
      "leave.approve",
      "documents.view",
      "documents.download",
      "tasks.view",
      "tasks.manage",
      "tasks.reassign",
      "reports.view",
      "reports.export",
      "audit.view",
      "policy.edit",
      "modules.manage",
      "roles.manage",
      "settings.manage",
    ],
  },
  {
    key: "ADMIN",
    name: "Admin",
    description:
      "Runs people operations. Configurable by permission set.",
    permissions: [
      "admin.access",
      "employees.view",
      "employees.manage",
      "attendance.view",
      "attendance.review",
      "leave.view",
      "leave.approve",
      "documents.view",
      "tasks.view",
      "tasks.manage",
      "reports.view",
    ],
  },
  {
    key: "HR",
    name: "HR",
    description:
      "Maintains employee records, documents, leave and payroll inputs.",
    permissions: [
      "admin.access",
      "employees.view",
      "employees.manage",
      "attendance.view",
      "attendance.review",
      "leave.view",
      "leave.approve",
      "documents.view",
      "documents.download",
      "payroll.view",
      "reports.view",
    ],
  },
  {
    key: "MANAGER",
    name: "Manager",
    description:
      "Manages their reporting tree: tasks, approvals and limited reports. No payroll or bank data by default.",
    permissions: [
      "admin.access",
      "employees.view",
      "attendance.view",
      "attendance.review",
      "leave.view",
      "leave.approve",
      "tasks.view",
      "tasks.manage",
      "tasks.reassign",
      "reports.view",
    ],
  },
  {
    key: "TEAM_LEADER",
    name: "Team Leader",
    description: "Assigns and reviews work in their team.",
    permissions: ["employees.view", "attendance.view", "tasks.view", "tasks.manage"],
  },
  {
    key: "EMPLOYEE",
    name: "Employee",
    description:
      "Acts on their own attendance, leave, tasks, documents and payslips.",
    permissions: [],
  },
  {
    key: "VIEWER",
    name: "Viewer",
    description: "Read-only, with a defined record scope.",
    permissions: ["employees.view", "reports.view"],
  },
];

/** V1 modules enabled for a new tenant by default. */
export const DEFAULT_ENABLED_MODULES: ModuleKey[] = [
  "EMPLOYEES",
  "ATTENDANCE",
  "LEAVE",
  "PAYROLL",
  "TASKS",
  "DAILY_REPORTING",
  "NOTIFICATIONS",
];

