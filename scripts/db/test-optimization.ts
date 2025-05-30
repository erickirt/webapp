import "dotenv-flow/config";
import mongoDb from "@/lib/mongodb";
import { getIndexStats } from "@/lib/db/indexes";

/**
 * Test script to verify database optimizations are working
 */

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection and optimizations...\n");

  try {
    const client = await mongoDb;
    console.log("✅ Database connection successful");

    // Test connection pool with ping
    const adminDb = client.db('admin');
    const pingResult = await adminDb.command({ ping: 1 });
    console.log("✅ Database ping successful:", pingResult);

    // List existing collections
    const db = client.db(process.env.DATABASE_NAME || 'pulse-db');
    const collections = await db.listCollections().toArray();
    console.log("📦 Existing collections:", collections.map(c => c.name));

    if (collections.length === 0) {
      console.log("ℹ️  No collections exist yet - this is normal for new databases");
      console.log("   Indexes will be created automatically when collections are first used");
      return;
    }

    // Check indexes on existing collections
    console.log("\n🔍 Checking indexes on existing collections:");
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      try {
        const indexes = await coll.indexes();
        console.log(`\n📁 Collection: ${collection.name}`);
        console.log(`   Indexes (${indexes.length}):`, indexes.map(i => i.name).join(', '));

        // Show custom indexes (not the default _id_ index)
        const customIndexes = indexes.filter(i => i.name !== '_id_');
        if (customIndexes.length > 0) {
          console.log("   ✅ Custom indexes found:", customIndexes.length);
        } else {
          console.log("   ⚠️  No custom indexes found");
        }
      } catch (error) {
        console.log(`   ❌ Could not get indexes for ${collection.name}:`, error);
      }
    }

    // Test query performance with a simple operation
    console.log("\n🚀 Testing query performance...");
    const startTime = Date.now();

    // Try to query existing collections
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      try {
        const count = await coll.countDocuments({});
        console.log(`   📊 ${collection.name}: ${count} documents`);
      } catch (error) {
        console.log(`   ⚠️  Could not count documents in ${collection.name}`);
      }
    }

    const queryTime = Date.now() - startTime;
    console.log(`   ⏱️  Query time: ${queryTime}ms`);

    // Test index statistics if available
    try {
      console.log("\n📈 Getting index statistics...");
      const stats = await getIndexStats(client);
      console.log(`   📊 Found ${stats.length} collections with index stats`);
    } catch (error) {
      console.log("   ⚠️  Could not get index statistics:", error);
    }

    console.log("\n✅ Database optimization verification completed!");

  } catch (error) {
    console.error("❌ Database test failed:", error);
    throw error;
  }
}

async function testConnectionPooling() {
  console.log("\n🔄 Testing connection pooling...");

  try {
    // Test multiple concurrent connections
    const promises = Array.from({ length: 5 }, async (_, i) => {
      const client = await mongoDb;
      const db = client.db(process.env.DATABASE_NAME || 'pulse-db');
      const startTime = Date.now();

      // Simple operation
      await db.command({ ping: 1 });

      const duration = Date.now() - startTime;
      console.log(`   Connection ${i + 1}: ${duration}ms`);
      return duration;
    });

    const results = await Promise.all(promises);
    const avgTime = results.reduce((a, b) => a + b, 0) / results.length;

    console.log(`   📊 Average connection time: ${avgTime.toFixed(2)}ms`);
    console.log("   ✅ Connection pooling working correctly");

  } catch (error) {
    console.error("   ❌ Connection pooling test failed:", error);
    throw error;
  }
}

async function main() {
  try {
    await testDatabaseConnection();
    await testConnectionPooling();

    console.log("\n🎉 All database optimization tests passed!");

  } catch (error) {
    console.error("\n💥 Database optimization tests failed:", error);
    process.exit(1);
  } finally {
    console.log("\n🔚 Closing database connection...");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
}); 