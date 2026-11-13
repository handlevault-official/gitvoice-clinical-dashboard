(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) { if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v); }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
const LS_KEY = "carenote.v1", uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8), clone = (o) => JSON.parse(JSON.stringify(o));
const newDB = () => ({ notes: [], draft: null, customTemplates: [], phrases: clone(APP_CONFIG.phrases), settings: { author: "", unit: "", role: APP_CONFIG.roles[0], tempUnit: "C", voiceLang: "en-PH", onDevice: false, spokenPunct: true, autoLock: 5, ranges: clone(APP_CONFIG.vitalsRanges) } });
function mergeDB(d) { const def = newDB(), db = Object.assign({}, def, d || {}); db.settings = Object.assign({}, def.settings, (d && d.settings) || {}); db.settings.ranges = Object.assign({}, def.settings.ranges, db.settings.ranges || {}); return db; }
const S = { db: null, key: null, salt: null, cur: null, active: null, rec: null, recTarget: null, listening: false, activity: Date.now(), ready: false, deferred: null, lockPayload: null };
let toastTimer, draftTimer;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 4200); }
const tpls = () => APP_CONFIG.templates.concat(S.db.customTemplates), getTpl = (id) => tpls().find((t) => t.id === id) || tpls()[0], hasTpl = (id) => tpls().some((t) => t.id === id);
const tplOf = (n) => n.tplSnap || getTpl(n.tpl), noteText = (n) => formatNote(n, tplOf(n), S.db.settings);

// ---------- storage ----------
async function persist() {
  if (!S.db) return; let payload;
  try { payload = S.key ? Object.assign({ enc: 1, salt: b64(S.salt) }, await CRYPTO.enc(S.db, S.key)) : { enc: 0, data: S.db }; localStorage.setItem(LS_KEY, JSON.stringify(payload)); }
  catch (e) { toast("Could not save: storage is full or blocked. Export a backup."); }
}
async function boot() {
  let p = null; try { p = JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { p = null; }
  if (!p) { S.db = newDB(); return start(); }
  if (!p.enc) { S.db = mergeDB(p.data); return start(); }
  S.salt = unb64(p.salt); showLock(p);
}
function showLock(p) { S.lockPayload = p; $("#lock").hidden = false; $("#app").hidden = true; $("#lockPass").value = ""; $("#lockMsg").textContent = ""; setTimeout(() => $("#lockPass").focus(), 50); }
function wipeUI() { $("#fields").replaceChildren(); $("#notesList").replaceChildren(); $("#preview").textContent = ""; $("#printArea").textContent = ""; $("#patient").value = ""; $("#vquick").value = ""; $$("#vitalsCard input").forEach((i) => (i.value = "")); $("#dlgBody").replaceChildren(); try { $("#dlg").close(); } catch (e) {} }
async function lockNow() {
  if (!S.key || !S.db) return; saveDraftState(); await persist(); stopDictation(true); wipeUI();
  S.db = null; S.cur = null; S.key = null; let p = null; try { p = JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) {} showLock(p);
}

// ---------- app state ----------
const blankCur = () => ({ tpl: S.db.settings.role === "Physician" ? "soap" : "dar", patient: "", fields: {}, vitals: {}, editingId: null, created: null, parentId: null, parentCreated: null });
function fillSelect(sel, pairs, value) { sel.replaceChildren(...pairs.map(([v, t]) => el("option", { value: v, text: t }))); sel.value = value; }
function refreshTplSelect() { fillSelect($("#tpl"), tpls().map((t) => [t.id, t.name]), (S.cur && S.cur.tpl) || tpls()[0].id); }
function start() {
  $("#app").hidden = false; $("#lock").hidden = true; if (!S.ready) { bindOnce(); S.ready = true; }
  const st = S.db.settings; fillSelect($("#role"), APP_CONFIG.roles.map((r) => [r, r]), st.role); fillSelect($("#vlang"), APP_CONFIG.voiceLangs, st.voiceLang);
  S.cur = S.db.draft ? Object.assign(blankCur(), clone(S.db.draft)) : blankCur(); if (!hasTpl(S.cur.tpl)) S.cur.tpl = tpls()[0].id;
  refreshTplSelect(); loadCurIntoForm(); renderChips(); renderSettings(); renderNotes();
  $("#vitalsCard").hidden = !APP_CONFIG.features.vitals; $("#chipsCard").hidden = !APP_CONFIG.features.phrases; $("#btnLock").hidden = !S.key; updateTempLbl(); showTab("new");
}
function loadCurIntoForm() { $("#tpl").value = S.cur.tpl; $("#patient").value = S.cur.patient || ""; renderFields(); loadVitals(); refreshPreview(); phiCheck(); }
function showTab(name) { for (const t of ["new", "notes", "settings"]) $("#tab-" + t).hidden = t !== name; $$(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name)); if (name === "notes") renderNotes(); window.scrollTo(0, 0); }
function saveDraftState() { if (S.db && S.cur) S.db.draft = clone(S.cur); }
function saveDraftSoon() { clearTimeout(draftTimer); draftTimer = setTimeout(() => { saveDraftState(); persist(); }, 700); }
function onChange() { refreshPreview(); phiCheck(); saveDraftSoon(); }
function buildNote() {
  const st = S.db.settings, tpl = getTpl(S.cur.tpl);
  return { id: S.cur.editingId || uid(), tpl: tpl.id, tplSnap: { name: tpl.name, fields: clone(tpl.fields) }, created: S.cur.created || Date.now(), patient: S.cur.patient.trim(), author: st.author, role: st.role, vitals: clone(S.cur.vitals), fields: clone(S.cur.fields), locked: false, parentId: S.cur.parentId || null, parentCreated: S.cur.parentCreated || null };
}
function refreshPreview() { const n = buildNote(); $("#preview").textContent = formatNote(n, n.tplSnap, S.db.settings); }
function phiCheck() {
  const txt = [S.cur.patient, ...Object.values(S.cur.fields)].join("\n"), found = detectPHI(txt), w = $("#phiWarn");
  w.hidden = !found.length; w.textContent = found.length ? "Possible identifying information found: " + found.join(", ") + ". Remove it, or make sure your facility allows storing it here." : "";
}

