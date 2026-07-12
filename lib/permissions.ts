import { Role } from "@prisma/client";

// Core System Resources
export type SystemResource =
  | "DEPARTMENTS"
  | "EMPLOYEES"
  | "CATEGORIES"
  | "ASSETS"
  | "ALLOCATIONS"
  | "BOOKINGS"
  | "MAINTENANCE"
  | "AUDITS"
  | "REPORTS"
  | "LOGS"
  | "SETTINGS";

// Core Operations / Actions
export type ResourceAction =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "TRANSFER"
  | "EXPORT";

// Master RBAC Matrix Mapping
const PERMISSION_MATRIX: Record<Role, Partial<Record<SystemResource, ResourceAction[]>>> = {
  ADMIN: {
    DEPARTMENTS: ["CREATE", "READ", "UPDATE", "DELETE", "EXPORT"],
    EMPLOYEES: ["CREATE", "READ", "UPDATE", "DELETE", "EXPORT"],
    CATEGORIES: ["CREATE", "READ", "UPDATE", "DELETE", "EXPORT"],
    ASSETS: ["CREATE", "READ", "UPDATE", "DELETE", "TRANSFER", "EXPORT"],
    ALLOCATIONS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "EXPORT"],
    BOOKINGS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "EXPORT"],
    MAINTENANCE: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "REJECT", "EXPORT"],
    AUDITS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE", "EXPORT"],
    REPORTS: ["READ", "EXPORT"],
    LOGS: ["READ", "EXPORT"],
    SETTINGS: ["READ", "UPDATE"],
  },
  ASSET_MANAGER: {
    DEPARTMENTS: ["READ"],
    EMPLOYEES: ["READ"],
    CATEGORIES: ["READ"],
    ASSETS: ["CREATE", "READ", "UPDATE", "DELETE", "TRANSFER", "EXPORT"],
    ALLOCATIONS: ["CREATE", "READ", "UPDATE", "APPROVE", "EXPORT"],
    BOOKINGS: ["READ"],
    MAINTENANCE: ["CREATE", "READ", "UPDATE", "APPROVE", "REJECT"],
    AUDITS: ["CREATE", "READ", "UPDATE"],
    REPORTS: ["READ", "EXPORT"],
    LOGS: ["READ"],
    SETTINGS: ["READ", "UPDATE"],
  },
  DEPARTMENT_HEAD: {
    DEPARTMENTS: ["READ"],
    EMPLOYEES: ["READ"],
    ASSETS: ["READ"],
    ALLOCATIONS: ["READ", "APPROVE"],
    BOOKINGS: ["CREATE", "READ", "DELETE"],
    MAINTENANCE: ["READ"],
    REPORTS: ["READ"],
    SETTINGS: ["READ", "UPDATE"],
  },
  EMPLOYEE: {
    ASSETS: ["READ"],
    ALLOCATIONS: ["READ"],
    BOOKINGS: ["CREATE", "READ", "DELETE"],
    MAINTENANCE: ["CREATE", "READ"],
    SETTINGS: ["READ", "UPDATE"],
  },
};

/**
 * Validates resource-action permissions based on the active role profile
 */
export function hasPermission(
  role: Role | string | undefined,
  resource: SystemResource,
  action: ResourceAction
): boolean {
  if (!role) return false;
  const userRole = role as Role;
  
  const allowedActions = PERMISSION_MATRIX[userRole]?.[resource];
  if (!allowedActions) return false;
  
  return allowedActions.includes(action);
}
