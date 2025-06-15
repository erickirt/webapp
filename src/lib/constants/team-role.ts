// Role hierarchy: guest < member < moderator < owner
export const roles = ["guest", "member", "moderator", "owner"] as const;

export type TeamRole = (typeof roles)[number];

// Permissions by functional area
export const TeamPermissions = {
  // Team Management
  TEAM_MANAGEMENT: [
    "INVITE_MANAGE_REMOVE_TEAM_MEMBER",
    "RENAME_TEAM",
    "DELETE_TEAM_INFO",
    "UPDATE_TEAM_INFO",
    "DELETE_TEAM",
  ],
  // Billing & Plans
  BILLING: [
    "UPGRADE_TEAM_PLAN",
  ],
  // Workspace Operations
  WORKSPACE: [
    "CAN_BE_ADDED_TO_WORKSPACE",
    "JOIN_PUBLIC_WORKSPACE",
    "CREATE_WORKSPACE",
    "UPDATE_WORKSPACE",
    "DELETE_WORKSPACE",
  ],
} as const;

export const AllPermissions = [
  ...TeamPermissions.TEAM_MANAGEMENT,
  ...TeamPermissions.BILLING,
  ...TeamPermissions.WORKSPACE,
] as const;

export type TeamPermission = (typeof AllPermissions)[number];

// Base permissions for each role (cumulative/hierarchical)
const rolePermissionSets = {
  guest: new Set<TeamPermission>([
    "JOIN_PUBLIC_WORKSPACE",
  ]),

  member: new Set<TeamPermission>([
    "JOIN_PUBLIC_WORKSPACE",
  ]),

  moderator: new Set<TeamPermission>([
    "JOIN_PUBLIC_WORKSPACE",
    "INVITE_MANAGE_REMOVE_TEAM_MEMBER",
    "CAN_BE_ADDED_TO_WORKSPACE",
    "CREATE_WORKSPACE",
    "UPDATE_WORKSPACE",
    "DELETE_WORKSPACE",
  ]),

  owner: new Set<TeamPermission>([
    "INVITE_MANAGE_REMOVE_TEAM_MEMBER",
    "RENAME_TEAM",
    "DELETE_TEAM_INFO",
    "UPDATE_TEAM_INFO",
    "UPGRADE_TEAM_PLAN",
    "CAN_BE_ADDED_TO_WORKSPACE",
    "JOIN_PUBLIC_WORKSPACE",
    "CREATE_WORKSPACE",
    "UPDATE_WORKSPACE",
    "DELETE_WORKSPACE",
    "DELETE_TEAM",
  ]),
} as const;

// Generate full permission objects for backward compatibility
type PermissionObject = { [key in TeamPermission]: boolean };

export type TeamRolePermission = {
  [key in TeamRole]: PermissionObject;
};

// Generate the permissions for each role
export const teamRolePermissions: TeamRolePermission = Object.fromEntries(
  roles.map(role => [
    role,
    Object.fromEntries(
      AllPermissions.map(permission => [
        permission,
        rolePermissionSets[role].has(permission)
      ])
    )
  ])
) as TeamRolePermission;

// Check if a role has a permission
export function checkPermissions(
  role: TeamRole | undefined,
  permission: TeamPermission,
): boolean {
  if (!role) return false;
  return rolePermissionSets[role].has(permission);
}

// Get the permissions for a role
export function getRolePermissions(role: TeamRole): Set<TeamPermission> {
  return new Set(rolePermissionSets[role]);
}

// Check if a role has any of the permissions
export function hasAnyPermissions(
  role: TeamRole | undefined,
  permissions: TeamPermission[]
): boolean {
  if (!role) return false;
  return permissions.some(permission => rolePermissionSets[role].has(permission));
}

// Check if a role has all of the permissions
export function hasAllPermissions(
  role: TeamRole | undefined,
  permissions: TeamPermission[]
): boolean {
  if (!role) return false;
  return permissions.every(permission => rolePermissionSets[role].has(permission));
}

export function getPermissionsByCategory(category: keyof typeof TeamPermissions): readonly TeamPermission[] {
  return TeamPermissions[category];
}