// ---------- fields ----------
function renderFields() {
  const tpl = getTpl(S.cur.tpl), box = $("#fields"); box.replaceChildren();
  for (const f of tpl.fields) {
    const ta = el("textarea", { id: "f-" + f.id, rows: f.rows || 3, placeholder: f.hint || "", "aria-label": f.label }); ta.value = S.cur.fields[f.id] || "";
    ta.addEventListener("focus", () => (S.active = f.id)); ta.addEventListener("input", () => { S.cur.fields[f.id] = ta.value; onChange(); });
    const mic = el("button", { class: "mic" + (S.listening && S.recTarget === f.id ? " on" : ""), "data-target": f.id, type: "button", "aria-label": "Dictate " + f.label, text: "Mic", onclick: () => toggleMic(f.id) });
    const clr = el("button", { class: "mic", type: "button", "aria-label": "Clear " + f.label, text: "Clear", onclick: () => { ta.value = ""; S.cur.fields[f.id] = ""; onChange(); } });
    box.append(el("div", { class: "card fld" }, el("div", { class: "head" }, el("label", { for: "f-" + f.id, text: f.label }), el("div", { class: "tools" }, mic, clr)), ta));
  }
}
function insertInto(text, asLine) {
  const tpl = getTpl(S.cur.tpl), f = tpl.fields.find((x) => x.id === S.active) || tpl.fields[0], ta = $("#f-" + f.id);
  ta.value = asLine ? (ta.value ? ta.value.replace(/\s+$/, "") + "\n" : "") + text : appendText(ta.value, text); S.cur.fields[f.id] = ta.value; onChange(); return f.label;
}
function renderChips() { const box = $("#chips"); box.replaceChildren(...S.db.phrases.map((p) => el("button", { class: "chip", type: "button", text: p, onclick: () => insertInto(p, false) }))); }

