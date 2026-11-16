import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Endorsement } from "../models/Endorsement.js";
import { PracticeCredit } from "../models/PracticeCredit.js";
import { upsertStreamUser } from "../lib/stream.js";
import { badRequest, text, tags, key, languageInput, ENDORSEMENT_TAGS, progression, calculateXpGain, applyXpAndProgress } from "../lib/learning.js";

export function apiError(res, error) {
  if (error.code === 11000) return res.status(409).json({ message: "This record already exists" });
  if (error.name === "VersionError") return res.status(409).json({ message: "Your profile changed. Refresh and try again." });
  const status = error.status || (["ValidationError", "CastError"].includes(error.name) ? 400 : 500);
  if (status === 500) console.error(error);
  return res.status(status).json({ message: status === 500 ? "Unable to complete request" : error.message });
}
export async function restoreStats(user, entry, session) {
  const rows = await PracticeCredit.find({ user: user._id, language: entry.language }).session(session || null);
  const reviews = await Endorsement.find({ recipient: user._id, language: entry.language }).session(session || null);
  entry.stats = {
    callMinutes: rows.filter(r => r.kind === "call").reduce((n, r) => n + r.amount, 0),
    messagesSent: rows.filter(r => r.kind === "message").reduce((n, r) => n + r.amount, 0),
    endorsementsCount: reviews.length,
    ratingsCount: reviews.length,
  };
  entry.isVerified = progression(entry).isVerified;
}
export async function updateProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    for (const [field, max] of [["fullName", 100], ["bio", 1000], ["location", 150], ["timezone", 100], ["profilePic", 2048]]) {
      if (req.body[field] !== undefined) user[field] = text(req.body[field], field, max, field === "fullName");
    }
    if (user.timezone) { try { new Intl.DateTimeFormat("en", { timeZone: user.timezone }); } catch { throw badRequest("Choose a valid timezone"); } }
    if (user.profilePic && !/^https:\/\//i.test(user.profilePic)) throw badRequest("Avatar URL must use HTTPS");
    for (const field of ["interests", "availability", "nativeLanguages"]) {
      if (req.body[field] !== undefined) user[field] = tags(req.body[field], field).map(v => field === "nativeLanguages" ? key(v) : v);
    }
    if (!user.nativeLanguages.length) throw badRequest("Keep at least one native language");
    if (user.nativeLanguages.some(n => user.learningLanguages.some(l => key(l.language) === n))) throw badRequest("Native and learning languages must be different");
    user.nativeLanguage = user.nativeLanguages[0];
    await user.save();
    await upsertStreamUser({ id: user.id, name: user.fullName, image: user.profilePic });
    res.json({ user });
  } catch (error) { apiError(res, error); }
}
export async function saveLanguage(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const existing = req.params.language && user.learningLanguages.find(l => l.language === key(req.params.language));
    if (req.params.language && !existing) return res.status(404).json({ message: "Language not found" });
    const input = languageInput({ ...req.body, language: req.params.language || req.body.language });
    if (user.nativeLanguages.some(n => key(n) === input.language)) throw badRequest("Choose a language you are learning, rather than a native language");
    if (!existing && user.learningLanguages.some(l => l.language === input.language)) return res.status(409).json({ message: "You already added this language" });
    if (!existing && user.learningLanguages.length >= 15) throw badRequest("You can track up to 15 languages");
    if (existing) Object.assign(existing, input);
    else user.learningLanguages.push(input);
    await restoreStats(user, user.learningLanguages.find(l => l.language === input.language));
    await user.save();
    res.status(existing ? 200 : 201).json({ user });
  } catch (error) { apiError(res, error); }
}
export async function deleteLanguage(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user.learningLanguages.some(l => l.language === key(req.params.language))) return res.status(404).json({ message: "Language not found" });
    user.learningLanguages = user.learningLanguages.filter(l => l.language !== key(req.params.language));
    user.learningLanguage = user.learningLanguages[0]?.language || "";
    await user.save();
    res.json({ user });
  } catch (error) { apiError(res, error); }
}
export async function endorseUser(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw badRequest("Invalid user");
    const language = key(text(req.body.language, "language", 60, true));
    const selectedTags = tags(req.body.tags || [], "tags", 5);
    if (!selectedTags.length || selectedTags.some(t => !ENDORSEMENT_TAGS.includes(t))) throw badRequest("Choose at least one valid endorsement tag");
    const notes = text(req.body.notes || "", "notes", 200);
    if (String(req.user._id) === req.params.id) throw badRequest("You cannot endorse yourself");
    if (!req.user.nativeLanguages.some(n => key(n) === language)) return res.status(403).json({ message: "You must be a native speaker of this language" });
    const practiced = await PracticeCredit.exists({ user: req.params.id, peer: req.user._id, language, kind: "call", amount: { $gt: 0 } });
    if (!practiced) return res.status(403).json({ message: "A verified practice call in this language is required first. Try again after call processing." });
    const existing = await Endorsement.findOne({ endorser: req.user._id, recipient: req.params.id, language, isLegacyEndorsement: true });
    if (existing) return res.status(409).json({ message: "This record already exists" });
    let recipient;
    await mongoose.connection.transaction(async session => {
      recipient = await User.findById(req.params.id).select("-password").session(session);
      if (!recipient || !recipient.friends.some(f => String(f) === String(req.user._id))) throw badRequest("You can endorse practice partners in your friends list");
      const entry = recipient.learningLanguages.find(l => l.language === language);
      if (!entry) throw badRequest("This partner is not learning that language");
      await Endorsement.create([{ endorser: req.user._id, recipient: recipient._id, language, tags: selectedTags, notes, isLegacyEndorsement: true }], { session });
      await restoreStats(recipient, entry, session);
      await recipient.save({ session });
    });
    res.status(201).json({ message: "Endorsement sent", language, isVerified: recipient.learningLanguages.find(l => l.language === language).isVerified });
  } catch (error) { apiError(res, error); }
}
export async function rateUser(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw badRequest("Invalid user");
    if (String(req.user._id) === req.params.id) throw badRequest("You cannot rate yourself");
    const language = key(text(req.body.language, "language", 60, true));
    const rating = Math.max(1, Math.min(10, parseInt(req.body.rating, 10) || 10));
    const suggestion = req.body.suggestion ? text(req.body.suggestion, "suggestion", 300) : (req.body.notes ? text(req.body.notes, "notes", 300) : "");
    const callId = req.body.callId ? text(req.body.callId, "callId", 100) : "";

    let recipient;
    let xpAwarded = 0;
    let progressionResult;

    await mongoose.connection.transaction(async session => {
      recipient = await User.findById(req.params.id).select("-password").session(session);
      if (!recipient || !recipient.friends.some(f => String(f) === String(req.user._id))) {
        throw badRequest("You can only rate practice partners in your friends list");
      }
      const entry = recipient.learningLanguages.find(l => l.language === language);
      if (!entry) throw badRequest("This partner is not learning that language");

      const recentCall = await PracticeCredit.findOne({ 
        user: recipient._id, 
        peer: req.user._id, 
        language, 
        kind: "call" 
      }).sort({ createdAt: -1 }).session(session);

      const minutes = recentCall?.amount || 10;
      const isNative = req.user.nativeLanguages.some(n => key(n) === language);
      xpAwarded = calculateXpGain(minutes, rating, isNative);

      progressionResult = applyXpAndProgress(entry, xpAwarded);
      entry.stats = entry.stats || {};
      entry.stats.ratingsCount = (entry.stats.ratingsCount || 0) + 1;

      await Endorsement.create([{
        endorser: req.user._id,
        recipient: recipient._id,
        language,
        rating,
        suggestion,
        notes: suggestion,
        callId,
        tags: req.body.tags || [],
        xpAwarded
      }], { session });

      await restoreStats(recipient, entry, session);
      await recipient.save({ session });
    });

    res.status(201).json({
      message: progressionResult.leveledUp 
        ? `Rating submitted! Level up! Partner reached ${progressionResult.newLevel}!` 
        : `Rating submitted! +${xpAwarded} XP awarded to partner.`,
      xpAwarded,
      rating,
      suggestion,
      ...progressionResult,
      language
    });
  } catch (error) { apiError(res, error); }
}
export async function getEndorsements(req, res) {
  try {
    const endorsements = await Endorsement.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50).populate("endorser", "fullName profilePic");
    res.json(endorsements);
  } catch (error) { apiError(res, error); }
}
