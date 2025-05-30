import { MongoClient, ObjectId } from "mongodb";
import { databaseName } from "../mongodb";
import { CollectionDbSchema } from "../db-schema/collection.schema";
import { TeamDbSchema, TeamMemberDbSchema } from "../db-schema/team.schema";
import { WorkspaceDbSchema, WorkspaceMemberDBSchema } from "../db-schema/workspace.schema";

/**
 * Query Optimization Utilities
 * 
 * This module provides optimized query patterns to reduce database calls
 * and improve performance by batching operations and using efficient aggregations.
 */

export interface QueryPerformanceMetrics {
  queryCount: number;
  startTime: number;
  endTime?: number;
  duration?: number;
  queries: Array<{
    collection: string;
    operation: string;
    timestamp: number;
  }>;
}

class QueryOptimizer {
  private client: MongoClient;
  private metrics: QueryPerformanceMetrics;

  constructor(client: MongoClient) {
    this.client = client;
    this.metrics = {
      queryCount: 0,
      startTime: Date.now(),
      queries: []
    };
  }

  private trackQuery(collection: string, operation: string) {
    this.metrics.queryCount++;
    this.metrics.queries.push({
      collection,
      operation,
      timestamp: Date.now()
    });
  }

  /**
   * Get collections with optimized aggregation that includes workspace info
   */
  async getCollectionsWithWorkspace(teamId: string, workspaceId: string): Promise<CollectionDbSchema[]> {
    this.trackQuery('collections', 'aggregateWithWorkspace');

    const db = this.client.db(databaseName);
    const collections = db.collection<CollectionDbSchema>('collections');

    const results = await collections.aggregate([
      {
        $match: {
          team: new ObjectId(teamId),
          workspace: new ObjectId(workspaceId)
        }
      },
      {
        $lookup: {
          from: 'workspaces',
          localField: 'workspace',
          foreignField: '_id',
          as: 'workspaceInfo'
        }
      },
      {
        $unwind: {
          path: '$workspaceInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { sortIndex: 1, createdAt: 1 }
      }
    ]).toArray();

    return results as CollectionDbSchema[];
  }

  /**
   * Batch fetch collections by multiple workspace IDs
   */
  async batchGetCollectionsByWorkspaces(teamId: string, workspaceIds: string[]): Promise<Record<string, CollectionDbSchema[]>> {
    this.trackQuery('collections', 'batchByWorkspaces');

    const db = this.client.db(databaseName);
    const collections = db.collection<CollectionDbSchema>('collections');

    const results = await collections.aggregate([
      {
        $match: {
          team: new ObjectId(teamId),
          workspace: { $in: workspaceIds.map(id => new ObjectId(id)) }
        }
      },
      {
        $sort: { workspace: 1, sortIndex: 1, createdAt: 1 }
      },
      {
        $group: {
          _id: '$workspace',
          collections: { $push: '$$ROOT' }
        }
      }
    ]).toArray();

    // Convert to Record format
    const groupedResults: Record<string, CollectionDbSchema[]> = {};
    for (const result of results) {
      groupedResults[result._id.toString()] = result.collections;
    }

    return groupedResults;
  }

  /**
   * Get team with members and usage stats in a single optimized query
   */
  async getTeamWithMembersAndStats(teamId: string, userId: string): Promise<any> {
    this.trackQuery('team-users', 'aggregateTeamWithStats');

    const db = this.client.db(databaseName);
    const teamUsers = db.collection<TeamMemberDbSchema>('team-users');

    const result = await teamUsers.aggregate([
      {
        $match: {
          user: new ObjectId(userId),
          team: new ObjectId(teamId)
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'team'
        }
      },
      {
        $unwind: '$team'
      },
      {
        $lookup: {
          from: 'team-users',
          localField: 'team._id',
          foreignField: 'team',
          as: 'allMembers'
        }
      },
      {
        $lookup: {
          from: 'collections',
          let: { teamId: '$team._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$team', '$$teamId'] },
                    { $eq: ['$object', 'item'] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'pageCount'
        }
      },
      {
        $lookup: {
          from: 'workspaces',
          let: { teamId: '$team._id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$team', '$$teamId'] }
              }
            },
            { $count: 'count' }
          ],
          as: 'workspaceCount'
        }
      },
      {
        $addFields: {
          'team.membersCount': { $size: '$allMembers' },
          'team.pagesCount': { $ifNull: [{ $arrayElemAt: ['$pageCount.count', 0] }, 0] },
          'team.workspacesCount': { $ifNull: [{ $arrayElemAt: ['$workspaceCount.count', 0] }, 0] }
        }
      },
      {
        $project: {
          allMembers: 0,
          pageCount: 0,
          workspaceCount: 0
        }
      }
    ]).toArray();

    return result[0] || null;
  }

  /**
   * Batch fetch teams with all their data for a user
   */
  async getUserTeamsWithData(userId: string): Promise<any[]> {
    this.trackQuery('team-users', 'aggregateUserTeams');

    const db = this.client.db(databaseName);
    const teamUsers = db.collection<TeamMemberDbSchema>('team-users');

    return await teamUsers.aggregate([
      {
        $match: {
          user: new ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'teamData'
        }
      },
      {
        $unwind: '$teamData'
      },
      {
        $lookup: {
          from: 'team-users',
          localField: 'team',
          foreignField: 'team',
          as: 'allMembers'
        }
      },
      {
        $lookup: {
          from: 'workspaces',
          localField: 'team',
          foreignField: 'team',
          as: 'workspaces'
        }
      },
      {
        $addFields: {
          'teamData.membersCount': { $size: '$allMembers' },
          'teamData.workspacesCount': { $size: '$workspaces' },
          'teamData.userRole': '$role',
          'teamData.joinedAt': '$createdAt'
        }
      },
      {
        $replaceRoot: {
          newRoot: '$teamData'
        }
      },
      {
        $sort: { joinedAt: -1 }
      }
    ]).toArray();
  }

  /**
   * Get workspace with members in a single query
   */
  async getWorkspaceWithMembers(teamId: string, workspaceSlug: string): Promise<any> {
    this.trackQuery('workspaces', 'aggregateWithMembers');

    const db = this.client.db(databaseName);
    const workspaces = db.collection<WorkspaceDbSchema>('workspaces');

    const result = await workspaces.aggregate([
      {
        $match: {
          team: new ObjectId(teamId),
          'meta.slug': workspaceSlug
        }
      },
      {
        $lookup: {
          from: 'workspace_users',
          localField: '_id',
          foreignField: 'workspace',
          as: 'members'
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { memberUserIds: '$members.user' },
          pipeline: [
            {
              $match: {
                $expr: { $in: ['$_id', '$$memberUserIds'] }
              }
            },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                image: 1
              }
            }
          ],
          as: 'memberUsers'
        }
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'member',
              in: {
                $mergeObjects: [
                  '$$member',
                  {
                    user: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$memberUsers',
                            cond: { $eq: ['$$this._id', '$$member.user'] }
                          }
                        },
                        0
                      ]
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          memberUsers: 0
        }
      }
    ]).toArray();

    return result[0] || null;
  }

  /**
   * Batch delete collections and their children efficiently
   */
  async batchDeleteCollectionsWithChildren(teamId: string, parentIds: string[]): Promise<{ deletedCount: number }> {
    this.trackQuery('collections', 'batchDeleteWithChildren');

    const db = this.client.db(databaseName);
    const collections = db.collection<CollectionDbSchema>('collections');

    // First, find all descendant IDs recursively
    const allIdsToDelete = new Set<string>();

    // Add parent IDs
    parentIds.forEach(id => allIdsToDelete.add(id));

    // Recursively find children
    let currentLevel = parentIds.map(id => new ObjectId(id));

    while (currentLevel.length > 0) {
      const children = await collections.find({
        team: new ObjectId(teamId),
        parent: { $in: currentLevel }
      }, { projection: { _id: 1 } }).toArray();

      if (children.length === 0) break;

      currentLevel = children.map(child => child._id);
      children.forEach(child => allIdsToDelete.add(child._id.toString()));
    }

    // Delete all at once
    const deleteResult = await collections.deleteMany({
      team: new ObjectId(teamId),
      _id: { $in: Array.from(allIdsToDelete).map(id => new ObjectId(id)) }
    });

    return { deletedCount: deleteResult.deletedCount || 0 };
  }

  /**
   * Get performance metrics for this query session
   */
  getMetrics(): QueryPerformanceMetrics {
    return {
      ...this.metrics,
      endTime: Date.now(),
      duration: Date.now() - this.metrics.startTime
    };
  }

  /**
   * Reset metrics for a new query session
   */
  resetMetrics(): void {
    this.metrics = {
      queryCount: 0,
      startTime: Date.now(),
      queries: []
    };
  }
}

/**
 * Factory function to create a query optimizer instance
 */
export function createQueryOptimizer(client: MongoClient): QueryOptimizer {
  return new QueryOptimizer(client);
}

/**
 * Performance monitoring wrapper for database operations
 */
export async function withQueryMetrics<T>(
  client: MongoClient,
  operation: (optimizer: QueryOptimizer) => Promise<T>
): Promise<{ result: T; metrics: QueryPerformanceMetrics }> {
  const optimizer = createQueryOptimizer(client);

  const result = await operation(optimizer);
  const metrics = optimizer.getMetrics();

  // Log performance metrics in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Query Performance: ${metrics.queryCount} queries in ${metrics.duration}ms`);

    if (metrics.queryCount > 5) {
      console.warn(`⚠️  High query count detected: ${metrics.queryCount} queries`);
    }
  }

  return { result, metrics };
} 