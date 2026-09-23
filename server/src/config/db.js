import mongoose from 'mongoose';

const connectDB = async () => {
  const connString = process.env.MONGODB_URI;
  if (!connString) {
    throw new Error('FATAL CONFIGURATION ERROR: MONGODB_URI environment variable is not defined. Set MONGODB_URI in server/.env');
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // In production, ensure no default credentials and enforce TLS/SSL
  if (isProduction) {
    if (connString.includes('localhost') || connString.includes('127.0.0.1')) {
      throw new Error('DATABASE SECURITY ERROR: Production environment cannot use unauthenticated localhost database connection.');
    }
    if (connString.includes(':admin@') || connString.includes(':password@') || connString.includes(':root@')) {
      throw new Error('DATABASE SECURITY ERROR: Default or placeholder credentials detected in production MONGODB_URI.');
    }
  }

  const connectionOptions = {
    // Enforce TLS in production (automatic on mongodb+srv:// Atlas clusters)
    ...(isProduction ? { tls: true } : {}),
    serverSelectionTimeoutMS: 8000
  };

  try {
    const conn = await mongoose.connect(connString, connectionOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // Sanitize error message to ensure no connection strings or credentials leak in logs
    const safeMsg = error.message ? error.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/i, 'mongodb$1://<credentials-hidden>@') : 'Database connection failed';
    console.error(`MongoDB Connection Error: ${safeMsg}`);
    throw new Error(safeMsg, { cause: error });
  }
};

export { connectDB };
export default connectDB;
