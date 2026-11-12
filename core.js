// ==CORE-START==  (pure logic: no DOM. Tested in Node.)
const APP_CONFIG = {
  appName: "CareNote Assist",
  features: { vitals: true, phrases: true, addendum: true, onDeviceVoice: true },
  roles: ["Nurse", "Physician", "Other"],
  templates: [
    { id: "dar", name: "Nursing DAR (focus charting)", fields: [
      { id: "focus", label: "Focus", rows: 2, hint: "Problem, concern or event being documented" },
      { id: "data", label: "Data", rows: 4, hint: "Assessment findings, observations, what the patient says" },
      { id: "action", label: "Action", rows: 4, hint: "What you did: interventions, notifications, teaching" },
      { id: "response", label: "Response", rows: 3, hint: "Patient response and outcome" } ] },
    { id: "soap", name: "SOAP progress note", fields: [
      { id: "s", label: "Subjective", rows: 3, hint: "Patient's own words, symptoms, history since last note" },
      { id: "o", label: "Objective", rows: 4, hint: "Vitals, exam, results" },
      { id: "a", label: "Assessment", rows: 3, hint: "Impression, problem list" },
      { id: "p", label: "Plan", rows: 3, hint: "Orders, follow-up, monitoring" } ] },
    { id: "sbar", name: "SBAR communication", fields: [
      { id: "s", label: "Situation", rows: 2 }, { id: "b", label: "Background", rows: 3 },
      { id: "a", label: "Assessment", rows: 3 }, { id: "r", label: "Recommendation / request", rows: 3 } ] },
    { id: "ipass", name: "Shift handoff (I-PASS)", fields: [
      { id: "i", label: "Illness severity", rows: 1, hint: "Stable / watcher / unstable" }, { id: "p", label: "Patient summary", rows: 4 },
      { id: "a", label: "Action list", rows: 3 }, { id: "s", label: "Situation awareness & contingency", rows: 3 }, { id: "y", label: "Synthesis by receiver", rows: 2 } ] },
    { id: "narrative", name: "Nursing narrative", fields: [{ id: "note", label: "Narrative", rows: 8 }] }
  ],
  // Generic adult highlight ranges. They only HIGHLIGHT values; they are not clinical advice. Edit in Settings.
  vitalsRanges: { sbp: [90, 140], dbp: [50, 90], hr: [50, 100], rr: [12, 20], temp: [36.1, 37.8], spo2: [94, 100], pain: [0, 3] },
  phrases: ["Patient awake and resting in bed.", "Call light within reach.", "Patient verbalized understanding of teaching.", "Will continue to monitor."],
  voiceLangs: [["en-PH", "English (Philippines)"], ["fil-PH", "Filipino"], ["en-US", "English (US)"]]
};
const VITAL_KEYS = ["sbp", "dbp", "hr", "rr", "temp", "spo2", "pain"];
const VITAL_LIMITS = { sbp: [40, 300], dbp: [20, 200], hr: [20, 300], rr: [4, 80], temp: [25, 45], spo2: [50, 100], pain: [0, 10] };

function b64(buf) { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); }
function unb64(str) { const s = atob(str), a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
const CRYPTO = {
  async derive(pass, salt) { const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); },
  async enc(obj, key) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj))); return { iv: b64(iv), ct: b64(ct) }; },
  async dec(p, key) { const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(p.iv) }, key, unb64(p.ct)); return JSON.parse(new TextDecoder().decode(pt)); }
};

