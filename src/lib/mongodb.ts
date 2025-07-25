import { MongoClient, MongoClientOptions } from "mongodb";

export const DbCollections = {
  USER: "users",
  TEAM: "teams",
  TEAM_USER: "team-users",
  TEAM_INVITE: "team-invites",
  WORKSPACE: "workspaces",
  WORKSPACE_USER: "workspace_users",
  COLLECTION: "collections",
} as const;

type CollectionType = typeof DbCollections[keyof typeof DbCollections];
export function collections<T extends object>(client: MongoClient, c: CollectionType) {
  return client.db(databaseName).collection<T>(c);
}

export const databaseName = process.env.DATABASE_NAME ?? "pulse-db";
const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/pulse-db" as string;

// Optimized MongoDB connection options for performance
const options: MongoClientOptions = {
  // Connection Pool Settings
  maxPoolSize: 50, // Maximum number of connections in the connection pool
  minPoolSize: 5,  // Minimum number of connections in the connection pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity

  // Timeouts
  serverSelectionTimeoutMS: 5000, // How long to try to find a server
  socketTimeoutMS: 45000, // How long to wait for a response from server
  connectTimeoutMS: 10000, // How long to wait for initial connection

  // Heartbeat and monitoring
  heartbeatFrequencyMS: 10000, // How often to check server status

  // Write concern
  retryWrites: true, // Retry writes on transient errors

  // Read preference (can be adjusted based on needs)
  readPreference: 'primaryPreferred', // Read from primary, fallback to secondary

  // Compression
  compressors: ['zlib'], // Enable compression for better network performance

  // Connection monitoring
  monitorCommands: process.env.NODE_ENV === 'development', // Monitor commands in development
};

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

class Singleton {
  private static _instance: Singleton;
  private client: MongoClient;
  private clientPromise: Promise<MongoClient>;

  private constructor() {
    this.client = new MongoClient(uri, options);
    this.clientPromise = this.client.connect();

    // Add connection event listeners for monitoring
    this.client.on('open', () => {
      console.log('📦 MongoDB connection established');
    });

    this.client.on('close', () => {
      console.log('📦 MongoDB connection closed');
    });

    this.client.on('error', (error) => {
      console.error('📦 MongoDB connection error:', error);
    });

    if (process.env.NODE_ENV === "development") {
      // In development mode, use a global variable so that the value
      // is preserved across module reloads caused by HMR (Hot Module Replacement).
      global._mongoClientPromise = this.clientPromise;

      // Log connection pool stats in development
      this.client.on('connectionPoolCreated', () => {
        console.log('📦 MongoDB connection pool created');
      });

      this.client.on('connectionPoolCleared', () => {
        console.log('📦 MongoDB connection pool cleared');
      });
    }
  }

  public static get instance() {
    if (!this._instance) {
      this._instance = new Singleton();
    }
    return this._instance.clientPromise;
  }

  // Method to get connection pool stats for monitoring
  public static async getPoolStats(): Promise<any> {
    try {
      const client = await this.instance;
      // Use db.admin().ping() to check connection status
      await client.db('admin').command({ ping: 1 });
      return {
        isConnected: true,
        connectionStatus: 'active'
      };
    } catch (error) {
      console.error('Error getting pool stats:', error);
      return {
        isConnected: false,
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

const clientPromise = Singleton.instance;

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;