import dns from 'node:dns/promises';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import express from "express";
import cookieParser from 'cookie-parser'
import { ENV } from "./lib/env.js";
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import cors from "cors"
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;
// --- Place this at the top of your server configuration file ---
const webpush = require('web-push');

// Identify your application server securely using environment variables
webpush.setVapidDetails(
  'dipoakanji57@@gmail.com', // Replace with your support email string
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);


// Declare the broadcast execution layer globally
const sendOfflinePushNotification = (userSubscriptionObject, senderName, rawText) => {
  if (!userSubscriptionObject) return;

  const shortText = rawText && rawText.length > 35 
    ? rawText.substring(0, 32) + "..." 
    : rawText || "📷 Sent an attachment";
  
  const payload = JSON.stringify({
    title: `New Message from ${senderName}`,
    body: shortText,
    icon: '/logo192.png' // Matches your public root asset name mapping
  });

  webpush.sendNotification(userSubscriptionObject, payload)
    .catch(err => console.error("WebPush service layer error:", err));
};

// Export the module utility if using split controller files
module.exports = { sendOfflinePushNotification };


app.use(express.json({ limit: "1gb" }));

app.use((req, res, next) => {
  const size = req.headers['content-length'];
  if (size) {
    console.log(`Incoming request size: ${size} bytes`);
  }
  next();
});


// 1. Updated CORS to expose Content-Length
app.use(cors({
  origin: ENV.CLIENT_URL,
  credentials: true,
  exposedHeaders: ['Content-Length'] 
}));

// 2. Added Response Padding Middleware
// This ensures the progress bar has enough data to "track" smoothly



app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
