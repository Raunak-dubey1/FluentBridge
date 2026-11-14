export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const GOALS = ["Casual Conversation", "Career & Business", "Exam Preparation", "Travel & Relocation", "Culture & Media"];
export const ENDORSEMENT_TAGS = ["Great Pronunciation", "Rich Vocabulary", "Comfortable Conversationalist", "Patient", "Fluent"];
export const key = value => typeof value === "string" ? value.trim().toLowerCase() : "";
export function normalizeLanguages(user) {
  if (!user.nativeLanguages?.length && user.nativeLanguage) user.nativeLanguages = [key(user.nativeLanguage)];
  if (!user.learningLanguages?.length && user.learningLanguage) user.learningLanguages = [{ language: key(user.learningLanguage), level: "A1", goal: GOALS[0] }];
  user.nativeLanguage = user.nativeLanguages?.[0] || "";
  user.learningLanguage = user.learningLanguages?.[0]?.language || "";
  return user;
}
export function matchUsers(current, candidate) {
  normalizeLanguages(current); normalizeLanguages(candidate);
  const natives = new Set(current.nativeLanguages.map(key));
  const targets = new Set(current.learningLanguages.map(l => key(l.language)));
  const mutualExchange = candidate.nativeLanguages.some(l => targets.has(key(l))) && candidate.learningLanguages.some(l => natives.has(key(l.language)));
  const sharedTarget = candidate.learningLanguages.some(l => targets.has(key(l.language)));
  const interests = new Set((current.interests || []).map(key));
  const sharedInterests = [...new Map((candidate.interests || []).filter(i => interests.has(key(i))).map(i => [key(i), i])).values()];
  const proficiencyFit = current.learningLanguages.some(l => candidate.nativeLanguages.some(n => key(n) === key(l.language)) || candidate.learningLanguages.some(c => key(c.language) === key(l.language) && Math.abs(LEVELS.indexOf(c.level) - LEVELS.indexOf(l.level)) <= 1));
  const availability = new Set((current.availability || []).map(key));
  const availabilityMatch = availability.has("flexible") || (candidate.availability || []).some(a => key(a) === "flexible" || availability.has(key(a)));
  // Mutual exchange and shared-target fallback are exclusive: attainable maximum is 80.
  const matchScore = (mutualExchange ? 45 : sharedTarget ? 20 : 0) + Math.min(20, sharedInterests.length * 5) + (proficiencyFit ? 10 : 0) + (availabilityMatch ? 5 : 0);
  return { matchScore, matchPercentage: Math.round(matchScore / 80 * 100), sharedInterests, mutualExchange, proficiencyFit, availabilityMatch };
}
export function progression(language) {
  const stats = language.stats || {};
  const verified = (stats.callMinutes || 0) >= 60 && (stats.endorsementsCount || 0) >= 3;
  return { isVerified: verified, suggestedLevel: verified ? LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(language.level) + 1)] : null };
}
export function badRequest(message) { return Object.assign(new Error(message), { status: 400 }); }
export function text(value, name, max, required = false) {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw badRequest(`Invalid ${name}`);
  return value.trim();
}
export function tags(value, name, max = 15) {
  if (!Array.isArray(value) || value.length > max) throw badRequest(`Invalid ${name}`);
  const unique = new Map();
  for (const v of value) { const clean = text(v, name, 60, true); if (!unique.has(key(clean))) unique.set(key(clean), clean); }
  return [...unique.values()];
}
export function languageInput(body) {
  const language = key(text(body.language, "language", 60, true));
  if (!LEVELS.includes(body.level) || !GOALS.includes(body.goal)) throw badRequest("Choose a valid CEFR level and learning goal");
  return { language, level: body.level, goal: body.goal };
}
