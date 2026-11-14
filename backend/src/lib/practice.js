import crypto from "node:crypto";
export function verifyStreamSignature(body, signature, secret) {
  if (!secret || (typeof body !== "string" && !Buffer.isBuffer(body)) || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
export function directParticipants(callId) {
  const ids = typeof callId === "string" ? callId.split("-") : [];
  return ids.length === 2 && ids[0] !== ids[1] && ids.every(id => /^[a-f0-9]{24}$/i.test(id)) ? ids : null;
}
// Union intervals before summing: reconnects and multiple tabs never double-credit time.
export function overlapMinutes(own, peer) {
  const overlaps = [];
  for (const a of own) for (const b of peer) {
    const start = Math.max(+new Date(a.joinedAt), +new Date(b.joinedAt));
    const end = Math.min(+new Date(a.leftAt), +new Date(b.leftAt));
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) overlaps.push([start, end]);
  }
  overlaps.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const interval of overlaps) {
    const last = merged.at(-1);
    if (last && interval[0] <= last[1]) last[1] = Math.max(last[1], interval[1]);
    else merged.push([...interval]);
  }
  return Math.floor(merged.reduce((n, [a, b]) => n + b - a, 0) / 60000);
}
