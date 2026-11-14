import mongoose from "mongoose";
import { User } from "../models/User.js";
import { PracticeCredit } from "../models/PracticeCredit.js";
import { CallAttendance } from "../models/CallAttendance.js";
import { apiError, restoreStats } from "./profile.controller.js";
import { badRequest, key, text } from "../lib/learning.js";
import { directParticipants, overlapMinutes, verifyStreamSignature } from "../lib/practice.js";

async function creditCall(callId, sessionId, userId, peerId, language) {
  const rows = await CallAttendance.find({ callId, sessionId });
  const own = rows.filter(r => String(r.user) === String(userId));
  const peer = rows.filter(r => String(r.user) === peerId);
  if (!own.length || !peer.length) return { pending: true, message: "Waiting for Stream to confirm both participants' attendance" };
  const minutes = overlapMinutes(own, peer);
  let updated;
  await mongoose.connection.transaction(async session => {
    updated = await User.findById(userId).select("-password").session(session);
    const partner = await User.findById(peerId).select("nativeLanguages nativeLanguage").session(session);
    if (!updated || !partner || !updated.friends.some(f => String(f) === peerId)) return;
    // One language per learner per session; use the first eligible language consistently.
    const entry = updated.learningLanguages.find(l => partner.nativeLanguages.some(n => key(n) === l.language));
    if (!entry) return;
    if (language && language !== entry.language) throw badRequest("This session is credited to your first eligible learning language");
    const source = `call:${sessionId}`;
    const existing = await PracticeCredit.findOne({ source, user: updated._id }).session(session);
    if (existing && existing.language !== entry.language) return;
    if (!existing) await PracticeCredit.create([{ source, user: updated._id, peer: peerId, language: entry.language, callId, kind: "call", amount: minutes }], { session });
    else if (minutes > existing.amount) { existing.amount = minutes; await existing.save({ session }); }
    await restoreStats(updated, entry, session);
    await updated.save({ session });
  });
  return { pending: false, callMinutes: minutes, user: updated };
}

export async function streamWebhook(req, res) {
  if (!verifyStreamSignature(req.body, req.get("x-signature"), process.env.STREAM_API_SECRET)) return res.status(401).json({ message: "Invalid webhook signature" });
  try {
    const event = JSON.parse(req.body.toString("utf8"));
    if (event.type === "call.session_participant_left") {
      const callId = event.call_cid?.replace(/^default:/, "");
      const ids = directParticipants(callId);
      const userId = event.participant?.user?.id;
      if (ids?.includes(userId) && event.session_id && event.participant.user_session_id) {
        const leftAt = new Date(event.created_at);
        const joinedAt = new Date(Math.max(+new Date(event.participant.joined_at), +leftAt - Number(event.duration_seconds) * 1000));
        if (Number.isFinite(+leftAt) && Number.isFinite(+joinedAt) && leftAt >= joinedAt) {
          await CallAttendance.updateOne({ sessionId: event.session_id, participantSessionId: event.participant.user_session_id, joinedAt }, { $setOnInsert: { callId, user: userId }, $max: { leftAt } }, { upsert: true });
          for (const id of ids) await creditCall(callId, event.session_id, id, ids.find(peer => peer !== id));
        }
      }
    }
    if (event.type === "message.new" && event.message?.id && event.message?.text?.trim()) {
      const ids = directParticipants(event.channel_id || event.cid?.replace(/^messaging:/, ""));
      const userId = event.message.user?.id || event.user?.id;
      const language = key(event.message.practice_language);
      if (ids?.includes(userId) && language) {
        const peerId = ids.find(id => id !== userId);
        await mongoose.connection.transaction(async session => {
          const user = await User.findById(userId).select("-password").session(session);
          const peer = await User.findById(peerId).select("nativeLanguages nativeLanguage").session(session);
          const entry = user?.learningLanguages.find(l => l.language === language);
          if (!entry || !peer?.nativeLanguages.some(n => key(n) === language) || !user.friends.some(f => String(f) === peerId)) return;
          const source = `message:${event.message.id}`;
          if (await PracticeCredit.exists({ source, user: userId }).session(session)) return;
          await PracticeCredit.create([{ source, user: userId, peer: peerId, language, kind: "message", amount: 1 }], { session });
          await restoreStats(user, entry, session);
          await user.save({ session });
        });
      }
    }
    res.json({ received: true });
  } catch (error) {
    if (error.code === 11000) return res.json({ received: true });
    if (error instanceof SyntaxError) return res.status(400).json({ message: "Invalid JSON" });
    apiError(res, error);
  }
}
export async function completeCall(req, res) {
  try {
    const callId = text(req.body.callId, "callId", 100, true);
    const sessionId = text(req.body.sessionId, "sessionId", 200, true);
    const language = key(text(req.body.language, "language", 60, true));
    const ids = directParticipants(callId);
    if (!ids?.includes(String(req.user._id))) return res.status(403).json({ message: "You are not a participant in this call" });
    const peerId = ids.find(id => id !== String(req.user._id));
    const result = await creditCall(callId, sessionId, req.user._id, peerId, language);
    res.status(result.pending ? 202 : 200).json(result);
  } catch (error) { apiError(res, error); }
}
