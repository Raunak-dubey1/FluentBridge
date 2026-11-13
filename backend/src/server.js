import express from "express";
import dotenv from "dotenv";
import path from "path"

import authRoute from "./routes/auth.route.js";
import userRoute from "./routes/user.route.js";
import chatRoute from "./routes/chat.route.js";
import healthRoute from "./routes/health.route.js";


import cors from "cors"
import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";

dotenv.config();
const PORT=process.env.PORT;
const app=express();

const __dirname=path.resolve();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true //allow frontend to send the cookies
}))
app.use(express.json()); 
app.use(cookieParser());

app.use("/api/auth",authRoute)
app.use("/api/users",userRoute)
app.use("/api/chat",chatRoute)
app.use("/api/health",healthRoute)
app.use("/health",healthRoute)

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

