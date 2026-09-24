/* CodeXStudys Profile Dashboard: Profile / Exam / Stats. All data in localStorage. */
(() => {
const K = "cx-profile-v1";
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const defExams = [["JEE Main", "2027-01-20"], ["JEE Advanced", "2027-05-16"], ["NEET UG", "2027-05-04"], ["CUET UG", "2027-05-12"], ["BITSAT", "2027-04-20"], ["MHT-CET", "2026-12-15"], ["UPSC CSE", "2027-05-23"], ["BPSC", "2026-12-01"]];
let S;
try { S = JSON.parse(localStorage.getItem(K)); } catch (e) {}
S = Object.assign({ name: "Student Name", pic: "", xp: 0, joined: today(), visits: 0, studySec: 0, sessions: 0, pomos: 0, goalsDone: 0, notesMade: 0, days: {}, mood: {}, goals: [], notes: [], batches: {}, exams: defExams.map((e, i) => ({ id: "e" + i, name: e[0], date: e[1], on: true })), alarmMin: 30, tab: "profile", ntab: "Study", fcCat: "Physics" }, S || {});
const save = () => { try { localStorage.setItem(K, JSON.stringify(S)); } catch (e) { toast("Storage full - remove the profile picture"); } };
const LV = [[0, "Beginner"], [100, "Learner"], [400, "Focused"], [1000, "Advanced"], [2500, "Master"]];
const RK = [[0, "🥉 Bronze"], [200, "🥈 Silver"], [600, "🥇 Gold"], [1500, "💎 Platinum"], [3000, "👑 Diamond"], [6000, "🏆 Legend"]];
const rank = () => RK.filter((l) => S.xp >= l[0]).pop()[1];
const level = () => LV.filter((l) => S.xp >= l[0]).pop()[1];
function toast(m) { let t = $("#cxToast"); if (!t) { t = document.createElement("div"); t.id = "cxToast"; document.body.appendChild(t); } t.textContent = m; t.className = "show"; clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ""), 2600); }
function popup(m) { const o = document.createElement("div"); o.className = "cx-pop"; o.innerHTML = `<div><h3>${esc(m)}</h3><button class="cx-btn">OK</button></div>`; o.onclick = (e) => { if (e.target === o || e.target.tagName === "BUTTON") o.remove(); }; document.body.appendChild(o); }
function chime() { try { const a = new (window.AudioContext || window.webkitAudioContext)(); [523, 659, 784, 1047].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f; const t = a.currentTime + i * 0.25; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.55); }); setTimeout(() => a.close(), 1800); } catch (e) {} if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
function reward(xp, sec, kind) { S.xp += xp; S.studySec += sec; S.days[today()] = (S.days[today()] || 0) + sec; if (kind === "s") S.sessions++; if (kind === "p") { S.pomos++; S.sessions++; } save(); }
function streaks() { let cur = 0, best = 0, run = 0; const keys = Object.keys(S.days).filter((k) => S.days[k] > 0 || S.days[k] === 0 && false).sort(); let prev = null; keys.forEach((k) => { const d = new Date(k + "T00:00:00"); run = prev && Math.round((d - prev) / 864e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }); const d = new Date(); if (!S.days[today()]) d.setDate(d.getDate() - 1); while (S.days[new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10)]) { cur++; d.setDate(d.getDate() - 1); } return [cur, best]; }
const fmtT = (s) => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
const fmtH = (s) => (s >= 3600 ? Math.floor(s / 3600) + "h " : "") + Math.floor((s % 3600) / 60) + "m " + Math.floor(s % 60) + "s";

/* Countdown timer (alarm + pomodoro) */
function Timer(onDone) { const t = { left: 0, end: 0, run: false, id: 0, total: 0, set(sec) { t.stop(); t.left = t.total = sec; t.tick(); }, start() { if (t.run || t.left <= 0) return; t.end = Date.now() + t.left * 1000; t.run = true; t.id = setInterval(t.upd, 500); t.tick(); }, pause() { if (!t.run) return; t.upd(); t.stop(); }, stop() { clearInterval(t.id); t.run = false; }, upd() { t.left = Math.max(0, (t.end - Date.now()) / 1000); t.tick(); if (t.left <= 0) { t.stop(); onDone(); } }, tick() {} }; return t; }
let alarm, pomo, pomoMode = 25, pomoBreak = false;
alarm = Timer(() => { chime(); reward(Math.max(1, Math.round(alarm.total / 30)), alarm.total, "s"); popup("Study session completed!"); render(); });
pomo = Timer(() => { chime(); if (!pomoBreak) { reward(30 + Math.round(pomo.total / 60), pomo.total, "p"); popup("Pomodoro completed! Take a 5 minute break."); pomoBreak = true; pomo.set(300); } else { popup("Break over. Ready for the next one?"); pomoBreak = false; pomo.set(pomoMode * 60); } render(); });
S.alarmSec = S.alarmSec || S.alarmMin * 60; pomo.set(25 * 60); alarm.set(S.alarmSec);