// ---------- vitals ----------
const toDisp = (c) => (S.db.settings.tempUnit === "F" ? Math.round((c * 9 / 5 + 32) * 10) / 10 : c);
function updateTempLbl() { $("#tempLbl").textContent = S.db.settings.tempUnit === "F" ? "\u00B0F" : "\u00B0C"; }
function loadVitals() { for (const k of VITAL_KEYS) { const v = S.cur.vitals[k]; $("#v-" + k).value = v === undefined || v === "" ? "" : k === "temp" ? toDisp(v) : v; } flagInputs(); }
function flagInputs() { const f = flagVitals(S.cur.vitals, S.db.settings.ranges); for (const k of VITAL_KEYS) $("#v-" + k).classList.toggle("flag", !!f[k]); }
function readVitals() {
  const v = {}; for (const k of VITAL_KEYS) { let x = parseFloat($("#v-" + k).value.replace(",", ".")); if (Number.isNaN(x)) continue; if (k === "temp" && S.db.settings.tempUnit === "F") x = Math.round((x - 32) * 5 / 9 * 10) / 10; v[k] = x; }
  S.cur.vitals = v; flagInputs(); onChange();
}
function fillFromText(text) {
  const v = parseVitals(text), n = Object.keys(v).length; if (!n) return toast('Could not find vitals. Try: "BP 120/80, HR 88, RR 18, temp 37.2, SpO2 98, pain 3"');
  Object.assign(S.cur.vitals, v); loadVitals(); onChange(); toast("Filled " + n + " values. Please double-check them.");
}

// ---------- voice dictation ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function setMic(on, text) { document.body.dataset.mic = on ? "on" : "off"; $("#micState").textContent = text; $("#btnStop").hidden = !on; $$(".mic[data-target]").forEach((b) => b.classList.toggle("on", on && b.dataset.target === S.recTarget)); }
function toggleMic(id) { if (S.listening && S.recTarget === id) stopDictation(); else startDictation(id); }
function startDictation(target) {
  if (!SR) return toast("Voice dictation is not supported in this browser. Try Chrome, Edge or Safari. You can still type.");
  stopDictation(true); S.recTarget = target; S.listening = true; const rec = new SR(); S.rec = rec; rec.lang = S.db.settings.voiceLang; rec.continuous = true; rec.interimResults = true;
  if (S.db.settings.onDevice && APP_CONFIG.features.onDeviceVoice && "processLocally" in rec) { try { rec.processLocally = true; } catch (e) {} }
  rec.onresult = (e) => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i], t = r[0].transcript; if (r.isFinal) handleFinal(t); else interim += t; } $("#interim").textContent = interim; };
  rec.onerror = (e) => {
    const msg = { "not-allowed": "Microphone permission is blocked. Allow the mic for this site in your browser settings.", "service-not-allowed": "Speech service is not allowed in this browser.", "audio-capture": "No microphone found.", "network": "This browser needs internet for voice (or turn on on-device voice in Settings).", "language-not-supported": "On-device voice is not available for this language. Turn it off in Settings." }[e.error];
    if (msg) toast(msg); if (["not-allowed", "service-not-allowed", "audio-capture", "language-not-supported"].includes(e.error)) S.listening = false;
  };
  rec.onend = () => { $("#interim").textContent = ""; if (S.listening && S.rec === rec) { try { rec.start(); return; } catch (e) { S.listening = false; } } if (S.rec === rec) { S.rec = null; setMic(false, "Mic off"); } };
  try { rec.start(); setMic(true, "Listening..."); } catch (e) { S.listening = false; toast("Could not start the microphone."); }
}
function stopDictation(silent) { S.listening = false; const r = S.rec; S.rec = null; if (r) { try { r.stop(); } catch (e) {} } if (!silent) setMic(false, "Mic off"); }
function moveField(dir) {
  const ids = getTpl(S.cur.tpl).fields.map((f) => f.id); let i = ids.indexOf(S.recTarget); if (i < 0) i = ids.indexOf(S.active); const j = Math.min(ids.length - 1, Math.max(0, i + dir));
  S.recTarget = ids[j]; const ta = $("#f-" + ids[j]); if (ta) ta.focus(); setMic(true, "Listening...");
}
function handleFinal(raw) {
  const cmd = raw.trim().toLowerCase().replace(/[.!?]$/, "");
  if (cmd === "next field") return moveField(1); if (cmd === "previous field") return moveField(-1); if (cmd === "stop dictation") return stopDictation(); if (cmd === "save draft") return saveNote(false);
  const text = normalizeDictation(raw, S.db.settings.spokenPunct);
  if (S.recTarget === "vquick") { const q = $("#vquick"); q.value = appendText(q.value, text); fillFromText(q.value); return; }
  const ta = $("#f-" + S.recTarget); if (!ta) return; ta.value = appendText(ta.value, text); S.cur.fields[S.recTarget] = ta.value; onChange();
}

