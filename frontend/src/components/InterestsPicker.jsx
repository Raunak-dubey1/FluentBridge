import { useState } from "react";
import { INTERESTS } from "../constants/learning";

export default function InterestsPicker({ value, onChange, options = INTERESTS, title = "Interests", custom = true }) {
  const [draft, setDraft] = useState("");
  const toggle = tag => onChange(value.includes(tag) ? value.filter(v => v !== tag) : [...value, tag].slice(0, 15));
  const all = [...new Set([...options, ...value])];
  return <fieldset className="space-y-3">
    <legend className="font-semibold mb-2">{title}</legend>
    <div className="flex flex-wrap gap-2">{all.map(tag => <button key={tag} type="button" aria-pressed={value.includes(tag)} className={`btn btn-sm rounded-full ${value.includes(tag) ? "btn-primary" : "btn-outline"}`} onClick={() => toggle(tag)}>{tag}</button>)}</div>
    {custom && <div className="flex gap-2"><input aria-label={`Custom ${title.toLowerCase()}`} placeholder="Add your own interest" maxLength={60} className="input input-bordered input-sm w-full max-w-xs" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (draft.trim()) { toggle(draft.trim()); setDraft(""); } } }} /><button type="button" className="btn btn-sm" disabled={!draft.trim() || value.length >= 15} onClick={() => { toggle(draft.trim()); setDraft(""); }}>Add</button></div>}
  </fieldset>;
}