/* Flashcards - add more questions by pushing [q, a] into any array */
const FC = { Physics: [["SI unit of force?", "Newton (N)"], ["Formula for kinetic energy?", "½mv²"], ["Speed of light in vacuum?", "3×10⁸ m/s"], ["Unit of resistance?", "Ohm (Ω)"], ["Newton's 2nd law?", "F = ma"], ["Value of g on Earth?", "9.8 m/s²"]], Chemistry: [["Atomic number of Carbon?", "6"], ["pH of pure water at 25°C?", "7"], ["Formula of table salt?", "NaCl"], ["Avogadro's number?", "6.022×10²³"], ["Noble gas with atomic number 10?", "Neon"], ["Most electronegative element?", "Fluorine"]], Botany: [["Powerhouse of the cell?", "Mitochondria"], ["Pigment for photosynthesis?", "Chlorophyll"], ["Site of photosynthesis?", "Chloroplast"], ["Plant hormone for cell elongation?", "Auxin"], ["Study of fungi?", "Mycology"]], Zoology: [["Largest phylum of animals?", "Arthropoda"], ["Functional unit of kidney?", "Nephron"], ["Blood group universal donor?", "O negative"], ["Number of chambers in human heart?", "4"], ["Hormone lowering blood sugar?", "Insulin"]], Biology: [["Basic unit of life?", "Cell"], ["DNA full form?", "Deoxyribonucleic acid"], ["Who proposed the cell theory?", "Schleiden and Schwann"], ["Process of cell division in somatic cells?", "Mitosis"], ["Enzyme that unwinds DNA?", "Helicase"]], Maths: [["Derivative of sin x?", "cos x"], ["Value of π (approx)?", "3.14159"], ["Sum of angles in a triangle?", "180°"], ["∫ 1/x dx = ?", "ln|x| + C"], ["Quadratic formula?", "x = (−b ± √(b²−4ac)) / 2a"], ["log(ab) = ?", "log a + log b"]], GK: [["Capital of India?", "New Delhi"], ["Largest planet?", "Jupiter"], ["National animal of India?", "Bengal Tiger"], ["Who wrote the Indian Constitution's draft?", "B. R. Ambedkar (Drafting Committee chair)"], ["Longest river in India?", "Ganga"]], English: [["Synonym of 'Abundant'?", "Plentiful"], ["Antonym of 'Brave'?", "Cowardly"], ["Plural of 'Child'?", "Children"], ["Past tense of 'Go'?", "Went"], ["One word: 'One who loves books'?", "Bibliophile"]], Hindi: [["'Sun' in Hindi?", "Surya (सूर्य)"], ["'Water' in Hindi?", "Jal / Pani (जल / पानी)"], ["Hindi word for 'Book'?", "Pustak (पुस्तक)"], ["National language script of Hindi?", "Devanagari"], ["'Friend' in Hindi?", "Mitra (मित्र)"]] };
const fc = { i: 0, flip: false, list: [] };
function fcLoad(shuffle) { fc.list = FC[S.fcCat].slice(); if (shuffle) fc.list.sort(() => Math.random() - 0.5); fc.i = 0; fc.flip = false; }
fcLoad();
const QUOTES = ["Small steps every day lead to big results.", "Discipline beats motivation.", "Your future is created by what you do today.", "Don't stop until you're proud.", "Push yourself, because no one else will do it for you.", "Dream big. Study hard. Stay humble.", "Success is the sum of small efforts repeated daily.", "One more chapter, one step closer.", "Consistency is the real superpower.", "Hard work beats talent when talent doesn't work hard."];
let qi = Math.floor(Math.random() * QUOTES.length);
const MOODS = [["😴", "Sleepy — take a break!"], ["😤", "Frustrated — breathe, you've got this!"], ["😐", "Okay — let's get started!"], ["🙂", "Good — keep it going!"], ["😎", "Confident — crush it today!"], ["🔥", "On fire — unstoppable!"], ["🧠", "Focused — deep work time!"]];
const moodMsg = () => { const m = MOODS.find((x) => x[0] === S.mood[today()]); return m ? m[0] + " " + m[1] : "Pick how you feel today"; };
let W = null;

