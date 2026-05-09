import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 1. JOHN SENDS A REQUEST TO DOE/DORA
  socket.on("send_friend_request", async (targetEmail) => {
  console.log("SERVER RECEIVED REQUEST FOR:", targetEmail); // <-- Add this!

  const targetUser = await User.findOne({ email: targetEmail.toLowerCase() });
  
  if (!targetUser) {
    console.log("USER NOT FOUND IN DB");
    return socket.emit("error_message", "User not found.");
  }

  const targetSocketId = getReceiverSocketId(targetUser._id.toString());
  console.log("TARGET SOCKET ID FOUND:", targetSocketId); // Is this undefined?

  if (targetSocketId) {
    io.to(targetSocketId).emit("receive_friend_request", {
      senderId: userId,
      senderName: socket.user.fullName,
    });
  }
});

  // 2. DOE ACCEPTS OR DORA REJECTS
  socket.on("respond_to_request", async ({ senderId, status }) => {
  try {
    if (status === "accepted") {
      // 1. UPDATE DATABASE (Example: adding IDs to each other's contact arrays)
      // This part depends on your User model structure!
      await User.findByIdAndUpdate(socket.userId, { $addToSet: { contacts: senderId } });
      await User.findByIdAndUpdate(senderId, { $addToSet: { contacts: socket.userId } });

      // 2. GET FULL USER OBJECTS (to update the UI)
      const senderUser = await User.findById(senderId).select("-password");
      const receiverUser = await User.findById(socket.userId).select("-password");

      // 3. TELL DOE (The one who accepted) to add John to his list
      socket.emit("contact_added_successfully", senderUser);

      // 4. TELL JOHN (The requester) to add Doe to his list
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("contact_added_successfully", receiverUser);
      }
    }
  } catch (error) {
    console.error("Error finalizing friendship:", error);
  }
});


  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };
