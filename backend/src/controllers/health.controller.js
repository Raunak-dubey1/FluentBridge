import mongoose from "mongoose";

const dbStateMap = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function checkHealth(req, res) {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbStateMap[dbState] || "unknown";
    const isHealthy = dbState === 1;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        connected: isHealthy,
      },
    });
  } catch (error) {
    console.error("Health check error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
    });
  }
}

