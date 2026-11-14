import mongoose from "mongoose";
import { ENDORSEMENT_TAGS } from "../lib/learning.js";
const schema = new mongoose.Schema({
  endorser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true, lowercase: true, trim: true },
  tags: [{ type: String, enum: ENDORSEMENT_TAGS }],
  notes: { type: String, maxlength: 200, default: "" },
}, { timestamps: true });
schema.index({ endorser: 1, recipient: 1, language: 1 }, { unique: true });
export const Endorsement = mongoose.model("Endorsement", schema);
