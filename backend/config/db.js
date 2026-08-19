const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (mongoUri) {
    // Mask password for clean logs
    const maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');
    console.log(`[Database] Attempting connection to MongoDB Atlas / Configured URI: ${maskedUri}`);

    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log(`[Database] ✅ Connected successfully to MongoDB Atlas (${mongoose.connection.name} database)`);
      return;
    } catch (err) {
      console.error(`[Database] ❌ Failed to connect to configured MongoDB URI:`, err.message);
      // Explicitly throw error so server fails fast rather than using memory server fallback
      throw err;
    }
  }

  // Fallback to local / in-memory server ONLY if no MONGO_URI or MONGODB_URI is provided
  console.log(`[Database] No MONGO_URI provided in env. Starting In-Memory Mongo Server...`);
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoMemoryServer = await MongoMemoryServer.create();
  const memoryUri = mongoMemoryServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`[Database] Connected to In-Memory MongoDB Server at ${memoryUri}`);
};

module.exports = connectDB;
