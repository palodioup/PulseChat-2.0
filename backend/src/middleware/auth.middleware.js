import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import { ENV } from "../lib/env.js"

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt
    if (!token) {
      return res.status(401).json({ message: "Unauthorised - No token provided" })
    } 

    const decoded = jwt.verify(token, ENV.JWT_SECRET)
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorised - Invalid provided" })
    }

    const user = await User.findById(decoded.userId).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in protectRoute MiddleWare: ", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};