export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const GOALS = ["Casual Conversation", "Career & Business", "Exam Preparation", "Travel & Relocation", "Culture & Media"];
export const ENDORSEMENT_TAGS = ["Great Pronunciation", "Rich Vocabulary", "Comfortable Conversationalist", "Patient", "Fluent"];
export const LEVEL_THRESHOLDS = {
  A1: 100,  // 100 XP to advance from A1 to A2
  A2: 250,  // 250 XP to advance from A2 to B1
  B1: 500,  // 500 XP to advance from B1 to B2
  B2: 900,  // 900 XP to advance from B2 to C1
  C1: 1500, // 1500 XP to advance from C1 to C2
  C2: 2500, // Mastery level
};

export function calculateXpGain(minutes, rating, isNative = false) {
  const safeMinutes = Math.max(1, Math.min(180, Number(minutes) || 10));
  const safeRating = Math.max(1, Math.min(10, Number(rating) || 10));
  const multiplier = isNative ? 1.5 : 1.0;
  return Math.max(5, Math.round(safeMinutes * (safeRating / 10) * multiplier));
}

export function applyXpAndProgress(languageEntry, xpGained) {
  languageEntry.xp = (languageEntry.xp || 0) + xpGained;
  let targetXp = LEVEL_THRESHOLDS[languageEntry.level] || 100;
  let leveledUp = false;
  let oldLevel = languageEntry.level;

  while (languageEntry.xp >= targetXp && LEVELS.indexOf(languageEntry.level) < LEVELS.length - 1) {
    languageEntry.xp -= targetXp;
    languageEntry.level = LEVELS[LEVELS.indexOf(languageEntry.level) + 1];
    leveledUp = true;
    targetXp = LEVEL_THRESHOLDS[languageEntry.level] || 2500;
  }

  return { leveledUp, oldLevel, newLevel: languageEntry.level, currentXp: languageEntry.xp, targetXp };
}

export const key = value => typeof value === "string" ? value.trim().toLowerCase() : "";
export function normalizeLanguages(user) {
  if (!user.nativeLanguages?.length && user.nativeLanguage) user.nativeLanguages = [key(user.nativeLanguage)];
  if (!user.learningLanguages?.length && user.learningLanguage) user.learningLanguages = [{ language: key(user.learningLanguage), level: "A1", goal: GOALS[0] }];
  user.nativeLanguage = user.nativeLanguages?.[0] || "";
  user.learningLanguage = user.learningLanguages?.[0]?.language || "";
  return user;
}
export function getFluentLanguages(user) {
  normalizeLanguages(user);
  const fluent = new Set((user.nativeLanguages || []).map(key));
  for (const l of user.learningLanguages || []) {
    const idx = LEVELS.indexOf(l.level);
    if (idx >= 3 || l.isVerified) {
      fluent.add(key(l.language));
    }
  }
  return fluent;
}

export function matchUsers(current, candidate) {
  normalizeLanguages(current); normalizeLanguages(candidate);
  const currentFluent = getFluentLanguages(current);
  const candidateFluent = getFluentLanguages(candidate);
  const bridgeLanguages = [...currentFluent].filter(l => candidateFluent.has(l));
  const hasBridgeLanguage = bridgeLanguages.length > 0;

  const natives = new Set(current.nativeLanguages.map(key));
  const candidateNatives = new Set(candidate.nativeLanguages.map(key));

  // 1. Reciprocal Mutual Exchange
  const mutualExchangePairs = [];
  for (const curLearning of current.learningLanguages) {
    const curLangKey = key(curLearning.language);
    if (candidateNatives.has(curLangKey)) {
      for (const candLearning of candidate.learningLanguages) {
        const candLangKey = key(candLearning.language);
        if (natives.has(candLangKey)) {
          mutualExchangePairs.push({
            currentLearns: curLangKey,
            candidateLearns: candLangKey,
          });
        }
      }
    }
  }
  const mutualExchange = mutualExchangePairs.length > 0;

  // 2. Shared Target Evaluation (Per Language Pair for Polyglots)
  const sharedTargets = [];
  for (const curLearning of current.learningLanguages) {
    const curLangKey = key(curLearning.language);
    for (const candLearning of candidate.learningLanguages) {
      const candLangKey = key(candLearning.language);
      if (curLangKey === candLangKey) {
        const idxCurrent = LEVELS.indexOf(curLearning.level);
        const idxCandidate = LEVELS.indexOf(candLearning.level);
        const diff = Math.abs(idxCurrent - idxCandidate);
        const minLevel = Math.min(idxCurrent, idxCandidate);

        let profPoints = 0;
        let isFit = false;

        if (diff <= 1) {
          isFit = true;
          if (minLevel >= 2) {
            // B1, B2, C1, C2: conversation viable in target language
            profPoints = 10;
          } else if (minLevel === 1) {
            // A2: elementary conversational ability
            profPoints = 6;
          } else {
            // A1: beginners require a bridge language to prevent communication deadlock
            profPoints = hasBridgeLanguage ? 3 : 0;
          }
        }

        // Communication barrier penalty if no bridge language and below B1 independence
        let barrierPenalty = 0;
        if (!hasBridgeLanguage) {
          if (minLevel === 0) {
            barrierPenalty = 10; // A1 deadlock penalty
          } else if (minLevel === 1) {
            barrierPenalty = 5;  // A2 communication friction
          }
        }

        sharedTargets.push({
          language: curLangKey,
          proficiencyFit: isFit,
          proficiencyPoints: profPoints,
          barrierPenalty,
          netProficiency: profPoints - barrierPenalty,
          minLevel,
          diff
        });
      }
    }
  }

  let languageScore = 0;
  let proficiencyPoints = 0;
  let proficiencyFit = false;
  let barrierPenalty = 0;
  let matchedLanguage = null;

  if (mutualExchange) {
    languageScore = 45;
    proficiencyPoints = 10; // Native partner ensures optimal immersion
    proficiencyFit = true;
    barrierPenalty = 0;
    matchedLanguage = mutualExchangePairs[0].currentLearns;
  } else if (sharedTargets.length > 0) {
    languageScore = 20;
    // Strongest mutual target selection (polyglot resolution)
    sharedTargets.sort((a, b) => b.netProficiency - a.netProficiency);
    const bestTarget = sharedTargets[0];
    proficiencyPoints = bestTarget.proficiencyPoints;
    proficiencyFit = bestTarget.proficiencyFit && (bestTarget.proficiencyPoints > 0);
    barrierPenalty = bestTarget.barrierPenalty;
    matchedLanguage = bestTarget.language;
  }

  const interests = new Set((current.interests || []).map(key));
  const sharedInterests = [...new Map((candidate.interests || []).filter(i => interests.has(key(i))).map(i => [key(i), i])).values()];
  const availability = new Set((current.availability || []).map(key));
  const availabilityMatch = availability.has("flexible") || (candidate.availability || []).some(a => key(a) === "flexible" || availability.has(key(a)));

  const rawScore = languageScore + Math.min(20, sharedInterests.length * 5) + proficiencyPoints + (availabilityMatch ? 5 : 0) - barrierPenalty;
  const matchScore = Math.max(0, Math.min(80, rawScore));
  const matchPercentage = Math.round(matchScore / 80 * 100);

  return {
    matchScore,
    matchPercentage,
    sharedInterests,
    mutualExchange,
    proficiencyFit,
    availabilityMatch,
    hasBridgeLanguage,
    matchedLanguage
  };
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
