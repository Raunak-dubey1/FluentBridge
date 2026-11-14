import mongoose from "mongoose";
const schema = new mongoose.Schema({
  source: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  peer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true },
  callId: String,
  kind: { type: String, enum: ["call", "message"], required: true },
  amount: { type: Number, required: true, min: 0 },
}, { timestamps: true });
schema.index({ source: 1, user: 1 }, { unique: true });
schema.index({ user: 1, peer: 1, kind: 1 });
export const PracticeCredit = mongoose.model("PracticeCredit", schema);
