// db/index.js
import mongoose from "mongoose";

export async function connectDb() {
  console.log("process.env.MONGODB_URI===", process.env.MONGODB_URI);
  if (mongoose.connection.readyState === 1) {
    // already connected
    return mongoose.connection;
  }
  return mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then((conn) => {
      console.log("✅ MongoDB connected");
      return conn;
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err)
      throw err;
    });
}
