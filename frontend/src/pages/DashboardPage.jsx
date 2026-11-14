import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfile, addLanguage, updateLanguage, removeLanguage, getEndorsements } from "../lib/api";
import { LANGUAGES } from "../constants";
import { AVAILABILITY, LEVELS, label, nativeLanguages, learningLanguages } from "../constants/learning";
import AddLanguageModal from "../components/AddLanguageModal";
import InterestsPicker from "../components/InterestsPicker";

export default function DashboardPage() {
  const { authUser } = useAuthUser();
  return <Dashboard key={authUser._id} user={authUser} />;
}
function Dashboard({ user }) {
  const cache = useQueryClient();
  const [form, setForm] = useState(() => ({ fullName: user.fullName, bio: user.bio || "", location: user.location || "", profilePic: user.profilePic || "", timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, nativeLanguages: nativeLanguages(user), interests: user.interests || [], availability: user.availability || ["Flexible"] }));
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [avatarSeed, setAvatarSeed] = useState(1);
  const refresh = ({ user: updated }) => {
    cache.setQueryData(["authUser"], previous => ({ ...previous, user: updated }));
    for (const queryKey of [["users"], ["friends"], ["endorsements"]]) cache.invalidateQueries({ queryKey });
  };
  const profile = useMutation({ mutationFn: updateProfile, onSuccess: data => { refresh(data); toast.success("Profile saved"); }, onError: e => toast.error(e.response?.data?.message || "Unable to save profile") });
  const language = useMutation({ mutationFn: data => modal?.entry ? updateLanguage(data) : addLanguage(data), onSuccess: data => { refresh(data); setModal(null); toast.success("Language saved"); } });
  const removal = useMutation({ mutationFn: removeLanguage, onSuccess: data => { refresh(data); setDeleting(null); toast.success("Language removed"); }, onError: e => toast.error(e.response?.data?.message || "Unable to remove language") });
  const { data: endorsementData, isError: endorsementQueryError } = useQuery({ queryKey: ["endorsements"], queryFn: getEndorsements });
  const endorsements = Array.isArray(endorsementData) ? endorsementData : [];
  const endorsementsError = endorsementQueryError || (endorsementData !== undefined && !Array.isArray(endorsementData));
  const languages = learningLanguages(user);
  const totals = languages.reduce((sum, l) => ({ minutes: sum.minutes + (l.stats?.callMinutes || 0), messages: sum.messages + (l.stats?.messagesSent || 0), endorsements: sum.endorsements + (l.stats?.endorsementsCount || 0) }), { minutes: 0, messages: 0, endorsements: 0 });
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  return <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 pb-20">
    <header><p className="text-primary text-sm font-semibold">YOUR LEARNING SPACE</p><h1 className="text-3xl font-bold mt-2">My dashboard</h1><p className="opacity-70 mt-2">Make your next conversation count. Shape your profile and follow your progress.</p></header>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[["Call minutes", totals.minutes], ["Messages sent", totals.messages], ["Native endorsements", totals.endorsements]].map(([title, value]) => <div key={title} className="card bg-base-200 p-5"><p className="text-sm opacity-70">{title}</p><strong className="text-3xl mt-2">{value}</strong></div>)}</div>
    <section className="card bg-base-200 p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between"><div><h2 className="text-xl font-bold">My learning languages</h2><p className="text-sm opacity-70">CEFR levels are self-assessed. Native verification recognises practice milestones.</p></div><button className="btn btn-primary btn-sm" onClick={() => { language.reset(); setModal({}); }}>+ Add learning language</button></div>
      {!languages.length && <p className="py-6 opacity-70">Add your first learning language to start tracking your practice.</p>}
      <div className="grid md:grid-cols-2 gap-4">{languages.map(l => {
        const minutes = l.stats?.callMinutes || 0;
        const endorsementsCount = l.stats?.endorsementsCount || 0;
        const progress = Math.min(100, (Math.min(1, minutes / 60) + Math.min(1, endorsementsCount / 3)) * 50);
        const next = LEVELS[Math.min(5, LEVELS.findIndex(([level]) => level === l.level) + 1)][0];
        return <article key={l.language} className="rounded-2xl border border-base-300 bg-base-100 p-5 space-y-3"><div className="flex justify-between gap-3"><h3 className="font-bold text-lg">{label(l.language)} <span className="badge badge-primary">{l.level}</span></h3>{l.isVerified && <span className="badge badge-success h-auto text-xs">⭐ Native Verified</span>}</div><p className="text-sm opacity-70">{l.goal}</p><p className="text-sm">{minutes} call minutes · {l.stats?.messagesSent || 0} messages · {endorsementsCount} endorsements</p><progress className="progress progress-primary w-full" aria-label={`${l.language} verification progress`} value={progress} max="100" /><p className="text-xs opacity-70">Native verification: 60 call minutes + 3 different native endorsements.</p>{l.isVerified && next !== l.level && <p className="text-sm text-success">Milestone reached! Consider assessing yourself at {next}.</p>}<div className="flex gap-2"><button className="btn btn-sm btn-outline" onClick={() => { language.reset(); setModal({ entry: { language: l.language, level: l.level, goal: l.goal } }); }}>Edit level / goal</button><button className="btn btn-sm btn-ghost text-error" onClick={() => setDeleting(l.language)}>Remove</button></div>{deleting === l.language && <div className="border border-error/40 rounded-xl p-3 space-y-2"><p className="text-sm">Remove {label(l.language)}? Verified practice history will be restored if you add it again.</p><button className="btn btn-error btn-sm mr-2" disabled={removal.isPending} onClick={() => removal.mutate(l.language)}>Remove language</button><button className="btn btn-sm" onClick={() => setDeleting(null)}>Keep it</button></div>}</article>;
      })}</div>
    </section>
    <form className="card bg-base-200 p-5 sm:p-7 space-y-6" onSubmit={e => { e.preventDefault(); profile.mutate(form); }}>
      <h2 className="text-xl font-bold">Profile & preferences</h2>
      <div className="flex items-center gap-4"><img className="size-20 rounded-full bg-base-300" src={form.profilePic} alt="Profile avatar" /><button type="button" className="btn btn-sm btn-outline" onClick={() => { setAvatarSeed(avatarSeed + 1); setForm({ ...form, profilePic: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(user._id + avatarSeed)}` }); }}>Try another avatar</button></div>
      <div className="grid sm:grid-cols-2 gap-4"><label className="form-control gap-2">Full name<input required maxLength={100} className="input input-bordered" name="fullName" value={form.fullName} onChange={change} /></label><label className="form-control gap-2">Location<input maxLength={150} className="input input-bordered" name="location" value={form.location} onChange={change} /></label><label className="form-control gap-2">Timezone<input required list="timezones" className="input input-bordered" name="timezone" value={form.timezone} onChange={change} /><datalist id="timezones">{(Intl.supportedValuesOf?.("timeZone") || [form.timezone]).map(t => <option key={t}>{t}</option>)}</datalist></label><label className="form-control gap-2">Custom avatar URL<input type="url" maxLength={2048} className="input input-bordered" name="profilePic" value={form.profilePic} onChange={change} placeholder="https://…" /></label></div>
      <label className="form-control gap-2">About me<textarea className="textarea textarea-bordered" rows={3} maxLength={1000} name="bio" value={form.bio} onChange={change} /></label>
      <fieldset><legend className="font-semibold mb-3">Native languages</legend><div className="flex flex-wrap gap-2">{[...new Set([...LANGUAGES.map(l => l.toLowerCase()), ...form.nativeLanguages])].map(l => <label key={l} className="flex items-center gap-2 rounded-full border border-base-300 px-3 py-2 text-sm"><input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={form.nativeLanguages.includes(l)} onChange={e => setForm({ ...form, nativeLanguages: e.target.checked ? [...form.nativeLanguages, l] : form.nativeLanguages.filter(n => n !== l) })} />{label(l)} <span className="opacity-50">Native</span></label>)}</div></fieldset>
      <InterestsPicker value={form.interests} onChange={interests => setForm({ ...form, interests })} />
      <InterestsPicker title="Availability" custom={false} options={AVAILABILITY} value={form.availability} onChange={availability => setForm({ ...form, availability })} />
      <p className="text-xs opacity-60">Availability is interpreted in your timezone. Match suggestions compare your selected schedule tags.</p>
      <button disabled={profile.isPending} className="btn btn-primary self-start">{profile.isPending ? "Saving…" : "Save profile"}</button>
    </form>
    <section className="card bg-base-200 p-5 sm:p-7 space-y-4"><h2 className="text-xl font-bold">Endorsements received</h2>{endorsementsError ? <p role="alert">Could not load endorsements. Refresh to try again.</p> : !endorsements.length ? <p className="opacity-70">Practice with native speakers to earn your first endorsement.</p> : endorsements.map(e => <article key={e._id} className="border-t border-base-300 pt-4"><p className="font-semibold">{e.endorser?.fullName || "Practice partner"} · {label(e.language)}</p><div className="flex flex-wrap gap-2 my-2">{e.tags.map(t => <span className="badge badge-outline" key={t}>{t}</span>)}</div>{e.notes && <p className="text-sm opacity-70">{e.notes}</p>}</article>)}</section>
    {modal && <AddLanguageModal entry={modal.entry} excluded={[...nativeLanguages(user), ...languages.map(l => l.language)]} pending={language.isPending} error={language.error?.response?.data?.message || (language.isError ? "Unable to save language" : "")} onClose={() => setModal(null)} onSave={data => language.mutate(data)} />}
  </main>;
}
