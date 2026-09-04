export type UserRole = "ADMIN" | "ENGINEER" | "CUSTOMER" | "INTERN";

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: UserRole;
  companyId: string | null;
  assignedSiteIds: string[]; // List of site IDs the user is allowed to access
  companyName?: string;
  googleLinked: boolean;
}

export type ProjectHealth = "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";

export type ActionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type ActionCategory = "HARDWARE" | "SOFTWARE" | "MECHANICAL" | "NETWORK" | "FACILITY" | "SAFETY";
export type ActionStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export type IssueSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR";
export type IssueStatus = "OPEN" | "INVESTIGATING" | "COUNTERMEASURE_PROPOSED" | "VALIDATING" | "CLOSED";

export type RobotType = "AGV" | "AMR" | "ARV";
export type RobotStatus = "RUNNING" | "IDLE" | "SHORT_STOP" | "MAINTENANCE" | "OFFLINE";
