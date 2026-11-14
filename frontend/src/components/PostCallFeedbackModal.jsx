import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { completeCall, endorseUser } from "../lib/api";
import { ENDORSEMENT_TAGS, label, learningLanguages, nativeLanguages } from "../constants/learning";

export default function PostCallFeedbackModal({ user, partner, callId, sessionId, onClose }) {
  const dialog = useRef(null);
  const cache = useQueryClient();
  const learning = learningLanguages(user).find(l => nativeLanguages(partner).includes(l.language));
  const eligible = learningLanguages(partner).filter(l => nativeLanguages(user).includes(l.language));
  const [language, setLanguage] = useState(eligible[0]?.language || "");
  const [tags, setTags] = useState([]);
  const [notes, setNotes] = useState("");
  useEffect(() => { const el = dialog.current; el.showModal(); return () => el.close(); }, []);
  const credit = useQuery({
    queryKey: ["callCredit", callId, sessionId, learning?.language],
    queryFn: () => completeCall({ callId, sessionId, language: learning.language }),
    enabled: !!learning && !!sessionId,
    refetchInterval: query => query.state.data?.pending ? 3000 : false,
    retry: 1,
  });
  useEffect(() => {
    if (credit.data && !credit.data.pending) cache.invalidateQueries({ queryKey: ["authUser"] });
  }, [credit.data, cache]);
  const endorsement = useMutation({
    mutationFn: () => endorseUser({ userId: partner._id, language, tags, notes }),
    onSuccess: () => { cache.invalidateQueries({ queryKey: ["friends"] }); },
  });
  return <dialog ref={dialog} className="modal" aria-labelledby="feedback-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="modal-box space-y-5"><h2 id="feedback-title" className="text-2xl font-bold">A conversation worth celebrating</h2><p className="opacity-70">Thanks for practicing with {partner?.fullName || "your partner"}.</p>
      {learning && <div className="bg-base-200 rounded-xl p-4" role="status">{!sessionId ? "Practice minutes will update after Stream confirms attendance." : credit.isError ? <><p>Practice confirmation is unavailable. Verified minutes will appear once Stream processes this call.</p><button className="btn btn-sm mt-2" onClick={() => credit.refetch()}>Check again</button></> : credit.data?.pending || credit.isPending ? "Waiting for both participants to leave and Stream to confirm attendance. You can close this window; credit is processed automatically." : `${credit.data?.callMinutes || 0} shared practice minutes in ${label(learning.language)}.`}</div>}
      {!!eligible.length && <form className="space-y-4" onSubmit={e => { e.preventDefault(); endorsement.mutate(); }}>
        <h3 className="font-semibold">Recognise your partner’s {label(language)}</h3><p className="text-sm opacity-70">As a native speaker, you can endorse their communication after verified practice.</p>
        <label className="form-control gap-2">Language<select className="select select-bordered" value={language} onChange={e => { setLanguage(e.target.value); endorsement.reset(); }}>{eligible.map(l => <option key={l.language} value={l.language}>{label(l.language)}</option>)}</select></label>
        <div className="flex flex-wrap gap-2">{ENDORSEMENT_TAGS.map(tag => <button type="button" key={tag} aria-pressed={tags.includes(tag)} className={`btn btn-sm ${tags.includes(tag) ? "btn-primary" : "btn-outline"}`} onClick={() => setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])}>{tag}</button>)}</div>
        <label className="form-control gap-2">A note for your partner (optional)<textarea className="textarea textarea-bordered" maxLength={200} value={notes} onChange={e => setNotes(e.target.value)} /></label>
        {endorsement.isError && <p className="text-error text-sm" role="alert">{endorsement.error.response?.data?.message || "Could not send endorsement. Try again."}</p>}
        {endorsement.isSuccess ? <p className="text-success">Endorsement sent. Thank you!</p> : <button className="btn btn-primary" disabled={!tags.length || endorsement.isPending}>{endorsement.isPending ? "Sending…" : "Send endorsement"}</button>}
      </form>}
      {!eligible.length && <p className="text-sm opacity-70">Endorsements are available for partners learning one of your native languages.</p>}
      <div className="modal-action"><Link to="/dashboard" className="btn btn-outline">View dashboard</Link><button className="btn" onClick={onClose}>Done</button></div>
    </div>
  </dialog>;
}
