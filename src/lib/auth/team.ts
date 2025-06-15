import { TeamRole } from "@/lib/constants/team-role";
import mongodb, { collections, databaseName } from "@/lib/mongodb";
import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { OrgniseApiError, handleAndReturnErrorResponse } from "../api/errors";
import { TeamMemberDbSchema, TeamDbSchema, TeamInviteDbSchema } from "../db-schema/team.schema";
import { Invite, Plan, Team } from "../types/types";
import { getSearchParams } from "../url";
import { hasValue } from "../utils";
import { Session, generateSession } from "./";
import { fetchDecoratedTeam } from "../api";

interface WithTeamHandler {
  ({
    req,
    params,
    searchParams,
    headers,
    session,
    team,
  }: {
    req: Request;
    params: Record<string, string>;
    searchParams: Record<string, string>;
    headers?: Record<string, string>;
    session: Session;
    team: Team;
    client: MongoClient;
  }): Promise<Response>;
}

interface WithTeamOptions {
  requiredPlan?: Array<Plan>;
  requiredRole?: Array<TeamRole>;
}

interface TeamAuthContext {
  client: MongoClient;
  session: Session;
  teamSlug: string;
  searchParams: Record<string, string>;
}

// Helper function to validate team slug
const validateTeamSlug = (teamSlug: string | undefined): string => {
  if (!teamSlug) {
    throw new OrgniseApiError({
      code: "bad_request",
      message: "Team slug not found. Did you forget to include a `team_slug` query parameter?",
    });
  }
  return teamSlug;
};

// Helper function to fetch team from database
const fetchTeamFromDatabase = async (
  client: MongoClient,
  teamSlug: string
): Promise<TeamDbSchema> => {
  const teamsCollection = collections<TeamDbSchema>(client, "teams");
  const teamInDb = await teamsCollection.findOne({
    "meta.slug": teamSlug,
  });

  if (!teamInDb) {
    throw OrgniseApiError.NOT_FOUND("Team not found");
  }

  return teamInDb;
};

// Helper function to handle team invites
const handleTeamInvite = async (
  client: MongoClient,
  teamId: ObjectId,
  userEmail: string
): Promise<Response> => {
  const inviteCollection = collections<TeamInviteDbSchema>(client, "team-invites");
  const invites = await inviteCollection
    .aggregate([
      {
        $match: {
          email: userEmail,
          team: teamId,
        },
      },
      {
        $lookup: {
          from: "teams",
          localField: "team",
          foreignField: "_id",
          as: "team",
        },
      },
      {
        $unwind: {
          path: "$team",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          email: 1,
          expires: 1,
          role: 1,
          createdAt: 1,
          team: {
            _id: 1,
            name: 1,
            plan: 1,
            description: 1,
            meta: 1,
          },
        },
      },
    ])
    .toArray() as Invite[];

  const invite = invites?.[0];
  if (!invite) {
    throw new OrgniseApiError({
      code: "not_found",
      message: "Team not found",
    });
  }

  if (invite.expires < new Date()) {
    return NextResponse.json(
      {
        success: false,
        message: "Team invite expired",
        error: "Operation failed",
        invite: invite,
      },
      { status: 410 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "Team invite pending",
      error: "Operation failed",
      invite: invite,
    },
    { status: 409 }
  );
};

// Helper function to validate team permissions
const validateTeamPermissions = (
  team: Team,
  requiredRole: Array<TeamRole>,
  requiredPlan: Array<Plan>
): void => {
  // Role validation
  if (requiredRole.length > 0 && !requiredRole.includes(team.role)) {
    throw new OrgniseApiError({
      code: "forbidden",
      message: "Unauthorized: Insufficient permissions",
    });
  }

  // Plan validation
  const teamPlan = team.plan ?? "free";
  if (!requiredPlan.includes(teamPlan)) {
    throw new OrgniseApiError({
      code: "forbidden",
      message: "Unauthorized: Need higher plan.",
    });
  }
};

// Helper function to get team with user context
const getTeamWithUserContext = async (
  context: TeamAuthContext,
  teamDbData: TeamDbSchema
): Promise<Team> => {
  const { client, session, teamSlug } = context;

  const team = await fetchDecoratedTeam(
    client,
    teamDbData._id.toString(),
    session.user.id
  );

  if (!team) {
    // Handle team invite scenario
    const inviteResponse = await handleTeamInvite(
      client,
      teamDbData._id,
      session.user.email
    );

    // If we get here, it means we need to return the invite response
    // This will be caught by the main function and returned
    throw { inviteResponse };
  }

  return team;
};

export const withTeam =
  (
    handler: WithTeamHandler,
    {
      requiredPlan = ["free", "pro", "business", "enterprise"],
      requiredRole = ["owner", "member", "guest", "moderator"],
    }: WithTeamOptions = {}
  ) =>
    async (
      req: Request,
      { params }: { params: Record<string, string> | undefined }
    ) => {
      try {
        const searchParams = getSearchParams(req.url);
        const teamSlug = validateTeamSlug(params?.team_slug);

        const client = await mongodb;
        const session = await generateSession(req, client);

        const context: TeamAuthContext = {
          client,
          session,
          teamSlug,
          searchParams,
        };

        // Fetch team from database
        const teamDbData = await fetchTeamFromDatabase(client, teamSlug);

        // Get team with user context (handles invites internally)
        const team = await getTeamWithUserContext(context, teamDbData);

        // Validate permissions
        validateTeamPermissions(team, requiredRole, requiredPlan);

        // Execute the handler
        return handler({
          req,
          params: params || {},
          searchParams,
          session,
          team,
          client,
        });
      } catch (error) {
        // Handle special case for invite responses
        if (error && typeof error === 'object' && 'inviteResponse' in error) {
          return (error as any).inviteResponse;
        }

        return handleAndReturnErrorResponse(error);
      }
    };

