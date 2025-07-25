import { TeamRole } from "@/lib/constants/team-role";
import { databaseName } from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { OrgniseApiError, handleAndReturnErrorResponse } from "../api/errors";
import { WorkspaceRole } from "../constants/workspace-role";
import { WorkspaceMemberDBSchema, WorkspaceDbSchema } from "../db-schema/workspace.schema";
import { Plan, Team } from "../types/types";
import { Session, withTeam } from "./";

// Default access control values
const DEFAULT_REQUIRED_PLANS: Plan[] = ["free", "pro", "business", "enterprise"];
const DEFAULT_REQUIRED_TEAM_ROLES: TeamRole[] = ["owner", "member", "guest", "moderator"];
const DEFAULT_REQUIRED_WORKSPACE_ROLES: WorkspaceRole[] = ["editor", "reader"];

interface WithWorkspaceHandler {
  ({
    req,
    params,
    searchParams,
    session,
    team,
    client,
    workspace,
  }: {
    req: Request;
    params: Record<string, string>;
    searchParams: Record<string, string>;
    session: Session;
    team: Team;
    client: MongoClient;
    workspace: WorkspaceDbSchema;
  }): Promise<Response>;
}

interface WithWorkspaceOptions {
  requiredPlan?: Array<Plan>;
  requiredTeamRole?: Array<TeamRole>;
  requiredWorkspaceRole?: Array<WorkspaceRole>;
}

/**
 * Higher-order function that validates workspace access and permissions
 * @param handler - Request handler with workspace context
 * @param options - Access control requirements (plan, team role, workspace role)
 * @returns Wrapped handler with workspace validation
 */
export const withWorkspace = (
  handler: WithWorkspaceHandler,
  {
    requiredPlan = DEFAULT_REQUIRED_PLANS,
    requiredTeamRole = DEFAULT_REQUIRED_TEAM_ROLES,
    requiredWorkspaceRole = DEFAULT_REQUIRED_WORKSPACE_ROLES,
  }: WithWorkspaceOptions = {},
) => withTeam(async ({ req, params, searchParams, session, team, client }) => {
  try {
    // Validate required parameters
    if (!params.workspace_slug) {
      return handleAndReturnErrorResponse(
        new OrgniseApiError({
          code: "bad_request",
          message: "Workspace slug is required.",
        }),
      );
    }

    // Validate ObjectId formats before database operations
    const teamObjectId = validateAndCreateObjectId(team._id, "team ID");
    const userObjectId = validateAndCreateObjectId(session.user.id, "user ID");

    if (!teamObjectId || !userObjectId) {
      return handleAndReturnErrorResponse(
        new OrgniseApiError({
          code: "bad_request",
          message: "Invalid team or user ID format.",
        }),
      );
    }

    // Get database collections
    const workspaceUserColl = client
      .db(databaseName)
      .collection<WorkspaceMemberDBSchema>("workspace_users");

    const workspaceColl = client
      .db(databaseName)
      .collection<WorkspaceDbSchema>("workspaces");

    // Execute database queries in parallel for better performance
    const [workspace, workspaceMember] = await Promise.all([
      workspaceColl.findOne({
        team: teamObjectId,
        "meta.slug": params.workspace_slug,
      }),
      workspaceUserColl.findOne({
        team: teamObjectId,
        user: userObjectId,
      }),
    ]);

    // Validate workspace exists
    if (!workspace) {
      return handleAndReturnErrorResponse(
        new OrgniseApiError({
          code: "not_found",
          message: "Workspace not found.",
        }),
      );
    }

    // Validate user is workspace member
    if (!workspaceMember) {
      // Use structured logging instead of console.log to avoid exposing sensitive data
      logWorkspaceAccessDenied(team._id, session.user.id, "not_member");

      return handleAndReturnErrorResponse(
        new OrgniseApiError({
          code: "forbidden",
          message: "You are not a member of this workspace.",
        }),
      );
    }

    // Validate workspace role permissions
    if (requiredWorkspaceRole.length && !requiredWorkspaceRole.includes(workspaceMember.role)) {
      logWorkspaceAccessDenied(team._id, session.user.id, "insufficient_role", {
        userRole: workspaceMember.role,
        requiredRoles: requiredWorkspaceRole,
      });

      return handleAndReturnErrorResponse(
        new OrgniseApiError({
          code: "forbidden",
          message: `You need to be a ${requiredWorkspaceRole.join(" or ")} to perform this action. Current role: ${workspaceMember.role}`,
        }),
      );
    }

    // Call the handler with validated context
    return handler({
      req,
      params,
      searchParams,
      session,
      team,
      client,
      workspace,
    });
  } catch (error) {
    return handleAndReturnErrorResponse(error);
  }
}, {
  requiredPlan,
  requiredRole: requiredTeamRole,
});

/**
 * Validates and creates ObjectId, handling invalid formats gracefully
 */
function validateAndCreateObjectId(id: string, context: string): ObjectId | null {
  try {
    return ObjectId.isValid(id) ? new ObjectId(id) : null;
  } catch (error) {
    console.error(`Invalid ObjectId for ${context}:`, id, error);
    return null;
  }
}

/**
 * Structured logging for workspace access denials (sanitized for production)
 */
function logWorkspaceAccessDenied(
  teamId: string,
  userId: string,
  reason: string,
  metadata?: Record<string, any>
) {
  // In production, this should use a proper logging service
  // For now, we'll keep it simple but structured
  const logData = {
    event: "workspace_access_denied",
    reason,
    // Hash or truncate IDs in production for privacy
    teamId: teamId.slice(-4),
    userId: userId.slice(-4),
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  console.warn("Workspace access denied:", logData);
}


