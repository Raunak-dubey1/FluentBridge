import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { LEVELS, GOALS, normalizeLanguages } from "../lib/learning.js";
const learningLanguageSchema = new mongoose.Schema({
  language: { type: String, required: true, trim: true, lowercase: true },
  level: { type: String, enum: LEVELS, default: "A1" },
  goal: { type: String, enum: GOALS, default: GOALS[0] },
  isVerified: { type: Boolean, default: false },
  stats: {
    callMinutes: { type: Number, default: 0, min: 0 },
    messagesSent: { type: Number, default: 0, min: 0 },
    endorsementsCount: { type: Number, default: 0, min: 0 },
  },
}, { _id: false });
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8 },
  bio: { type: String, default: "", maxlength: 1000 },
  profilePic: { type: String, default: "" },
  nativeLanguage: String,
  learningLanguage: String,
  nativeLanguages: { type: [String], default: [] },
  learningLanguages: { type: [learningLanguageSchema], default: [] },
  interests: { type: [String], default: [] },
  availability: { type: [String], default: ["Flexible"] },
  location: { type: String, default: "", maxlength: 150 },
  timezone: { type: String, default: "", maxlength: 100 },
  isOnboarded: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true, optimisticConcurrency: true });
userSchema.post("init", function (doc) { normalizeLanguages(doc); });
userSchema.pre("validate", function () { normalizeLanguages(this); });
userSchema.pre("save", async function () {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.checkPassword = function (password) { return bcrypt.compare(password, this.password); };
userSchema.set("toJSON", { transform(_doc, result) { delete result.password; return result; } });
export const User = mongoose.model("User", userSchema);
