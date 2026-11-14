import { label, nativeLanguages, learningLanguages } from "../constants/learning";
export default function LanguageBadges({ user }) {
  return <div className="space-y-2">
    {user.matchPercentage !== undefined && <span className="badge badge-primary">{user.matchPercentage}% match{user.mutualExchange ? " · Mutual exchange" : ""}</span>}
    <div className="flex flex-wrap gap-2">{nativeLanguages(user).map(l => <span key={l} className="badge badge-secondary h-auto py-1">{label(l)} · Native</span>)}{learningLanguages(user).map(l => <span key={l.language} className="badge badge-outline h-auto py-1">{label(l.language)} · {l.level}{l.isVerified ? " · ⭐ Native Verified" : ""}</span>)}</div>
    {!!user.sharedInterests?.length && <p className="text-xs text-primary">Both like {user.sharedInterests.join(" · ")}</p>}
  </div>;
}
