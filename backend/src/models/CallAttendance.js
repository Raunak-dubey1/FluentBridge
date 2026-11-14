import mongoose from "mongoose";
const schema = new mongoose.Schema({
  callId: { type: String, required: true },
  sessionId: { type: String, required: true },
  participantSessionId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, required: true },
  leftAt: { type: Date, required: true },
}, { timestamps: true });
schema.index({ sessionId: 1, participantSessionId: 1, joinedAt: 1 }, { unique: true });
schema.index({ callId: 1, sessionId: 1 });
export const CallAttendance = mongoose.model("CallAttendance", schema);