function parseVitals(text) {
  const t = " " + String(text || "").toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ") + " "; const v = {}; let m;
  if ((m = t.match(/(?:\bbp\b|blood pressure)\s*(?:is|of|:)?\s*(\d{2,3})\s*(?:\/|over|\bby\b|-)\s*(\d{2,3})/))) { v.sbp = +m[1]; v.dbp = +m[2]; }
  if ((m = t.match(/(?:\bhr\b|heart rate|pulse rate|pulse|\bpr\b)\s*(?:is|of|:)?\s*(\d{2,3})/))) v.hr = +m[1];
  if ((m = t.match(/(?:\brr\b|resp(?:iratory|iration)?s? rate|respirations?)\s*(?:is|of|:)?\s*(\d{1,2})\b/))) v.rr = +m[1];
  if ((m = t.match(/\btemp(?:erature)?\s*(?:is|of|:)?\s*(\d{2,3}(?:\.\d)?)/))) { let x = +m[1]; if (x >= 45) x = Math.round((x - 32) * 5 / 9 * 10) / 10; v.temp = x; }
  if ((m = t.match(/(?:\bspo2\b|\bsp02\b|o2 sat(?:uration)?s?|oxygen sat(?:uration)?|\bsats?\b)\s*(?:is|of|:)?\s*(\d{2,3})/))) v.spo2 = +m[1];
  if ((m = t.match(/\bpain\b(?: score| level)?\s*(?:is|of|:)?\s*(\d{1,2})/))) v.pain = +m[1];
  for (const k of VITAL_KEYS) if (v[k] !== undefined && (v[k] < VITAL_LIMITS[k][0] || v[k] > VITAL_LIMITS[k][1])) delete v[k];
  return v;
}
function flagVitals(v, ranges) { const out = {}; for (const k of VITAL_KEYS) { const x = v[k]; if (x === undefined || x === "" || x === null || !ranges[k]) continue; if (+x < ranges[k][0] || +x > ranges[k][1]) out[k] = true; } return out; }
function formatVitals(v, unit) {
  const p = [];
  if (v.sbp && v.dbp) p.push(`BP ${v.sbp}/${v.dbp} mmHg`); if (v.hr) p.push(`HR ${v.hr} bpm`); if (v.rr) p.push(`RR ${v.rr}/min`);
  if (v.temp) p.push(unit === "F" ? `Temp ${Math.round((v.temp * 9 / 5 + 32) * 10) / 10} \u00B0F` : `Temp ${v.temp} \u00B0C`);
  if (v.spo2) p.push(`SpO2 ${v.spo2}%`); if (v.pain !== undefined && v.pain !== "") p.push(`Pain ${v.pain}/10`);
  return p.length ? "Vitals: " + p.join("; ") + "." : "";
}
function normalizeDictation(t, on = true) {
  if (!on) return t.replace(/^ +| +$/g, ""); let s = " " + t + " ";
  const map = [["new paragraph", "\n\n"], ["new line", "\n"], ["period", "."], ["full stop", "."], ["comma", ","], ["colon", ":"], ["semicolon", ";"], ["question mark", "?"], ["slash", "/"], ["percent", "%"]];
  for (const [w, r] of map) s = s.replace(new RegExp("\\s*\\b" + w + "\\b\\s*", "gi"), r + (r[0] === "\n" ? "" : " "));
  return s.replace(/ +([.,;:?%])/g, "$1").replace(/\/ +/g, "/").replace(/^ +| +$/g, "");
}
function appendText(cur, add) {
  add = add.replace(/^ +| +$/g, ""); if (!add) return cur; const startsPunct = /^[.,;:!?%)\]\/]/.test(add), endsOpen = cur === "" || /[\s(\[\/]$/.test(cur);
  let piece = add; if (cur === "" || /[.!?]\s*$|\n\s*$/.test(cur)) piece = piece.charAt(0).toUpperCase() + piece.slice(1);
  return cur + (cur && !endsOpen && !startsPunct ? " " : "") + piece;
}
function detectPHI(t) {
  const out = [];
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) out.push("an email address");
  if (/(?:\+?63|\b0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b|\b\d{3}[\s-]\d{3,4}[\s-]\d{4}\b/.test(t)) out.push("a phone number");
  if (/\b\d{8,}\b/.test(t)) out.push("a long ID number");
  if (/\b(?:mrn|dob|birth ?date|born on)\b/i.test(t)) out.push("an ID or birthdate label");
  if (/\b(?:mr|mrs|ms|miss|sir|ma'?am)\.?\s+[A-Z][a-z]+/.test(t)) out.push("a person's name");
  if (/\b(?:0?[1-9]|1[0-2])[\/-](?:0?[1-9]|[12]\d|3[01])[\/-](?:19|20)\d{2}\b/.test(t)) out.push("a full date (possible birthdate)");
  return out;
}
function pad2(n) { return String(n).padStart(2, "0"); }
function stamp(ts) { const d = new Date(ts); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function formatNote(note, tpl, settings) {
  const L = ["NOTE: " + (tpl ? tpl.name : note.tplName || note.tpl), "Date/Time: " + stamp(note.created), "Patient: " + (note.patient || "(not entered)"), "Author: " + [note.author, note.role].filter(Boolean).join(", ")];
  if (settings && settings.unit) L.push("Unit: " + settings.unit);
  if (note.parentId) L.push("ADDENDUM to note dated " + stamp(note.parentCreated || note.created));
  L.push("-----");
  const vit = formatVitals(note.vitals || {}, (settings && settings.tempUnit) || "C"); if (vit && !JSON.stringify(note.fields).includes("Vitals:")) L.push(vit);
  for (const f of (tpl ? tpl.fields : [])) { const x = (note.fields[f.id] || "").trim(); if (x) L.push(f.label.toUpperCase() + ": " + x); }
  L.push("-----", note.locked ? `FINALIZED ${stamp(note.lockedAt)} (read-only)` : "DRAFT (not finalized)"); return L.join("\n");
}
// ==CORE-END==
if (typeof module !== "undefined") module.exports = { APP_CONFIG, CRYPTO, parseVitals, flagVitals, formatVitals, normalizeDictation, appendText, detectPHI, formatNote };
