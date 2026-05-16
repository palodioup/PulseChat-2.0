import Message from "../models/message.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId } from "../lib/socket.js";
import { io } from "../lib/socket.js";
import axios from "axios"; // 🌟 Imported axios client to communicate with your Go service

// controllers/message.controller.js
export const getAllContacts = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the logged-in user and populate their contacts array
    const user = await User.findById(userId).populate("contacts", "-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    // Return only the specifically added contacts
    res.status(200).json(user.contacts || []);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    // 1. Rename to 'allMessages' to be 100% sure it doesn't conflict with function names
    const allMessages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // 2. Log this in your terminal to see if the DB found anything
    console.log(`Querying conversation between ${myId} and ${userToChatId}`);
    console.log("Messages found:", allMessages);

    // 3. Force it to be an array. If it's null/undefined, send []
    res.status(200).json(allMessages || []);
  } catch (error) {
    console.log("Error in getMessages controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // 1. Get the current user and their valid contacts list first
    const currentUser = await User.findById(loggedInUserId).select("contacts");
    const validContactIds = currentUser.contacts.map((id) => id.toString());

    // 2. Find messages involving the logged-in user
    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    // 3. Extract partner IDs
    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString(),
        ),
      ),
    ];

    // 4. FILTER: Only return partners who are STILL in your contacts list
    const chatPartners = await User.find({
      _id: { $in: chatPartnerIds, $in: validContactIds }, // Must be in both!
    }).select("-password");

    res.status(200).json(chatPartners);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res
        .status(400)
        .json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replyTo || null, 
    });

    await newMessage.save();

    // Check if receiver is online via active WebSocket registries
    const receiverSocketId = getReceiverSocketId(receiverId);
    
    if (receiverSocketId) {
      // 🟢 CASE A: Recipient is online. Push standard WebSocket events instantly
      io.to(receiverSocketId).emit("newMessage", newMessage);
    } else {
      // 🔵 CASE B: RECIPIENT APP TAB IS CLOSED! Trigger Go microservice on port 5000
      console.log(`User ${receiverId} is offline. Fetching push credentials...`);
      
      const receiverProfile = await User.findById(receiverId).select("pushSubscription");
      const senderProfile = await User.findById(senderId).select("fullName");

      // Verify the user has authorized browser desktop keys mapped inside MongoDB
      if (receiverProfile && receiverProfile.pushSubscription && receiverProfile.pushSubscription.endpoint) {
        console.log(`Forwarding offline text package packet to Go push-service...`);
        
        axios.post("http://localhost:5000/api/send-offline-push", {
          subscription: receiverProfile.pushSubscription, // Cryptographic endpoint parameters
          senderName: senderProfile?.fullName || "PulseChat User",
          text: text || "" // Handles empty textual context safely for image payloads
        })
        .then(() => console.log("Offline background push payload executed by Go service successfully."))
        .catch((err) => console.error("Node backend failed to route push data packet to Go microservice:", err.message));
      } else {
        console.log(`No active push subscription parameters discovered for User: ${receiverId}`);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeContact = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    // 1. Remove from MY list
    await User.findByIdAndUpdate(myId, { $pull: { contacts: userId } });

    // 2. Remove ME from THEIR list (Two-way removal)
    await User.findByIdAndUpdate(userId, { $pull: { contacts: myId } });

    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("contact_removed", {
        userId: req.user._id,
        userName: req.user.fullName,
      });
    }

    res.status(200).json({ message: "Removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
