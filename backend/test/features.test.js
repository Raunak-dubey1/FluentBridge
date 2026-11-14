import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { StreamChat } from "stream-chat";
import { User } from "../src/models/User.js";
import { Endorsement } from "../src/models/Endorsement.js";
import { PracticeCredit } from "../src/models/PracticeCredit.js";
import { CallAttendance } from "../src/models/CallAttendance.js";
import { matchUsers, GOALS, progression } from "../src/lib/learning.js";
import { overlapMinutes, verifyStreamSignature } from "../src/lib/practice.js";

process.env.STREAM_API_KEY = "feature-tests";
process.env.STREAM_API_SECRET = "test-secret";
process.env.JWT_SECRET_KEY = "test-jwt-secret";
StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET).upsertUsers = async () => ({});
const { default: userRoutes } = await import("../src/routes/user.route.js");
const { streamWebhook, completeCall } = await import("../src/controllers/practice.controller.js");
const { protectRoute } = await import("../src/middleware/auth.middleware.js");
let database, server, origin;
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(database.getUri(), { dbName: "feature-tests" });
  await Promise.all([User.init(), Endorsement.init(), PracticeCredit.init(), CallAttendance.init()]);
  const app = express();
  app.post("/api/webhooks/stream", express.raw({ type: "application/json" }), streamWebhook);
  app.use(express.json(), cookieParser());
  app.use("/api/users", userRoutes);
  app.post("/api/calls/complete", protectRoute, completeCall);
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); await database?.stop(); });
beforeEach(async () => { await Promise.all([User.deleteMany({}), Endorsement.deleteMany({}), PracticeCredit.deleteMany({}), CallAttendance.deleteMany({})]); });
async function createUser(name, native = "english", learning = "spanish") {
  return User.create({ fullName: name, email: `${name}@test.invalid`, password: "password123", nativeLanguages: [native], learningLanguages: [{ language: learning, level: "B1", goal: GOALS[0] }], isOnboarded: true });
}
async function request(user, path, method = "GET", body) {
  const headers = { "Content-Type": "application/json" };
  if (user) headers.Cookie = `jwt=${jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY)}`;
  const response = await fetch(`${origin}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json() };
}
async function webhook(event, valid = true) {
  const body = JSON.stringify(event);
  const signature = crypto.createHmac("sha256", process.env.STREAM_API_SECRET).update(body).digest("hex");
  const response = await fetch(`${origin}/api/webhooks/stream`, { method: "POST", headers: { "Content-Type": "application/json", "x-signature": valid ? signature : "forged" }, body });
  return { status: response.status, data: await response.json() };
}
async function befriend(a, b) {
  await User.updateOne({ _id: a._id }, { $addToSet: { friends: b._id } });
  await User.updateOne({ _id: b._id }, { $addToSet: { friends: a._id } });
}
test("legacy hydration migrates language strings and profile saves keep password hashes", async () => {
  const original = await createUser("legacy");
  await User.collection.updateOne({ _id: original._id }, { $unset: { nativeLanguages: "", learningLanguages: "" }, $set: { nativeLanguage: "English", learningLanguage: "Spanish" } });
  const legacy = await User.findById(original._id).select("-password");
  assert.deepEqual([...legacy.nativeLanguages], ["english"]);
  assert.equal(legacy.learningLanguages[0].language, "spanish");
  const response = await request(legacy, "/api/users/profile", "PUT", { bio: "Updated", interests: ["Tech", "tech"], availability: ["Weekends"], timezone: "Asia/Kolkata", friends: [], isOnboarded: false, password: "attacker" });
  assert.equal(response.status, 200);
  assert.equal(response.data.user.password, undefined);
  const saved = await User.findById(original._id);
  assert.equal(saved.isOnboarded, true);
  assert.deepEqual([...saved.interests], ["Tech"]);
  assert.equal(await saved.checkPassword("password123"), true);
  assert.equal(await saved.checkPassword("attacker"), false);
  assert.equal((await User.collection.findOne({ _id: original._id })).learningLanguages[0].level, "A1");
});
test("language APIs validate, reject duplicates and prevent forged stats", async () => {
  const user = await createUser("learner");
  assert.equal((await request(null, "/api/users/languages", "POST", {})).status, 401);
  assert.equal((await request(user, "/api/users/languages", "POST", { language: "French", level: "D1", goal: GOALS[0] })).status, 400);
  const added = await request(user, "/api/users/languages", "POST", { language: " French ", level: "A2", goal: GOALS[1], isVerified: true, stats: { callMinutes: 999 } });
  assert.equal(added.status, 201);
  assert.equal(added.data.user.learningLanguages[1].stats.callMinutes, 0);
  assert.equal(added.data.user.learningLanguages[1].isVerified, false);
  assert.equal((await request(user, "/api/users/languages", "POST", { language: "FRENCH", level: "A2", goal: GOALS[0] })).status, 409);
  assert.equal((await request(user, "/api/users/languages/french", "PUT", { level: "B2", goal: GOALS[2] })).status, 200);
  assert.equal((await request(user, "/api/users/languages/french", "DELETE")).status, 200);
  assert.equal((await request(user, "/api/users/languages/spanish", "DELETE")).data.user.learningLanguages.length, 0);
  assert.equal((await User.findById(user._id)).learningLanguage, "");
});
test("recommendations rank reciprocal exchanges, filter same language/level and hide private data", async () => {
  const user = await createUser("current");
  const mutual = await createUser("mutual", "spanish", "english");
  await createUser("shared", "french", "spanish");
  const friend = await createUser("friend", "spanish", "english");
  await befriend(user, friend);
  const response = await request(user, "/api/users");
  assert.equal(response.data[0]._id, mutual.id);
  assert.equal(response.data.length, 2);
  assert.equal(response.data[0].password, undefined);
  assert.equal(response.data[0].email, undefined);
  const filtered = await request(user, "/api/users?language=SPANISH&level=B1");
  assert.equal(filtered.data.length, 1);
  assert.equal(filtered.data[0].fullName, "shared");
  assert.equal((await request(user, "/api/users?level=X")).status, 400);
  const friends = await request(user, "/api/users/friends");
  assert.equal(friends.data[0].learningLanguages[0].level, "B1");
});
test("matching weights, case insensitive interests, legacy users and verification thresholds", () => {
  const a = { nativeLanguage: "English", learningLanguage: "Spanish", interests: ["Tech", "Music", "Art", "Travel"], availability: ["Weekends"] };
  const b = { nativeLanguage: "Spanish", learningLanguage: "English", interests: ["tech", "Music", "Art", "Travel", "Travel"], availability: ["Weekends"] };
  assert.equal(matchUsers(a, b).matchScore, 80);
  assert.equal(matchUsers(a, b).matchPercentage, 100);
  assert.equal(matchUsers(a, b).sharedInterests.length, 4);
  assert.equal(progression({ level: "B1", stats: { callMinutes: 60, endorsementsCount: 3 } }).suggestedLevel, "B2");
  assert.equal(progression({ level: "B1", stats: { callMinutes: 59, endorsementsCount: 3 } }).isVerified, false);
});
test("call overlap excludes solo time and unions multiple tabs", () => {
  const at = minute => new Date(minute * 60000);
  const own = [{ joinedAt: at(0), leftAt: at(20) }, { joinedAt: at(10), leftAt: at(30) }];
  const peer = [{ joinedAt: at(5), leftAt: at(25) }];
  assert.equal(overlapMinutes(own, peer), 20);
  assert.equal(overlapMinutes(own, [{ joinedAt: at(31), leftAt: at(40) }]), 0);
  assert.equal(verifyStreamSignature(Buffer.from("{}"), "forged", "secret"), false);
});
test("signed message webhooks award once under retries and reject forged/native-ineligible credit", async () => {
  const user = await createUser("messages");
  const partner = await createUser("native", "spanish", "english");
  await befriend(user, partner);
  const event = { type: "message.new", cid: `messaging:${[user.id, partner.id].sort().join("-")}`, message: { id: "message-1", user: { id: user.id }, text: "Hola", practice_language: "Spanish" } };
  assert.equal((await webhook(event, false)).status, 401);
  assert.equal((await webhook(event)).status, 200);
  const retries = await Promise.all([webhook(event), webhook(event), webhook(event)]);
  assert.ok(retries.every(r => r.status === 200));
  assert.equal((await User.findById(user._id)).learningLanguages[0].stats.messagesSent, 1);
  await webhook({ ...event, message: { ...event.message, id: "message-2", practice_language: "french" } });
  assert.equal(await PracticeCredit.countDocuments(), 1);
});
test("verified attendance awards both partners, remains idempotent and restores removed language history", async () => {
  const a = await createUser("caller");
  const b = await createUser("callee", "spanish", "english");
  await befriend(a, b);
  const callId = [a.id, b.id].sort().join("-");
  const sessionId = "session-1";
  const left = (user, joined, end) => ({ type: "call.session_participant_left", call_cid: `default:${callId}`, session_id: sessionId, created_at: new Date(end * 60000).toISOString(), duration_seconds: (end - joined) * 60, participant: { user: { id: user.id }, user_session_id: `tab-${user.id}`, joined_at: new Date(joined * 60000).toISOString() } });
  const pending = await request(a, "/api/calls/complete", "POST", { callId, sessionId, language: "spanish", duration: 999999 });
  assert.equal(pending.status, 202);
  await webhook(left(a, 0, 65));
  assert.equal((await webhook(left(b, 5, 70))).status, 200);
  await webhook(left(b, 5, 70));
  const savedA = await User.findById(a._id);
  const savedB = await User.findById(b._id);
  assert.equal(savedA.learningLanguages[0].stats.callMinutes, 60);
  assert.equal(savedB.learningLanguages[0].stats.callMinutes, 60);
  assert.equal(savedA.learningLanguages[0].isVerified, false);
  assert.equal(await PracticeCredit.countDocuments({ kind: "call" }), 2);
  // Rejoining in the same call session adds only new overlapping attendance.
  await webhook(left(a, 80, 100));
  await webhook(left(b, 85, 105));
  assert.equal((await User.findById(a._id)).learningLanguages[0].stats.callMinutes, 75);
  assert.equal((await User.findById(b._id)).learningLanguages[0].stats.callMinutes, 75);
  await request(a, "/api/users/languages/spanish", "DELETE");
  const restored = await request(a, "/api/users/languages", "POST", { language: "spanish", level: "B1", goal: GOALS[0] });
  assert.equal(restored.data.user.learningLanguages[0].stats.callMinutes, 75);
  const outsider = await createUser("outsider");
  assert.equal((await request(outsider, "/api/calls/complete", "POST", { callId, sessionId, language: "spanish" })).status, 403);
});
test("three distinct native endorsements verify a learner and duplicates/non-natives are rejected", async () => {
  const learner = await createUser("endorsed");
  for (let i = 0; i < 3; i++) {
    const native = await createUser(`endorser${i}`, "spanish", "english");
    await befriend(learner, native);
    await PracticeCredit.create({ source: `call:practice${i}`, user: learner._id, peer: native._id, language: "spanish", kind: "call", amount: 20 });
    const body = { language: "Spanish", tags: ["Rich Vocabulary"], notes: "Great practice!" };
    const response = await request(native, `/api/users/${learner.id}/endorse`, "POST", body);
    assert.equal(response.status, 201);
    assert.equal(response.data.isVerified, i === 2);
    assert.equal((await request(native, `/api/users/${learner.id}/endorse`, "POST", body)).status, 409);
  }
  const refreshed = await User.findById(learner._id);
  assert.equal(refreshed.learningLanguages[0].stats.endorsementsCount, 3);
  assert.equal(refreshed.learningLanguages[0].isVerified, true);
  const nonNative = await createUser("nonnative", "french", "spanish");
  assert.equal((await request(nonNative, `/api/users/${learner.id}/endorse`, "POST", { language: "spanish", tags: ["Patient"] })).status, 403);
  assert.equal((await request(learner, `/api/users/${learner.id}/endorse`, "POST", { language: "spanish", tags: ["Patient"] })).status, 400);
});