/* UI */
const css = `#cxProf{position:fixed;inset:0;z-index:120;background:var(--bg,#080a0f);overflow-y:auto;display:none;padding:0 0 100px;-webkit-overflow-scrolling:touch}#cxProf.open{display:block}
#cxProf *{box-sizing:border-box}.cx-wrap{width:min(100% - 24px,900px);margin:0 auto}.cx-top{position:sticky;top:0;z-index:2;background:rgba(8,10,15,.9);background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(14px);padding:12px 0;border-bottom:1px solid var(--line)}
.cx-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.cx-tabs{display:flex;gap:6px;flex:1}.cx-tab{flex:1;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--panel);color:var(--muted,#9aa);font-weight:700;cursor:pointer;letter-spacing:.06em}
.cx-tab.on{color:#fff;background:linear-gradient(140deg,var(--brand-bright),var(--brand));box-shadow:0 0 18px rgba(139,124,255,.4);border-color:transparent}
.cx-card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:14px;margin-top:12px;backdrop-filter:blur(10px);box-shadow:0 0 0 1px rgba(139,124,255,.06),0 10px 30px rgba(0,0,0,.25);color:var(--text,#eee);animation:cxin .3s}@keyframes cxin{from{opacity:0;transform:translateY(8px)}}
.cx-card h3{margin:0 0 10px;font-size:14px;color:var(--brand-bright);letter-spacing:.05em;text-transform:uppercase}.cx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0 12px}
.cx-btn{padding:8px 14px;border-radius:10px;border:1px solid var(--line);background:rgba(139,124,255,.16);color:inherit;font-weight:600;cursor:pointer;min-height:36px}.cx-btn:active{transform:scale(.96)}.cx-btn.p{background:linear-gradient(140deg,var(--brand-bright),var(--brand));color:#fff;border-color:transparent}
.cx-in{width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.04);color:inherit;font-size:16px;min-width:0}
.cx-av{width:76px;height:76px;border-radius:50%;border:2px solid var(--brand);object-fit:cover;background:var(--panel-soft);display:grid;place-items:center;font-size:30px;overflow:hidden;flex:none}.cx-big{font-size:38px;font-weight:700;font-family:"Space Grotesk",sans-serif;text-align:center;margin:6px 0}
.cx-bar{height:8px;border-radius:9px;background:rgba(255,255,255,.08);overflow:hidden}.cx-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--brand),var(--mint,#3fd));transition:width .3s}
.cx-li{display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line)}.cx-li span{flex:1;word-break:break-word}.cx-done{text-decoration:line-through;opacity:.55}.cx-ic{background:none;border:0;color:inherit;cursor:pointer;padding:4px 7px;font-size:15px}
.cx-days{display:flex;justify-content:space-between;gap:4px}.cx-d{flex:1;text-align:center;padding:7px 0;border-radius:10px;border:1px solid var(--line);font-size:12px}.cx-d.ok{background:var(--brand);color:#fff}.cx-d.td{outline:2px solid var(--mint,#3fd)}
.cx-fc{min-height:150px;display:grid;place-items:center;text-align:center;padding:18px;border-radius:14px;border:1px solid var(--brand);background:rgba(139,124,255,.1);font-size:20px;font-weight:600;cursor:pointer;user-select:none}.cx-fc.b{background:rgba(63,221,145,.1);border-color:var(--mint,#3fd)}
.cx-calc{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.cx-calc button{padding:12px 0;font-size:17px}.cx-scr{text-align:right;font-size:24px;padding:8px;border-radius:10px;background:rgba(0,0,0,.3);min-height:44px;overflow:hidden;word-break:break-all}
.cx-mood button{font-size:24px;background:none;border:2px solid transparent;border-radius:12px;cursor:pointer;padding:4px 6px}.cx-mood button.on{border-color:var(--brand);background:rgba(139,124,255,.2)}
.cx-st{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}.cx-st div{padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line)}.cx-st b{display:block;font-size:20px}.cx-st small{opacity:.65}
.cx-pop{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.65);display:grid;place-items:center}.cx-pop>div{background:var(--panel-solid,#11151f);border:1px solid var(--brand);border-radius:18px;padding:26px;text-align:center;box-shadow:0 0 30px rgba(139,124,255,.5);color:#fff;max-width:88vw}
#cxToast{position:fixed;left:50%;bottom:84px;transform:translate(-50%,30px);opacity:0;z-index:310;background:var(--panel-solid,#11151f);border:1px solid var(--brand);color:#fff;padding:10px 16px;border-radius:12px;transition:.25s;pointer-events:none}#cxToast.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:430px){.cx-big{font-size:32px}}`;
const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
const root = document.createElement("div"); root.id = "cxProf"; document.body.appendChild(root);

function daysLeft(d) { const a = new Date(d + "T00:00:00"), n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((a - n) / 864e5); }
const niceDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const list = (arr, fn) => arr.map(fn).join("");