// ---------- save / export ----------
async function saveNote(final) {
  if (!S.cur.patient.trim() && !Object.values(S.cur.fields).some((v) => v && v.trim())) return toast("Nothing to save yet.");
  if (final && !confirm("Finalize this note? It becomes read-only. You can add an addendum later.")) return;
  const note = buildNote(); if (final) { note.locked = true; note.lockedAt = Date.now(); }
  const i = S.db.notes.findIndex((n) => n.id === note.id); if (i >= 0) S.db.notes[i] = note; else S.db.notes.push(note);
  if (final) { S.cur = blankCur(); S.db.draft = null; loadCurIntoForm(); showTab("notes"); } else { S.cur.editingId = note.id; S.cur.created = note.created; S.db.draft = clone(S.cur); }
  await persist(); renderNotes(); toast(final ? "Finalized and saved on this device." : "Draft saved on this device.");
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("Copied. Paste it into your official record."); }
  catch (e) { const ta = el("textarea", { style: "position:fixed;opacity:0" }); ta.value = text; document.body.append(ta); ta.select(); try { document.execCommand("copy"); toast("Copied."); } catch (e2) { toast("Copy failed. Select the preview text and copy it manually."); } ta.remove(); }
}
function download(name, text, type) { const a = el("a", { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
const fname = (n, ext) => "note-" + stamp(n.created).replace(/[: ]/g, "-") + "." + ext;
function printText(text) { $("#printArea").textContent = text; window.print(); }

// ---------- notes list ----------
function renderNotes() {
  const q = $("#search").value.trim().toLowerCase(), all = S.db.notes, list = all.slice().sort((a, b) => b.created - a.created).filter((n) => !q || noteText(n).toLowerCase().includes(q));
  $("#notesCount").textContent = list.length + " of " + all.length + " notes on this device"; const box = $("#notesList"); box.replaceChildren();
  if (!list.length) box.append(el("p", { class: "hint", text: "No notes yet." }));
  for (const n of list) {
    const snip = (Object.values(n.fields).find((v) => v && v.trim()) || "").slice(0, 110);
    box.append(el("button", { class: "note-item card", type: "button", onclick: () => openNote(n.id) },
      el("div", {}, el("span", { class: "badge" + (n.locked ? " final" : ""), text: n.locked ? "Final" : "Draft" }), el("strong", { text: n.patient || "(no label)" }), " ", el("span", { class: "hint", text: stamp(n.created) })),
      el("div", { class: "hint", text: tplOf(n).name + (n.parentId ? " (addendum)" : "") }), el("div", { text: snip })));
  }
}
function openNote(id) {
  const n = S.db.notes.find((x) => x.id === id); if (!n) return; const text = noteText(n), dlg = $("#dlg"), body = $("#dlgBody"), close = () => dlg.close();
  const btns = [el("button", { text: "Copy", onclick: () => copyText(text) }), el("button", { text: "Download .txt", onclick: () => download(fname(n, "txt"), text, "text/plain") }), el("button", { text: "Print", onclick: () => printText(text) })];
  if (!n.locked) btns.push(el("button", { class: "primary", text: "Edit", onclick: () => { close(); editNote(n); } }));
  if (n.locked && APP_CONFIG.features.addendum) btns.push(el("button", { text: "Add addendum", onclick: () => { close(); addendum(n); } }));
  btns.push(el("button", { class: "danger", text: "Delete", onclick: async () => { if (!confirm("Delete this note from this device?")) return; S.db.notes = S.db.notes.filter((x) => x.id !== id); await persist(); renderNotes(); close(); toast("Deleted."); } }), el("button", { text: "Close", onclick: close }));
  body.replaceChildren(el("pre", { text }), el("div", { class: "actions" }, btns)); dlg.showModal();
}
function editNote(n) { S.cur = { tpl: hasTpl(n.tpl) ? n.tpl : tpls()[0].id, patient: n.patient, fields: clone(n.fields), vitals: clone(n.vitals || {}), editingId: n.id, created: n.created, parentId: n.parentId, parentCreated: n.parentCreated }; loadCurIntoForm(); showTab("new"); }
function addendum(n) { S.cur = Object.assign(blankCur(), { tpl: "narrative", patient: n.patient, parentId: n.id, parentCreated: n.created }); loadCurIntoForm(); showTab("new"); toast("Write your addendum. The original note stays unchanged."); }

// ---------- settings ----------
function renderSettings() {
  const st = S.db.settings; $("#s-author").value = st.author; $("#s-unit").value = st.unit; $("#s-temp").value = st.tempUnit; $("#s-lock").value = st.autoLock; $("#s-punct").checked = !!st.spokenPunct; $("#s-ondevice").checked = !!st.onDevice; $("#s-phrases").value = S.db.phrases.join("\n");
  const labels = { sbp: "Systolic", dbp: "Diastolic", hr: "Heart rate", rr: "Resp. rate", temp: "Temp (\u00B0C)", spo2: "SpO2 %", pain: "Pain" }, box = $("#ranges"); box.replaceChildren();
  for (const k of VITAL_KEYS) {
    const lo = el("input", { type: "number", step: "any", "aria-label": labels[k] + " minimum", value: st.ranges[k][0] }), hi = el("input", { type: "number", step: "any", "aria-label": labels[k] + " maximum", value: st.ranges[k][1] });
    const upd = () => { const a = parseFloat(lo.value), b = parseFloat(hi.value); if (Number.isNaN(a) || Number.isNaN(b)) return; st.ranges[k] = [a, b]; persist(); flagInputs(); }; lo.addEventListener("change", upd); hi.addEventListener("change", upd);
    box.append(el("div", {}, el("label", { text: labels[k] }), el("div", { class: "row" }, lo, hi)));
  }
  const cl = $("#ctList"); cl.replaceChildren(...(S.db.customTemplates.length ? S.db.customTemplates.map((t) => el("div", { class: "row", style: "justify-content:space-between;margin-bottom:6px" }, el("span", { text: t.name + " (" + t.fields.map((f) => f.label).join(", ") + ")" }), el("button", { class: "danger", text: "Delete", onclick: async () => { if (!confirm("Delete this format? Saved notes keep their layout.")) return; S.db.customTemplates = S.db.customTemplates.filter((x) => x.id !== t.id); if (S.cur.tpl === t.id) S.cur.tpl = tpls()[0].id; refreshTplSelect(); loadCurIntoForm(); await persist(); renderSettings(); } }))) : [el("p", { class: "hint", text: "No custom formats yet." })]));
  renderPass();
}
function renderPass() {
  const box = $("#passArea"); box.replaceChildren();
  if (S.key) { box.append(el("p", { text: "Passcode is ON. Notes on this device are encrypted." }), el("div", { class: "row" }, el("button", { text: "Change passcode", onclick: () => setPasscode(true) }), el("button", { class: "danger", text: "Remove passcode", onclick: async () => { if (!confirm("Remove the passcode? Notes will be stored without encryption.")) return; S.key = null; await persist(); renderPass(); $("#btnLock").hidden = true; toast("Passcode removed."); } }))); }
  else box.append(el("p", { class: "hint", text: "No passcode set. Anyone who opens this browser on this device can read the notes." }), el("button", { class: "primary", text: "Set passcode", onclick: () => setPasscode(false) }));
}
async function setPasscode(change) {
  const p1 = prompt((change ? "New" : "Choose a") + " passcode (at least 6 characters). If you forget it, the notes cannot be recovered."); if (!p1) return;
  if (p1.length < 6) return toast("Passcode must be at least 6 characters."); if (prompt("Type the passcode again to confirm") !== p1) return toast("Passcodes did not match.");
  S.salt = crypto.getRandomValues(new Uint8Array(16)); S.key = await CRYPTO.derive(p1, S.salt); await persist(); renderPass(); $("#btnLock").hidden = false; toast("Passcode set. Notes are now encrypted.");
}
async function exportBackup() { await persist(); download("carenote-backup-" + stamp(Date.now()).slice(0, 10) + ".json", localStorage.getItem(LS_KEY) || "{}", "application/json"); toast(S.key ? "Encrypted backup downloaded." : "Backup downloaded (not encrypted; set a passcode to encrypt)."); }
async function importBackup(file) {
  try {
    const p = JSON.parse(await file.text()); let db, key = null, salt = null;
    if (p.enc) { const pass = prompt("Enter the passcode for this backup"); if (!pass) return; salt = unb64(p.salt); key = await CRYPTO.derive(pass, salt); db = await CRYPTO.dec(p, key); } else db = p.data;
    if (!db || !Array.isArray(db.notes)) throw new Error("bad"); if (!confirm("Replace ALL data on this device with this backup?")) return;
    S.salt = salt; S.key = key; S.db = mergeDB(db); await persist(); start(); toast("Backup restored.");
  } catch (e) { toast("That file could not be opened (wrong passcode or not a CareNote backup)."); }
}

// ---------- wiring ----------
function bindOnce() {
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("#role").addEventListener("change", (e) => { S.db.settings.role = e.target.value; persist(); refreshPreview(); });
  $("#tpl").addEventListener("change", (e) => { S.cur.tpl = e.target.value; S.active = null; renderFields(); onChange(); });
  $("#patient").addEventListener("input", (e) => { S.cur.patient = e.target.value; onChange(); });
  $("#vlang").addEventListener("change", (e) => { S.db.settings.voiceLang = e.target.value; persist(); if (S.listening) { const t = S.recTarget; startDictation(t); } });
  $("#btnStop").addEventListener("click", () => stopDictation());
  for (const k of VITAL_KEYS) $("#v-" + k).addEventListener("input", readVitals);
  $("#vfill").addEventListener("click", () => fillFromText($("#vquick").value)); $("#vquick").addEventListener("keydown", (e) => { if (e.key === "Enter") fillFromText(e.target.value); });
  $("#vmic").addEventListener("click", () => toggleMic("vquick")); $("#vinsert").addEventListener("click", () => { const t = formatVitals(S.cur.vitals, S.db.settings.tempUnit); if (!t) return toast("Enter some vitals first."); toast("Vitals added to " + insertInto(t, true)); });
  $("#btnSave").addEventListener("click", () => saveNote(false)); $("#btnFinal").addEventListener("click", () => saveNote(true));
  $("#btnCopy").addEventListener("click", () => copyText($("#preview").textContent)); $("#btnTxt").addEventListener("click", () => download(fname(buildNote(), "txt"), $("#preview").textContent, "text/plain")); $("#btnPrint").addEventListener("click", () => printText($("#preview").textContent));
  $("#btnNew").addEventListener("click", () => { if (!confirm("Clear this form? Unsaved text will be lost.")) return; S.cur = blankCur(); S.db.draft = null; loadCurIntoForm(); persist(); });
  $("#search").addEventListener("input", renderNotes);
  const bindSet = (id, fn, ev = "input") => $(id).addEventListener(ev, (e) => { fn(e.target); persist(); });
  bindSet("#s-author", (t) => { S.db.settings.author = t.value; refreshPreview(); }); bindSet("#s-unit", (t) => { S.db.settings.unit = t.value; refreshPreview(); });
  bindSet("#s-temp", (t) => { S.db.settings.tempUnit = t.value; updateTempLbl(); loadVitals(); refreshPreview(); }, "change");
  bindSet("#s-lock", (t) => { S.db.settings.autoLock = Math.max(1, +t.value || 5); }, "change"); bindSet("#s-punct", (t) => { S.db.settings.spokenPunct = t.checked; }, "change"); bindSet("#s-ondevice", (t) => { S.db.settings.onDevice = t.checked; }, "change");
  bindSet("#s-phrases", (t) => { S.db.phrases = t.value.split("\n").map((x) => x.trim()).filter(Boolean); renderChips(); });
  $("#ctAdd").addEventListener("click", () => { $("#ctName").value = ""; $("#ctFields").value = ""; $("#ctDlg").showModal(); }); $("#ctCancel").addEventListener("click", () => $("#ctDlg").close());
  $("#ctSave").addEventListener("click", async () => {
    const name = $("#ctName").value.trim(), fields = $("#ctFields").value.split("\n").map((x) => x.trim()).filter(Boolean); if (!name || !fields.length) return toast("Add a name and at least one field.");
    S.db.customTemplates.push({ id: "c-" + uid(), name, fields: fields.map((l, i) => ({ id: "f" + i, label: l, rows: 3 })) }); $("#ctDlg").close(); refreshTplSelect(); await persist(); renderSettings(); toast("Format added. Choose it in New note.");
  });
  $("#btnExport").addEventListener("click", exportBackup); $("#fileImport").addEventListener("change", (e) => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ""; });
  $("#btnWipe").addEventListener("click", () => { if (confirm("Delete ALL notes and settings on this device?") && confirm("This cannot be undone. Delete everything?")) { stopDictation(true); localStorage.removeItem(LS_KEY); location.reload(); } });
  $("#btnLock").addEventListener("click", lockNow);
  ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, () => (S.activity = Date.now()), true));
  document.addEventListener("visibilitychange", () => { if (document.hidden && S.db) { saveDraftState(); persist(); } });
  setInterval(() => { if (S.key && S.db && Date.now() - S.activity > (S.db.settings.autoLock || 5) * 60000) lockNow(); }, 15000);
}
$("#lockForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try { const key = await CRYPTO.derive($("#lockPass").value, S.salt), db = await CRYPTO.dec(S.lockPayload, key); S.key = key; S.db = mergeDB(db); S.activity = Date.now(); start(); }
  catch (err) { $("#lockMsg").textContent = "Wrong passcode. Try again."; }
});
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); S.deferred = e; $("#btnInstall").hidden = false; });
$("#btnInstall").addEventListener("click", async () => { if (!S.deferred) return; S.deferred.prompt(); await S.deferred.userChoice; S.deferred = null; $("#btnInstall").hidden = true; });
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
boot();
})();
