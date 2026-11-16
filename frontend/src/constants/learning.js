export const LEVELS = [
  ["A1", "Beginner", "Greetings, numbers and simple phrases"],
  ["A2", "Elementary", "Basic daily interactions"],
  ["B1", "Intermediate", "Can hold a 15-minute conversation"],
  ["B2", "Upper intermediate", "Comfortable with detailed conversations"],
  ["C1", "Advanced", "Flexible, professional communication"],
  ["C2", "Proficient", "Understands and expresses subtle meaning"],
];
export const LEVEL_THRESHOLDS = {
  A1: 100,  // 100 XP to advance from A1 to A2
  A2: 250,  // 250 XP to advance from A2 to B1
  B1: 500,  // 500 XP to advance from B1 to B2
  B2: 900,  // 900 XP to advance from B2 to C1
  C1: 1500, // 1500 XP to advance from C1 to C2
  C2: 2500, // Mastery level
};
export const GOALS = ["Casual Conversation", "Career & Business", "Exam Preparation", "Travel & Relocation", "Culture & Media"];
export const INTERESTS = ["Tech", "Travel", "Gaming", "Literature", "Fitness", "Music", "Cooking", "Anime", "Cinema", "Art", "Sports"];
export const AVAILABILITY = ["Flexible", "Weekday Mornings", "Weekday Afternoons", "Weekday Evenings", "Weekends"];
export const ENDORSEMENT_TAGS = ["Great Pronunciation", "Rich Vocabulary", "Comfortable Conversationalist", "Patient", "Fluent"];
export const label = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
export const nativeLanguages = user => user?.nativeLanguages?.length ? user.nativeLanguages : user?.nativeLanguage ? [user.nativeLanguage] : [];
export const learningLanguages = user => user?.learningLanguages || (user?.learningLanguage ? [{ language: user.learningLanguage, level: "A1", stats: {} }] : []);