function vProfile() {
  const [cur, best] = streaks(), g = S.goals, gd = g.filter((x) => x.done).length, pct = g.length ? Math.round((gd / g.length) * 100) : 0;
  const nx = LV.find((l) => l[0] > S.xp), lo = LV.filter((l) => l[0] <= S.xp).pop()[0], xpp = nx ? Math.round(((S.xp - lo) / (nx[0] - lo)) * 100) : 100;
  const mk = S.notes.filter((n) => n.tab === S.ntab && (!S.nq || n.text.toLowerCase().includes(S.nq.toLowerCase())));
  const dn = ["M", "T", "W", "T", "F", "S", "S"], now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const wk = dn.map((l, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); return `<div class="cx-d ${S.days[k] ? "ok" : ""} ${k === today() ? "td" : ""}">${l}<br>${S.days[k] ? "✓" : "·"}</div>`; }).join("");
  const c = FC[S.fcCat][0] && fc.list[fc.i] || ["No cards", ""];
  return `<div class="cx-grid"><div>
<div class="cx-card"><div class="cx-row"><label style="cursor:pointer"><div class="cx-av">${S.pic ? `<img src="${S.pic}" style="width:100%;height:100%;object-fit:cover" alt="">` : "👤"}</div><input id="cxPic" type="file" accept="image/*" hidden></label><div style="flex:1;min-width:130px"><input class="cx-in" id="cxName" maxlength="30" value="${esc(S.name)}"><div style="opacity:.7;font-size:12px;margin:4px 0">Student · Mood today: ${S.mood[today()] || "–"} · Rank: ${rank()}</div></div></div>
<div class="cx-row" style="margin-top:8px"><button class="cx-btn" id="cxPicBtn">Change photo</button>${S.pic ? '<button class="cx-btn" id="cxPicX">Remove</button>' : ""}<button class="cx-btn p" id="cxShare">Share Profile</button></div>
<p style="margin:10px 0 4px"><b>Study XP: ${S.xp} XP</b> · Level: <b>${level()}</b> · Rank: <b>${rank()}</b></p><div class="cx-bar"><i style="width:${xpp}%"></i></div></div>
<div class="cx-card"><h3>Clock</h3><div class="cx-big" id="cxClock"></div><div style="text-align:center" id="cxDate"></div></div>
<div class="cx-card"><h3>Weekly Streak</h3><div class="cx-days">${wk}</div><p style="margin:8px 0 0">Current: <b>${cur}</b> · Longest: <b>${best}</b></p></div>
<div class="cx-card"><h3>Study Mood</h3><div class="cx-mood cx-row">${MOODS.map((m) => `<button data-mood="${m[0]}" class="${S.mood[today()] === m[0] ? "on" : ""}">${m[0]}</button>`).join("")}</div><p style="margin:10px 0 0;text-align:center;opacity:.9">${esc(moodMsg())}</p></div>
<div class="cx-card"><h3>Weather</h3><div id="cxWx">${W ? `${W.i} ${W.t}°C · ${W.c} · ${esc(W.l)}` : "Loading…"} </div><div class="cx-row" style="margin-top:6px"><select class="cx-in" id="cxState" style="flex:1;min-width:120px">${Object.keys(IN).map((k) => `<option ${k === S.wState ? "selected" : ""}>${k}</option>`).join("")}</select><select class="cx-in" id="cxCity" style="flex:1;min-width:120px">${Object.keys(IN[S.wState]).map((k) => `<option ${k === S.wCity ? "selected" : ""}>${k}</option>`).join("")}</select></div></div>
<div class="cx-card"><h3>Daily Motivation</h3><p id="cxQ" style="font-size:16px">“${esc(QUOTES[qi])}”</p><button class="cx-btn" id="cxNq">New Quote</button></div></div><div>
<div class="cx-card"><h3>Study Alarm</h3><div class="cx-big" id="cxAl">${fmtT(alarm.left)}</div><div class="cx-row"><input class="cx-in" id="cxAlMin" type="number" min="0" max="600" value="${Math.floor(S.alarmSec / 60)}" style="width:80px"><span>min</span><input class="cx-in" id="cxAlSec" type="number" min="0" max="59" value="${S.alarmSec % 60}" style="width:80px"><span>sec</span></div><div class="cx-row" style="margin-top:8px"><button class="cx-btn p" data-al="start">${alarm.run ? "Running" : alarm.left < alarm.total ? "Resume" : "Start"}</button><button class="cx-btn" data-al="pause">Pause</button><button class="cx-btn" data-al="reset">Reset</button></div></div>
<div class="cx-card"><h3>Pomodoro ${pomoBreak ? "· Break" : ""}</h3><div class="cx-big" id="cxPo">${fmtT(pomo.left)}</div><div class="cx-row">${[25, 45, 60].map((m) => `<button class="cx-btn ${pomoMode === m && !pomoBreak ? "p" : ""}" data-pm="${m}">${m}m</button>`).join("")}<span style="opacity:.7">Break 5m · Done: ${S.pomos}</span></div><div class="cx-row" style="margin-top:8px"><button class="cx-btn p" data-po="start">${pomo.run ? "Running" : pomo.left < pomo.total ? "Resume" : "Start"}</button><button class="cx-btn" data-po="pause">Pause</button><button class="cx-btn" data-po="reset">Reset</button></div></div>
<div class="cx-card"><h3>Today Goal</h3><div class="cx-row"><input class="cx-in" id="cxGoal" placeholder="Add a goal" style="flex:1"><button class="cx-btn p" id="cxGoalAdd">Add</button></div>${list(g, (x) => `<div class="cx-li"><input type="checkbox" data-gd="${x.id}" ${x.done ? "checked" : ""}><span class="${x.done ? "cx-done" : ""}">${esc(x.text)}</span><button class="cx-ic" data-ge="${x.id}">✏️</button><button class="cx-ic" data-gx="${x.id}">🗑</button></div>`)}<p style="margin:8px 0 4px">${gd} / ${g.length} completed · ${pct}%</p><div class="cx-bar"><i style="width:${pct}%"></i></div></div>
<div class="cx-card"><h3>Quick Notes</h3><div class="cx-row">${["Study", "Ideas", "To Do"].map((t) => `<button class="cx-btn ${S.ntab === t ? "p" : ""}" data-nt="${t}">${t}</button>`).join("")}</div><input class="cx-in" id="cxNs" placeholder="Search notes" value="${esc(S.nq || "")}" style="margin:8px 0"><div class="cx-row"><input class="cx-in" id="cxNote" placeholder="New note" style="flex:1"><button class="cx-btn p" id="cxNoteAdd">Add</button></div>${list(mk, (n) => `<div class="cx-li">${S.ntab === "To Do" ? `<input type="checkbox" data-nd="${n.id}" ${n.done ? "checked" : ""}>` : ""}<span class="${n.done ? "cx-done" : ""}">${esc(n.text)}</span><button class="cx-ic" data-ne="${n.id}">✏️</button><button class="cx-ic" data-nx="${n.id}">🗑</button></div>`)}</div></div></div>
<div class="cx-card"><h3>Flashcards</h3><div class="cx-row"><select class="cx-in" id="cxFcCat" style="width:auto">${Object.keys(FC).map((k) => `<option ${k === S.fcCat ? "selected" : ""}>${k}</option>`).join("")}</select><span>${fc.i + 1} / ${fc.list.length}</span></div><div class="cx-fc ${fc.flip ? "b" : ""}" id="cxCard" style="margin:10px 0">${esc(fc.flip ? c[1] : c[0])}</div><div class="cx-row"><button class="cx-btn" id="cxPrev">◀ Prev</button><button class="cx-btn" id="cxShuf">🔀 Shuffle</button><button class="cx-btn" id="cxNext">Next ▶</button></div></div>
<div class="cx-card"><h3>Calculator</h3><div class="cx-scr" id="cxScr">0</div><div class="cx-calc" style="margin-top:6px">${["C", "⌫", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "="].map((k) => `<button class="cx-btn ${"÷×−+=".includes(k) ? "p" : ""}" data-k="${k}" ${k === "=" ? 'style="grid-column:span 2"' : ""}>${k}</button>`).join("").replace('data-k="0"', 'data-k="0" style="grid-column:span 1"')}</div></div>`;
}
function vExam() {
  return `<div class="cx-card"><h3>Add exam</h3><div class="cx-row"><input class="cx-in" id="cxEn" placeholder="Exam name" style="flex:1;min-width:140px"><input class="cx-in" id="cxEd" type="date" style="width:auto"><button class="cx-btn p" id="cxEa">Add</button></div></div><div class="cx-grid">` + list(S.exams, (e) => { const d = daysLeft(e.date); return `<div class="cx-card" style="${e.on ? "" : "opacity:.5"}"><div class="cx-row"><b style="flex:1">🎯 ${esc(e.name)}</b><label><input type="checkbox" data-eo="${e.id}" ${e.on ? "checked" : ""}> On</label></div><div class="cx-big">${d < 0 ? "Done" : d + (d === 1 ? " day" : " days")}</div><div style="text-align:center;opacity:.8">${niceDate(e.date)}</div><div class="cx-row" style="margin-top:8px;justify-content:center"><button class="cx-btn" data-ee="${e.id}">Edit</button><button class="cx-btn" data-ex="${e.id}">Delete</button></div></div>`; }) + `</div>`;
}
function vStats() {
  const [cur, best] = streaks(), b = Object.values(S.batches).sort((x, y) => y.n - x.n);
  return `<div class="cx-card"><h3>Stats</h3><div class="cx-st">${[["Joined", niceDate(S.joined)], ["Total Visits", S.visits], ["Study Time", fmtH(S.studySec)], ["Study Sessions", S.sessions], ["Current Streak", cur + " d"], ["Longest Streak", best + " d"], ["Pomodoro", S.pomos], ["Goals Completed", S.goalsDone], ["Notes Created", S.notesMade], ["Study XP", S.xp], ["Level", level()], ["Rank", rank()]].map((x) => `<div><small>${x[0]}</small><b>${esc(x[1])}</b></div>`).join("")}</div></div><div class="cx-card"><h3>Batch Statistics</h3>${b.length ? `<p>Most opened: <b>${esc(b[0].name)}</b></p>` + list(b, (x) => `<div class="cx-li"><span>${esc(x.name)}</span><span style="flex:none;opacity:.8">${x.n} opens · ${new Date(x.last).toLocaleDateString("en-GB")}</span></div>`) : "<p>No batches opened yet.</p>"}</div>`;
}
function render() {
  const sc = root.scrollTop, focus = document.activeElement && document.activeElement.id;
  root.innerHTML = `<div class="cx-top"><div class="cx-wrap cx-row"><button class="cx-btn" id="cxClose">← Back</button><div class="cx-tabs">${["profile", "exam", "stats"].map((t) => `<button class="cx-tab ${S.tab === t ? "on" : ""}" data-tab="${t}">${t.toUpperCase()}</button>`).join("")}</div></div></div><div class="cx-wrap">${S.tab === "exam" ? vExam() : S.tab === "stats" ? vStats() : vProfile()}</div>`;
  root.scrollTop = sc; tickClock(); navUpdate(); if (focus && $("#" + focus, root)) { const f = $("#" + focus, root); f.focus(); if (f.setSelectionRange && f.type === "text") try { f.setSelectionRange(f.value.length, f.value.length); } catch (e) {} }
}
function tickClock() { const c = $("#cxClock"), d = $("#cxDate"), n = new Date(); if (c) { c.textContent = n.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); d.innerHTML = n.toLocaleDateString("en-US", { weekday: "long" }) + "<br>" + n.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } const a = $("#cxAl"), p = $("#cxPo"); if (a) a.textContent = fmtT(alarm.left); if (p) p.textContent = fmtT(pomo.left); }
alarm.tick = pomo.tick = tickClock;
setInterval(() => { if (!document.hidden && root.classList.contains("open")) tickClock(); }, 1000);
let calc = "";
const IN = {"Andhra Pradesh":{Visakhapatnam:[17.69,83.22],Vijayawada:[16.51,80.65]},"Arunachal Pradesh":{Itanagar:[27.08,93.61]},Assam:{Guwahati:[26.14,91.74],Dibrugarh:[27.47,94.91]},Bihar:{Patna:[25.59,85.14],Gaya:[24.8,85.0],Muzaffarpur:[26.12,85.39]},Chhattisgarh:{Raipur:[21.25,81.63],Bilaspur:[22.08,82.15]},Delhi:{"New Delhi":[28.61,77.21]},Goa:{Panaji:[15.49,73.83]},Gujarat:{Ahmedabad:[23.02,72.57],Surat:[21.17,72.83]},Haryana:{Gurugram:[28.46,77.03],Faridabad:[28.41,77.31]},"Himachal Pradesh":{Shimla:[31.1,77.17]},Jharkhand:{Ranchi:[23.34,85.31],Jamshedpur:[22.8,86.2]},Karnataka:{Bengaluru:[12.97,77.59],Mysuru:[12.3,76.64]},Kerala:{Kochi:[9.93,76.27],Thiruvananthapuram:[8.52,76.94]},"Madhya Pradesh":{Bhopal:[23.26,77.41],Indore:[22.72,75.86]},Maharashtra:{Mumbai:[19.08,72.88],Pune:[18.52,73.86],Nagpur:[21.15,79.09]},Manipur:{Imphal:[24.82,93.94]},Meghalaya:{Shillong:[25.57,91.88]},Odisha:{Bhubaneswar:[20.3,85.82],Cuttack:[20.46,85.88]},Punjab:{Ludhiana:[30.9,75.86],Amritsar:[31.63,74.87]},Rajasthan:{Jaipur:[26.91,75.79],Kota:[25.18,75.83],Jodhpur:[26.24,73.02]},Sikkim:{Gangtok:[27.33,88.61]},"Tamil Nadu":{Chennai:[13.08,80.27],Coimbatore:[11.02,76.96]},Telangana:{Hyderabad:[17.39,78.49],Warangal:[17.97,79.6]},Tripura:{Agartala:[23.83,91.28]},"Uttar Pradesh":{Lucknow:[26.85,80.95],Kanpur:[26.45,80.35],Varanasi:[25.32,82.99],Prayagraj:[25.44,81.85]},Uttarakhand:{Dehradun:[30.32,78.03]},"West Bengal":{Kolkata:[22.57,88.36],Siliguri:[26.72,88.43]},"Jammu & Kashmir":{Srinagar:[34.08,74.8],Jammu:[32.73,74.86]},Chandigarh:{Chandigarh:[30.73,76.78]}};
S.wState = IN[S.wState] ? S.wState : "Delhi"; S.wCity = IN[S.wState][S.wCity] ? S.wCity : Object.keys(IN[S.wState])[0];
const WC = { 0: ["☀️", "Clear"], 1: ["🌤", "Mostly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Cloudy"], 45: ["🌫", "Fog"], 61: ["🌧", "Rain"], 63: ["🌧", "Rain"], 65: ["🌧", "Heavy rain"], 80: ["🌦", "Showers"], 95: ["⛈", "Thunderstorm"] };
function weather(lat, lon, name) { fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`).then((r) => r.json()).then((j) => { const w = WC[j.current.weather_code] || ["🌡", "Weather"]; W = { i: w[0], c: w[1], t: Math.round(j.current.temperature_2m), l: name }; const e = $("#cxWx"); if (e) e.textContent = `${W.i} ${W.t}°C · ${W.c} · ${W.l}`; }).catch(() => { const e = $("#cxWx"); if (e) e.textContent = "Weather unavailable offline"; }); }
function loadWx() { if (W) return; const c = IN[S.wState][S.wCity]; weather(c[0], c[1], S.wCity + ", " + S.wState); }
const dl = (id) => S.goals.find((x) => x.id === id);

root.addEventListener("click", (ev) => {
  const t = ev.target.closest("button,input[type=checkbox],#cxCard"); if (!t) return; const D = t.dataset;
  if (t.id === "cxClose") return close();
  if (D.tab) { S.tab = D.tab; save(); return render(); }
  if (t.id === "cxPicBtn") return $("#cxPic").click();
  if (t.id === "cxPicX") { S.pic = ""; save(); return render(); }
  if (t.id === "cxShare") { const txt = `${S.name} (Student)\nStudy XP: ${S.xp}\nLevel: ${level()}\nRank: ${rank()}\nCurrent Streak: ${streaks()[0]} days\n— CodeXStudys`; if (navigator.share) navigator.share({ title: "My CodeXStudys Profile", text: txt }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast("Profile summary copied")); else toast("Sharing not supported"); return; }
  if (D.mood) { S.mood[today()] = D.mood; save(); return render(); }
  if (t.id === "cxNq") { let n; do n = Math.floor(Math.random() * QUOTES.length); while (n === qi); qi = n; return ($("#cxQ").textContent = "“" + QUOTES[qi] + "”"); }
  if (D.al) { if (D.al === "start") { const m = Math.min(36000, Math.max(1, (+$("#cxAlMin").value || 0) * 60 + Math.min(59, +$("#cxAlSec").value || 0))); if (!alarm.run && alarm.left >= alarm.total) { S.alarmSec = m; save(); alarm.set(m); } alarm.start(); } if (D.al === "pause") alarm.pause(); if (D.al === "reset") alarm.set(S.alarmSec); return render(); }
  if (D.pm) { pomoMode = +D.pm; pomoBreak = false; pomo.set(pomoMode * 60); return render(); }
  if (D.po) { if (D.po === "start") pomo.start(); if (D.po === "pause") pomo.pause(); if (D.po === "reset") { pomoBreak = false; pomo.set(pomoMode * 60); } return render(); }
  if (t.id === "cxGoalAdd") { const i = $("#cxGoal"), v = i.value.trim(); if (v) { S.goals.push({ id: Date.now() + "", text: v, done: false }); save(); render(); } return; }
  if (D.gd) { const g = dl(D.gd); g.done = t.checked; if (g.done) { S.goalsDone++; reward(10, 0); S.days[today()] = S.days[today()] || 1; save(); } render(); return; }
  if (D.ge) { const g = dl(D.ge), v = prompt("Edit goal", g.text); if (v && v.trim()) { g.text = v.trim(); save(); render(); } return; }
  if (D.gx) { S.goals = S.goals.filter((x) => x.id !== D.gx); save(); return render(); }
  if (D.nt) { S.ntab = D.nt; save(); return render(); }
  if (t.id === "cxNoteAdd") { const v = $("#cxNote").value.trim(); if (v) { S.notes.unshift({ id: Date.now() + "", tab: S.ntab, text: v, done: false }); S.notesMade++; save(); render(); } return; }
  if (D.nd) { const n = S.notes.find((x) => x.id === D.nd); n.done = t.checked; save(); return render(); }
  if (D.ne) { const n = S.notes.find((x) => x.id === D.ne), v = prompt("Edit note", n.text); if (v && v.trim()) { n.text = v.trim(); save(); render(); } return; }
  if (D.nx) { S.notes = S.notes.filter((x) => x.id !== D.nx); save(); return render(); }
  if (t.id === "cxCard") { fc.flip = !fc.flip; return render(); }
  if (t.id === "cxPrev") { fc.i = (fc.i - 1 + fc.list.length) % fc.list.length; fc.flip = false; return render(); }
  if (t.id === "cxNext") { fc.i = (fc.i + 1) % fc.list.length; fc.flip = false; return render(); }
  if (t.id === "cxShuf") { fcLoad(true); return render(); }
  if (D.k) { const k = D.k; if (k === "C") calc = ""; else if (k === "⌫") calc = calc.slice(0, -1); else if (k === "=") { try { const e = calc.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/(\d+\.?\d*)%/g, "($1/100)"); if (/^[\d+\-*/().\s]+$/.test(e)) calc = String(+(Function('"use strict";return(' + e + ")")()).toFixed(10)); } catch (e) { calc = "Error"; } if (calc === "Infinity" || calc === "NaN") calc = "Error"; } else { if (calc === "Error") calc = ""; calc += k; } return ($("#cxScr").textContent = calc || "0"); }
  if (t.id === "cxEa") { const n = $("#cxEn").value.trim(), d = $("#cxEd").value; if (n && d) { S.exams.push({ id: "e" + Date.now(), name: n, date: d, on: true }); save(); render(); } else toast("Enter name and date"); return; }
  if (D.eo) { S.exams.find((x) => x.id === D.eo).on = t.checked; save(); return render(); }
  if (D.ee) { const e = S.exams.find((x) => x.id === D.ee), n = prompt("Exam name", e.name); if (n && n.trim()) { const d = prompt("Exam date (YYYY-MM-DD)", e.date); if (d && !isNaN(new Date(d))) { e.name = n.trim(); e.date = d; save(); render(); } else toast("Invalid date"); } return; }
  if (D.ex) { S.exams = S.exams.filter((x) => x.id !== D.ex); save(); return render(); }
});
root.addEventListener("change", (ev) => {
  const t = ev.target;
  if (t.id === "cxName") { S.name = t.value.trim() || "Student Name"; save(); }
  if (t.id === "cxPic" && t.files[0]) { const img = new Image(), u = URL.createObjectURL(t.files[0]); img.onload = () => { const c = document.createElement("canvas"); c.width = c.height = 256; const x = c.getContext("2d"), m = Math.min(img.width, img.height); x.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, 256, 256); S.pic = c.toDataURL("image/jpeg", 0.8); URL.revokeObjectURL(u); save(); render(); }; img.src = u; }
  if (t.id === "cxFcCat") { S.fcCat = t.value; save(); fcLoad(); render(); }
  if (t.id === "cxState") { S.wState = t.value; S.wCity = Object.keys(IN[S.wState])[0]; save(); W = null; render(); loadWx(); }
  if (t.id === "cxCity") { S.wCity = t.value; save(); W = null; loadWx(); }
});
root.addEventListener("input", (ev) => { if (ev.target.id === "cxNs") { S.nq = ev.target.value; render(); } });
root.addEventListener("keydown", (ev) => { if (ev.key === "Enter") { const m = { cxGoal: "cxGoalAdd", cxNote: "cxNoteAdd" }[ev.target.id]; if (m) $("#" + m).click(); } });

function open() { root.classList.add("open"); navUpdate(); document.body.style.overflow = "hidden"; render(); loadWx(); history.replaceState(null, "", "#profile"); }
function close() { root.classList.remove("open"); navUpdate(); document.body.style.overflow = ""; if (location.hash === "#profile") history.replaceState(null, "", "#home"); }
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("open")) close(); });
document.addEventListener("visibilitychange", () => { if (!document.hidden) { alarm.run && alarm.upd(); pomo.run && pomo.upd(); } });

/* Bottom navbar: Home | Profile */
const nst = document.createElement("style");
nst.textContent = `#cxBnav{position:fixed;left:0;right:0;bottom:0;z-index:125;display:flex;height:calc(62px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:rgba(8,10,15,.92);background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(16px);border-top:1px solid var(--line)}#cxBnav button{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:0;color:var(--muted,#8a94a6);font:700 11px "Space Grotesk",sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}#cxBnav button.on{color:var(--brand-bright)}#cxBnav button.on::before{content:"";position:absolute;top:-1px;left:25%;right:25%;height:3px;border-radius:3px;background:linear-gradient(90deg,var(--brand),var(--mint,#3fd));box-shadow:0 0 12px var(--brand)}#cxBnav svg{width:26px;height:26px}.cx-nav-av{width:28px;height:28px;border-radius:50%;border:2px solid currentColor;object-fit:cover;display:block}`;
document.head.appendChild(nst);
const bnav = document.createElement("nav"); bnav.id = "cxBnav"; bnav.setAttribute("aria-label", "Bottom navigation"); document.body.appendChild(bnav);
function navUpdate() { const on = root.classList.contains("open"); bnav.innerHTML = `<button type="button" data-n="home" class="${on ? "" : "on"}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2.5 11.5h2.7V20h5v-5.5h3.6V20h5v-8.5h2.7z"/></svg>Home</button><button type="button" data-n="profile" class="${on ? "on" : ""}">${S.pic ? `<img class="cx-nav-av" src="${S.pic}" alt="">` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>'}Profile</button>`; }
bnav.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.n === "profile") open(); else { close(); window.scrollTo({ top: 0, behavior: "smooth" }); } });
navUpdate();

/* Visits: once per browser session */
try { if (!sessionStorage.getItem("cx-visit")) { sessionStorage.setItem("cx-visit", "1"); S.visits++; save(); } } catch (e) {}
if (location.hash === "#profile") open();
window.CXProfile = { open, trackBatch(b) { const id = b && (b._id || b.batch_id || b.id); if (!id) return; const r = S.batches[id] || { name: b.name || "Batch", n: 0 }; r.n++; r.name = b.name || r.name; r.last = Date.now(); S.batches[id] = r; save(); } };
})();
