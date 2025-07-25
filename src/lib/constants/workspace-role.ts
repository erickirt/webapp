export const workspaceRole = ["editor", "reader"] as const;

export type WorkspaceRole = (typeof workspaceRole)[number];

const WorkspacePermissions = {
  CONTENT: [
    "VIEW_CONTENT",
    "CREATE_CONTENT",
    "EDIT_CONTENT",
    "DELETE_CONTENT",
  ],
  SETTINGS: [
    "UPDATE_WORKSPACE_INFO",
    "UPDATE_WORKSPACE_VISIBILITY",
  ],
  MEMBERS: [
    "INVITE_MANAGE_REMOVE_WORKSPACE_MEMBER"
  ]
} as const;

const AllWorkspacePermissions = [
  ...WorkspacePermissions.CONTENT,
  ...WorkspacePermissions.SETTINGS,
  ...WorkspacePermissions.MEMBERS,
] as const;

export type WorkspacePermission = (typeof AllWorkspacePermissions)[number];

const rolePermissionSets = {
  editor: new Set<WorkspacePermission>(AllWorkspacePermissions),
  reader: new Set<WorkspacePermission>([
    "VIEW_CONTENT",
  ]),
} as const;

type PermissionObject = { [key in WorkspacePermission]: boolean };

export type WorkspaceRolePermission = {
  [key in WorkspaceRole]: PermissionObject;
};

export const workspaceRolePermissions: WorkspaceRolePermission = Object.fromEntries(
  workspaceRole.map(role => [
    role,
    Object.fromEntries(
      AllWorkspacePermissions.map(permission => [
        permission,
        rolePermissionSets[role].has(permission)
      ])
    )
  ])
) as WorkspaceRolePermission;

export function checkWorkspacePermissions(
  role: WorkspaceRole | undefined,
  permission: WorkspacePermission,
): boolean {
  if (!role) return false;
  return rolePermissionSets[role].has(permission);
}

export function getWorkspaceRolePermissions(role: WorkspaceRole): Set<WorkspacePermission> {
  return new Set(rolePermissionSets[role]);
}

export function hasAnyWorkspacePermissions(
  role: WorkspaceRole | undefined,
  permissions: WorkspacePermission[]
): boolean {
  if (!role) return false;
  return permissions.some(permission => rolePermissionSets[role].has(permission));
}

export function hasAllWorkspacePermissions(
  role: WorkspaceRole | undefined,
  permissions: WorkspacePermission[]
): boolean {
  if (!role) return false;
  return permissions.every(permission => rolePermissionSets[role].has(permission));
}

export function getWorkspacePermissionsByCategory(category: keyof typeof WorkspacePermissions): readonly WorkspacePermission[] {
  return WorkspacePermissions[category];
}

