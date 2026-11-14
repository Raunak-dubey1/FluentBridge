import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "../constants";
import { LEVELS, GOALS, label } from "../constants/learning";

export default function AddLanguageModal({ entry, excluded = [], onSave, onClose, pending, error }) {
  const dialog = useRef(null);
  const [form, setForm] = useState(entry || { language: "", level: "A1", goal: GOALS[0] });
  useEffect(() => { const el = dialog.current; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={dialog} className="modal" onCancel={e => { e.preventDefault(); if (!pending) onClose(); }} aria-labelledby="language-title">
    <form className="modal-box space-y-5" onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="flex items-center justify-between"><h2 id="language-title" className="text-xl font-bold">{entry ? "Edit" : "Add a learning"} language</h2><button type="button" className="btn btn-ghost btn-sm" aria-label="Close" disabled={pending} onClick={onClose}>✕</button></div>
      <label className="form-control gap-2">Language<select required disabled={!!entry} className="select select-bordered" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option value="">Choose a language</option>{[...new Set([...LANGUAGES.map(l => l.toLowerCase()), ...(entry ? [entry.language] : [])])].filter(l => !excluded.includes(l) || l === entry?.language).map(l => <option key={l} value={l}>{label(l)}</option>)}</select></label>
      <fieldset className="space-y-2"><legend className="font-semibold mb-2">What is your current level?</legend>{LEVELS.map(([level, name, help]) => <label key={level} className={`flex gap-3 items-start border rounded-xl p-3 cursor-pointer ${form.level === level ? "border-primary bg-primary/10" : "border-base-300"}`}><input className="radio radio-primary radio-sm mt-1" type="radio" name="level" value={level} checked={form.level === level} onChange={() => setForm({ ...form, level })} /><span><strong>{level} · {name}</strong><span className="block text-xs opacity-70">{help}</span></span></label>)}</fieldset>
      <label className="form-control gap-2">Learning goal<select className="select select-bordered" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>{GOALS.map(g => <option key={g}>{g}</option>)}</select></label>
      {error && <p role="alert" className="text-error">{error}</p>}
      <div className="modal-action"><button type="button" className="btn" disabled={pending} onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save language"}</button></div>
    </form>
  </dialog>;
}
