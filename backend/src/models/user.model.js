import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  profilePic: {
      type: String,
      default: "",
    },
  friendRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted"], default: "pending" }
  }]
}, { timestamps: true });


const User = mongoose.model('User', userSchema);

export default User;