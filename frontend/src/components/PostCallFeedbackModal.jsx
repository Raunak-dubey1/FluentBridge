import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { completeCall, rateUser } from "../lib/api";
import { label, learningLanguages, nativeLanguages } from "../constants/learning";

export default function PostCallFeedbackModal({ user, partner, callId, sessionId, onClose }) {
  const dialog = useRef(null);
  const cache = useQueryClient();
  const learning = learningLanguages(user).find(l => nativeLanguages(partner).includes(l.language)) || learningLanguages(user)[0];
  const eligible = learningLanguages(partner);
  const [language, setLanguage] = useState(eligible[0]?.language || "");
  const [rating, setRating] = useState(10);
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => { const el = dialog.current; el?.showModal(); return () => el?.close(); }, []);

  const credit = useQuery({
    queryKey: ["callCredit", callId, sessionId, learning?.language],
    queryFn: () => completeCall({ callId, sessionId, language: learning?.language }),
    enabled: !!learning && !!sessionId,
    refetchInterval: query => query.state.data?.pending ? 3000 : false,
    retry: 1,
  });

  useEffect(() => {
    if (credit.data && !credit.data.pending) cache.invalidateQueries({ queryKey: ["authUser"] });
  }, [credit.data, cache]);

  const ratingMutation = useMutation({
    mutationFn: () => rateUser({ userId: partner._id, language, rating, suggestion, callId, sessionId }),
    onSuccess: () => {
      cache.invalidateQueries({ queryKey: ["friends"] });
      cache.invalidateQueries({ queryKey: ["endorsements"] });
    },
  });

  return (
    <dialog ref={dialog} className="modal" aria-labelledby="feedback-title" onCancel={e => { e.preventDefault(); onClose(); }}>
      <div className="modal-box space-y-5 max-w-lg">
        <h2 id="feedback-title" className="text-2xl font-bold">A conversation worth celebrating! 🎉</h2>
        <p className="opacity-75 text-sm">Thanks for practicing with {partner?.fullName || "your partner"}.</p>

        {learning && (
          <div className="bg-base-200 rounded-xl p-3.5 text-xs sm:text-sm" role="status">
            {!sessionId ? "Practice minutes will update after Stream confirms attendance." :
              credit.isError ? "Practice confirmation is processing. Verified minutes will appear shortly." :
              credit.data?.pending || credit.isPending ? "Syncing session with Stream. You can submit your rating below; minutes will record automatically." :
              `${credit.data?.callMinutes || 0} shared practice minutes in ${label(learning.language)} recorded!`
            }
          </div>
        )}

        {!!eligible.length && (
          <form className="space-y-4 bg-base-200/50 p-4 rounded-2xl border border-base-300" onSubmit={e => { e.preventDefault(); ratingMutation.mutate(); }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-base">Rate {partner?.fullName || "partner"}'s practice</h3>
              {eligible.length > 1 && (
                <select className="select select-bordered select-xs" value={language} onChange={e => { setLanguage(e.target.value); ratingMutation.reset(); }}>
                  {eligible.map(l => <option key={l.language} value={l.language}>{label(l.language)}</option>)}
                </select>
              )}
            </div>

            <div>
              <p className="text-xs opacity-70 mb-2">How was their communication? (1 = struggling, 10 = fluent & smooth):</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <button
                    type="button"
                    key={num}
                    className={`btn btn-sm ${rating === num ? "btn-primary font-bold shadow" : "btn-outline"}`}
                    onClick={() => setRating(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <label className="form-control gap-1.5">
              <span className="text-xs opacity-75">Tips or suggestions for {partner?.fullName} (optional):</span>
              <textarea
                className="textarea textarea-bordered text-xs sm:text-sm"
                rows={2}
                maxLength={300}
                placeholder="e.g. Great speaking pace! Keep practicing past-tense conjugations."
                value={suggestion}
                onChange={e => setSuggestion(e.target.value)}
              />
            </label>

            {ratingMutation.isError && (
              <p className="text-error text-xs" role="alert">
                {ratingMutation.error.response?.data?.message || "Could not submit rating. Try again."}
              </p>
            )}

            {ratingMutation.isSuccess ? (
              <div className="space-y-2">
                <div className="alert alert-success text-xs py-2">
                  <span>{ratingMutation.data?.message || "Rating submitted successfully! XP awarded."}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs w-full opacity-80 hover:opacity-100"
                  onClick={() => { ratingMutation.reset(); setSuggestion(""); }}
                >
                  + Submit another rating or updated feedback
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-sm sm:btn-md w-full" disabled={ratingMutation.isPending}>
                {ratingMutation.isPending ? "Submitting rating…" : `Submit Rating (${rating}/10) & Award XP`}
              </button>
            )}
          </form>
        )}

        <div className="modal-action flex justify-between items-center pt-2">
          <Link to="/dashboard" className="btn btn-outline btn-sm">View dashboard</Link>
          <button className="btn btn-sm" onClick={onClose}>Done</button>
        </div>
      </div>
    </dialog>
  );
}
