// src/constants/roles.ts
// ============================================================
// ROLE-BASED ACCESS CONTROL DEFINITIONS
// ============================================================

export enum UserRole {
  RESIDENT = "RESIDENT",
  SECRETARY = "SECRETARY",
  TREASURER = "TREASURER",
  PRESIDENT = "PRESIDENT",
  ADMIN = "ADMIN",
}

// Committee members (elevated access)
export const COMMITTEE_ROLES = [
  UserRole.SECRETARY,
  UserRole.TREASURER,
  UserRole.PRESIDENT,
  UserRole.ADMIN,
] as const;

// Can manage finances
export const FINANCE_ROLES = [
  UserRole.TREASURER,
  UserRole.PRESIDENT,
  UserRole.ADMIN,
] as const;

// Can manage complaints
export const COMPLAINT_MANAGER_ROLES = [
  UserRole.SECRETARY,
  UserRole.PRESIDENT,
  UserRole.ADMIN,
] as const;

// Permissions map — what each role can do
export const PERMISSIONS = {
  // Bills
  "bills:read:own": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "bills:read:all": [
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "bills:create": [UserRole.TREASURER, UserRole.PRESIDENT, UserRole.ADMIN],
  "bills:update": [UserRole.TREASURER, UserRole.PRESIDENT, UserRole.ADMIN],
  "bills:delete": [UserRole.ADMIN],

  // Payments
  "payments:create": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "payments:confirm": [UserRole.TREASURER, UserRole.PRESIDENT, UserRole.ADMIN],
  "payments:read:all": [UserRole.TREASURER, UserRole.PRESIDENT, UserRole.ADMIN],

  // Expenses
  "expenses:read": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "expenses:create": [UserRole.TREASURER, UserRole.PRESIDENT, UserRole.ADMIN],
  "expenses:approve": [UserRole.PRESIDENT, UserRole.ADMIN],
  "expenses:delete": [UserRole.ADMIN],

  // Complaints
  "complaints:create": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "complaints:read:own": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "complaints:read:all": [
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "complaints:assign": [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.ADMIN],
  "complaints:resolve": [
    UserRole.SECRETARY,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],

  // Notices
  "notices:read": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "notices:create": [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.ADMIN],
  "notices:delete": [UserRole.PRESIDENT, UserRole.ADMIN],

  // Polls
  "polls:vote": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "polls:create": [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.ADMIN],
  "polls:close": [UserRole.PRESIDENT, UserRole.ADMIN],

  // Bookings
  "bookings:create": [
    UserRole.RESIDENT,
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "bookings:approve": [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.ADMIN],

  // Members
  "members:read": [
    UserRole.SECRETARY,
    UserRole.TREASURER,
    UserRole.PRESIDENT,
    UserRole.ADMIN,
  ],
  "members:manage": [UserRole.SECRETARY, UserRole.PRESIDENT, UserRole.ADMIN],

  // Audit logs
  "audit:read": [UserRole.PRESIDENT, UserRole.ADMIN],

  // Admin only
  "society:manage": [UserRole.ADMIN],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[];
  return allowedRoles.includes(role);
}
