export const LEVELS = [
  ["A1", "Beginner", "Greetings, numbers and simple phrases"],
  ["A2", "Elementary", "Basic daily interactions"],
  ["B1", "Intermediate", "Can hold a 15-minute conversation"],
  ["B2", "Upper intermediate", "Comfortable with detailed conversations"],
  ["C1", "Advanced", "Flexible, professional communication"],
  ["C2", "Proficient", "Understands and expresses subtle meaning"],
];
export const GOALS = ["Casual Conversation", "Career & Business", "Exam Preparation", "Travel & Relocation", "Culture & Media"];
export const INTERESTS = ["Tech", "Travel", "Gaming", "Literature", "Fitness", "Music", "Cooking", "Anime", "Cinema", "Art", "Sports"];
export const AVAILABILITY = ["Flexible", "Weekday Mornings", "Weekday Afternoons", "Weekday Evenings", "Weekends"];
export const ENDORSEMENT_TAGS = ["Great Pronunciation", "Rich Vocabulary", "Comfortable Conversationalist", "Patient", "Fluent"];
export const label = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
export const nativeLanguages = user => user?.nativeLanguages?.length ? user.nativeLanguages : user?.nativeLanguage ? [user.nativeLanguage] : [];
export const learningLanguages = user => user?.learningLanguages || (user?.learningLanguage ? [{ language: user.learningLanguage, level: "A1", stats: {} }] : []);
