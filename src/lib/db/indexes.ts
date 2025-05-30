import { MongoClient, ObjectId } from "mongodb";
import { databaseName } from "../mongodb";

/**
 * Database Index Management
 * 
 * This module defines and creates indexes for all MongoDB collections
 * to optimize query performance across the application.
 */

export interface IndexDefinition {
  collection: string;
  name: string;
  keys: Record<string, 1 | -1 | "text">;
  options?: {
    unique?: boolean;
    background?: boolean;
    sparse?: boolean;
    partialFilterExpression?: Record<string, any>;
  };
}

/**
 * Comprehensive index definitions for all collections
 */
export const INDEX_DEFINITIONS: IndexDefinition[] = [
  // Users collection indexes
  {
    collection: "users",
    name: "users_email_unique",
    keys: { email: 1 },
    options: { unique: true, background: true }
  },

  // Teams collection indexes
  {
    collection: "teams",
    name: "teams_createdBy",
    keys: { createdBy: 1 },
    options: { background: true }
  },
  {
    collection: "teams",
    name: "teams_inviteCode_unique",
    keys: { inviteCode: 1 },
    options: { unique: true, background: true }
  },
  {
    collection: "teams",
    name: "teams_slug",
    keys: { "meta.slug": 1 },
    options: { unique: true, background: true }
  },

  // Team users collection indexes
  {
    collection: "team-users",
    name: "teamusers_user_team_unique",
    keys: { user: 1, team: 1 },
    options: { unique: true, background: true }
  },
  {
    collection: "team-users",
    name: "teamusers_team",
    keys: { team: 1 },
    options: { background: true }
  },
  {
    collection: "team-users",
    name: "teamusers_user",
    keys: { user: 1 },
    options: { background: true }
  },
  {
    collection: "team-users",
    name: "teamusers_role",
    keys: { role: 1 },
    options: { background: true }
  },

  // Workspaces collection indexes
  {
    collection: "workspaces",
    name: "workspaces_team",
    keys: { team: 1 },
    options: { background: true }
  },
  {
    collection: "workspaces",
    name: "workspaces_slug_team_unique",
    keys: { "meta.slug": 1, team: 1 },
    options: { unique: true, background: true }
  },
  {
    collection: "workspaces",
    name: "workspaces_createdBy",
    keys: { createdBy: 1 },
    options: { background: true }
  },

  // Workspace users collection indexes
  {
    collection: "workspace_users",
    name: "workspaceusers_user_workspace_unique",
    keys: { user: 1, workspace: 1 },
    options: { unique: true, background: true }
  },
  {
    collection: "workspace_users",
    name: "workspaceusers_team",
    keys: { team: 1 },
    options: { background: true }
  },
  {
    collection: "workspace_users",
    name: "workspaceusers_workspace",
    keys: { workspace: 1 },
    options: { background: true }
  },
  {
    collection: "workspace_users",
    name: "workspaceusers_user",
    keys: { user: 1 },
    options: { background: true }
  },

  // Collections (pages and collections) indexes
  {
    collection: "collections",
    name: "collections_workspace_team",
    keys: { workspace: 1, team: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_parent_sortindex",
    keys: { parent: 1, sortIndex: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_slug_workspace_unique",
    keys: { "meta.slug": 1, workspace: 1 },
    options: { unique: true, background: true }
  },
  {
    collection: "collections",
    name: "collections_team",
    keys: { team: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_object",
    keys: { object: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_createdBy",
    keys: { createdBy: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_updatedAt",
    keys: { updatedAt: -1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_content_text",
    keys: { content: "text", name: "text" },
    options: { background: true }
  },

  // Team invites collection indexes
  {
    collection: "team-invites",
    name: "teaminvites_team",
    keys: { team: 1 },
    options: { background: true }
  },
  {
    collection: "team-invites",
    name: "teaminvites_email",
    keys: { email: 1 },
    options: { background: true }
  },

  // Compound indexes for common query patterns
  {
    collection: "collections",
    name: "collections_workspace_parent_object_sort",
    keys: { workspace: 1, parent: 1, object: 1, sortIndex: 1 },
    options: { background: true }
  },
  {
    collection: "collections",
    name: "collections_team_object",
    keys: { team: 1, object: 1 },
    options: { background: true }
  }
];

/**
 * Create all defined indexes in the database
 */
export async function createAllIndexes(client: MongoClient): Promise<void> {
  const db = client.db(databaseName);

  console.log("🔍 Creating database indexes...");

  const results = [];

  for (const indexDef of INDEX_DEFINITIONS) {
    try {
      const collection = db.collection(indexDef.collection);

      // Check if index already exists
      const existingIndexes = await collection.indexes();
      const indexExists = existingIndexes.some(index => index.name === indexDef.name);

      if (!indexExists) {
        await collection.createIndex(indexDef.keys, {
          name: indexDef.name,
          ...indexDef.options
        });

        results.push({
          collection: indexDef.collection,
          name: indexDef.name,
          status: "created"
        });

        console.log(`✅ Created index: ${indexDef.name} on ${indexDef.collection}`);
      } else {
        results.push({
          collection: indexDef.collection,
          name: indexDef.name,
          status: "exists"
        });

        console.log(`ℹ️  Index already exists: ${indexDef.name} on ${indexDef.collection}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create index ${indexDef.name} on ${indexDef.collection}:`, error);
      results.push({
        collection: indexDef.collection,
        name: indexDef.name,
        status: "error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log("🎉 Index creation completed!");
  return;
}

/**
 * Drop all indexes (for cleanup or recreation)
 */
export async function dropAllIndexes(client: MongoClient): Promise<void> {
  const db = client.db(databaseName);

  console.log("🗑️  Dropping custom indexes...");

  for (const indexDef of INDEX_DEFINITIONS) {
    try {
      const collection = db.collection(indexDef.collection);
      await collection.dropIndex(indexDef.name);
      console.log(`✅ Dropped index: ${indexDef.name} on ${indexDef.collection}`);
    } catch (error) {
      // Index might not exist, which is fine
      console.log(`ℹ️  Index ${indexDef.name} on ${indexDef.collection} doesn't exist or couldn't be dropped`);
    }
  }

  console.log("🎉 Index cleanup completed!");
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(client: MongoClient): Promise<any[]> {
  const db = client.db(databaseName);
  const stats = [];

  const collections = await db.listCollections().toArray();

  for (const collectionInfo of collections) {
    const collection = db.collection(collectionInfo.name);

    try {
      const indexStats = await collection.aggregate([
        { $indexStats: {} }
      ]).toArray();

      stats.push({
        collection: collectionInfo.name,
        indexes: indexStats
      });
    } catch (error) {
      console.log(`Could not get index stats for ${collectionInfo.name}`);
    }
  }

  return stats;
}

/**
 * Analyze slow queries (requires MongoDB profiling to be enabled)
 */
export async function getSlowQueries(client: MongoClient, limit = 10): Promise<any[]> {
  const db = client.db(databaseName);

  try {
    const slowQueries = await db.collection("system.profile")
      .find({ ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) // Last 24 hours
      .sort({ millis: -1 })
      .limit(limit)
      .toArray();

    return slowQueries;
  } catch (error) {
    console.log("Profiling not enabled or no slow queries found");
    return [];
  }
} 