import express from "express";
import dotenv from "dotenv";
import dns from "node:dns";
import path from "path"

import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import healthRoute from "./routes/health.route.js";
import { streamWebhook, completeCall } from "./controllers/practice.controller.js";
import { protectRoute } from "./middleware/auth.middleware.js";


import cors from "cors"
import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";

dotenv.config();
// Optional override for networks whose DNS cannot resolve MongoDB SRV records.
if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map(server => server.trim()).filter(Boolean));
}
const PORT=process.env.PORT;
const app=express();

const __dirname=path.resolve();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true //allow frontend to send the cookies
}))
app.post("/api/webhooks/stream", express.raw({ type: "application/json", limit: "1mb" }), streamWebhook);
app.use(express.json());
app.use(cookieParser());
app.post("/api/calls/complete", protectRoute, completeCall);

app.use("/api/auth",authRoute)
app.use("/api/users",userRoute)
app.use("/api/chat",chatRoute)
app.use("/api/health",healthRoute)
app.use("/health",healthRoute)
// Unknown API paths must never fall through to the frontend HTML response.
app.use("/api", (_req, res) => res.status(404).json({ message: "API endpoint not found" }));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*splat}", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../frontend/dist/index.html")
    );
  });
}


app.listen(PORT,()=>{
    console.log(`Server started at Port:${PORT}`);
    connectDB();
})

