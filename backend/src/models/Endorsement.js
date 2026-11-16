import mongoose from "mongoose";
import { ENDORSEMENT_TAGS } from "../lib/learning.js";
const schema = new mongoose.Schema({
  endorser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true, lowercase: true, trim: true },
  rating: { type: Number, min: 1, max: 10, default: 10 },
  suggestion: { type: String, maxlength: 300, default: "" },
  xpAwarded: { type: Number, default: 0 },
  callId: { type: String, default: "" },
  tags: [{ type: String, enum: ENDORSEMENT_TAGS }],
  notes: { type: String, maxlength: 300, default: "" },
  isLegacyEndorsement: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ recipient: 1, language: 1, createdAt: -1 });
schema.index({ endorser: 1, recipient: 1 });
export const Endorsement = mongoose.model("Endorsement", schema);
