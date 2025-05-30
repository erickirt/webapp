import "dotenv-flow/config";
import mongoDb from "@/lib/mongodb";
import { createAllIndexes, getIndexStats } from "@/lib/db/indexes";

/**
 * Database Index Creation Script
 * 
 * Run this script to create all optimized indexes for the MongoDB database.
 * Usage: npx tsx ./scripts/db/create-indexes.ts
 */

async function main() {
  console.log("🚀 Starting database index creation...\n");

  try {
    const client = await mongoDb;

    // Create all indexes
    await createAllIndexes(client);

    console.log("\n📊 Getting index statistics...");
    const stats = await getIndexStats(client);

    // Display summary
    console.log("\n📈 Index Creation Summary:");
    console.log("========================");

    for (const collectionStats of stats) {
      console.log(`\n📁 Collection: ${collectionStats.collection}`);
      console.log(`   Indexes: ${collectionStats.indexes.length}`);

      for (const index of collectionStats.indexes) {
        if (index.name !== "_id_") { // Skip default _id index
          console.log(`   - ${index.name}`);
        }
      }
    }

    console.log("\n✅ Database optimization completed successfully!");
    console.log("   Performance improvements should be visible immediately.");

  } catch (error) {
    console.error("❌ Error during index creation:", error);
    process.exit(1);
  } finally {
    console.log("\n🔚 Closing database connection...");
    process.exit(0);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n👋 Received SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
}); 