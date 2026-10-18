import { auth, db, A, F } from "./firebase.js";

const root = document.querySelector("#app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STEPS = [0, 50, 120, 220, 350, 520, 750];
const DEF_RANKS = ["Friend", "Trusted Friend", "Close Friend", "Loyal Friend", "Bestie", "Best Friend", "Soul Sister"];
const DEF_QUESTS = [
  { t: "Kept a secret", s: 10 }, { t: "Apologized first", s: 15 }, { t: "Listened for an hour", s: 15 },
  { t: "Sent a thoughtful surprise", s: 20 }, { t: "Showed up when it mattered", s: 25 }, { t: "Defended me when I wasn't there", s: 30 }
];
let user = null, unsubs = [], params = new URLSearchParams(location.search), mode = "login";

const $ = s => root.querySelector(s);
const toast = m => { const t = document.querySelector("#toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3200); };
const clean = () => { unsubs.forEach(u => u()); unsubs = []; };
const rankIdx = stars => STEPS.reduce((r, s, i) => stars >= s ? i : r, 0);
const go = q => { history.pushState(null, "", q || location.pathname); params = new URLSearchParams(location.search); route(); };
window.onpopstate = () => { params = new URLSearchParams(location.search); route(); };

A.onAuthStateChanged(auth, u => { user = u; route(); });

function route() {
  clean(); document.body.dataset.theme = "rose";
  if (!user) return authView();
  if (params.get("join")) return joinView();
  if (params.get("room")) return roomView(params.get("room"));
  homeView();
}

/* ---------- AUTH ---------- */
function authView() {
  const signup = mode === "signup";
  root.innerHTML = `<h1>👑 Friendship Loyalty Game</h1>
  <p class="center muted">Earn XP, level up the ranks, reach Soul Sister. 💗</p>
  <form class="card" id="f">
    <h2>${signup ? "Create account" : "Welcome back"}</h2>
    ${signup ? `<label>Your name<input id="n" required maxlength="30"></label>` : ""}
    <label>Email<input id="e" type="email" required></label>
    <label>Password<input id="p" type="password" minlength="6" required></label>
    <p class="err" id="err"></p>
    <div class="row"><button>${signup ? "Sign up" : "Log in"}</button>
    <button type="button" class="alt" id="sw">${signup ? "I have an account" : "Create account"}</button>
    ${signup ? "" : `<button type="button" class="link" id="rs">Forgot password?</button>`}</div>
  </form>`;
  $("#sw").onclick = () => { mode = signup ? "login" : "signup"; authView(); };
  if ($("#rs")) $("#rs").onclick = async () => {
    const e = $("#e").value; if (!e) return ($("#err").textContent = "Enter your email first.");
    try { await A.sendPasswordResetEmail(auth, e); toast("Password reset email sent 💌"); } catch (x) { $("#err").textContent = x.message; }
  };
  $("#f").onsubmit = async ev => {
    ev.preventDefault();
    try {
      if (signup) { const c = await A.createUserWithEmailAndPassword(auth, $("#e").value, $("#p").value); await A.updateProfile(c.user, { displayName: $("#n").value.trim() }); route(); }
      else await A.signInWithEmailAndPassword(auth, $("#e").value, $("#p").value);
    } catch (x) { $("#err").textContent = x.message.replace("Firebase: ", ""); }
  };
}

const topbar = () => `<div class="row between"><b>👑 ${esc(user.displayName || user.email)}</b>
  <span class="row"><button class="alt" id="home">Home</button><button class="alt" id="out">Log out</button></span></div>`;
const bindTop = () => { $("#home").onclick = () => go(); $("#out").onclick = () => A.signOut(auth); };

/* ---------- HOME ---------- */
function homeView() {
  root.innerHTML = `${topbar()}<h1>Your Friendships</h1>
  <div class="card"><h3>My rooms</h3><div id="rooms" class="muted">Loading…</div></div>
  <form class="card" id="c"><h3>Create a friendship room</h3>
    <label>Friendship title<input id="t" required maxlength="40" placeholder="The Bestie Club"></label>
    <label>Theme<select id="th"><option value="rose">Royal Rose</option><option value="lavender">Lavender</option><option value="ocean">Ocean Blue</option><option value="sage">Sage Green</option></select></label>
    <label>7 rank names, comma-separated (lowest to highest)<textarea id="r" rows="2">${DEF_RANKS.join(", ")}</textarea></label>
    <p class="err" id="err"></p><button>Create room</button></form>`;
  bindTop();
  unsubs.push(F.onSnapshot(F.collection(db, "users", user.uid, "rooms"), snap => {
    $("#rooms").innerHTML = snap.empty ? "No rooms yet — create your first below." :
      snap.docs.map(d => `<div class="row between" style="margin:6px 0"><span>${esc(d.data().title)}</span><button data-id="${d.id}">Open</button></div>`).join("");
    root.querySelectorAll("[data-id]").forEach(b => b.onclick = () => go("?room=" + b.dataset.id));
  }));
  $("#c").onsubmit = async ev => {
    ev.preventDefault();
    const ranks = $("#r").value.split(",").map(s => s.trim()).filter(Boolean);
    if (ranks.length !== 7) return ($("#err").textContent = "Please give exactly 7 rank names.");
    const title = $("#t").value.trim(), theme = $("#th").value;
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16), token = crypto.randomUUID().replace(/-/g, "");
    const b = F.writeBatch(db);
    b.set(F.doc(db, "rooms", id), { title, theme, ranks, stars: 0, quests: DEF_QUESTS, createdBy: user.uid, inviteToken: token, created: F.serverTimestamp() });
    b.set(F.doc(db, "rooms", id, "members", user.uid), { name: user.displayName || "Friend" });
    b.set(F.doc(db, "rooms", id, "invites", token), { active: true, title });
    b.set(F.doc(db, "users", user.uid, "rooms", id), { title, theme });
    try { await b.commit(); go("?room=" + id); } catch (x) { $("#err").textContent = x.message; }
  };
}

/* ---------- ROOM ---------- */
function roomView(id) {
  root.innerHTML = `${topbar()}<p class="muted center">Loading room…</p>`; bindTop();
  let prev = null;
  unsubs.push(F.onSnapshot(F.doc(db, "rooms", id), snap => {
    if (!snap.exists()) { root.innerHTML = `${topbar()}<p class="card err">Room not found or you're not a member.</p>`; return bindTop(); }
    const r = snap.data(), i = rankIdx(r.stars), next = STEPS[i + 1];
    document.body.dataset.theme = r.theme;
    if (prev !== null && i > prev) toast(`🎮 LEVEL UP! ${r.ranks[i]}`);
    prev = i;
    const pct = next ? Math.round((r.stars - STEPS[i]) / (next - STEPS[i]) * 100) : 100;
    const link = `${location.origin}${location.pathname}?join=${id}&t=${r.inviteToken}`;
    root.innerHTML = `${topbar()}<h1>${esc(r.title)}</h1>
    <div class="card center"><div class="rank">${esc(r.ranks[i])}</div><div class="stars">⭐ ${r.stars} XP</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <small class="muted">${next ? `${next - r.stars} XP to ${esc(r.ranks[i + 1])}` : "Highest rank reached 👑"}</small></div>
    <div class="card"><h3>Missions</h3><div class="quests">${r.quests.map((q, n) => `<button class="quest" data-q="${n}">${esc(q.t)} <b>+${q.s}</b></button>`).join("")}</div>
      <form class="row" id="cq" style="margin-top:12px"><input id="qt" placeholder="Custom mission" required maxlength="50" style="flex:3"><input id="qs" type="number" min="1" max="100" value="10" style="flex:1"><button class="gold">Add</button></form></div>
    <div class="card"><h3>Rank ladder</h3><ol class="ladder">${r.ranks.map((n, k) => `<li class="${k === i ? "on" : ""}"><span>${k + 1}. ${esc(n)}</span><span>${STEPS[k]} ⭐</span></li>`).join("")}</ol></div>
    <div class="card"><h3>Invite a friend</h3><input readonly id="lk" value="${esc(link)}">
      <div class="row"><button id="cp">Copy link</button><button class="alt" id="rv">Revoke invite</button></div>
      <p class="muted" id="mem"></p></div>
    <div class="card"><h3>Battle log</h3><ol class="log" id="log"><li class="muted">Loading…</li></ol></div>`;
    bindTop();
    root.querySelectorAll("[data-q]").forEach(b => b.onclick = () => award(id, r.quests[b.dataset.q]));
    $("#cq").onsubmit = async e => { e.preventDefault(); await F.updateDoc(F.doc(db, "rooms", id), { quests: F.arrayUnion({ t: $("#qt").value.trim(), s: Math.min(100, Math.max(1, +$("#qs").value || 10)) }) }); };
    $("#cp").onclick = () => { navigator.clipboard.writeText(link); toast("Invite link copied 💌"); };
    $("#rv").onclick = async () => { await F.updateDoc(F.doc(db, "rooms", id, "invites", r.inviteToken), { active: false }); toast("Invite revoked"); };
  }, () => { root.innerHTML = `${topbar()}<p class="card err">You don't have access to this room.</p>`; bindTop(); }));
  unsubs.push(F.onSnapshot(F.collection(db, "rooms", id, "members"), s => { const m = $("#mem"); if (m) m.textContent = "Members: " + s.docs.map(d => d.data().name).join(", "); }));
  unsubs.push(F.onSnapshot(F.query(F.collection(db, "rooms", id, "log"), F.orderBy("at", "desc"), F.limit(30)), s => {
    const l = $("#log"); if (l) l.innerHTML = s.empty ? `<li class="muted">No battles yet.</li>` :
      s.docs.map(d => { const x = d.data(); return `<li>⭐ +${x.stars} XP — ${esc(x.text)} <small class="muted">· ${esc(x.by)}</small></li>`; }).join("");
  }));
}

async function award(id, q) {
  const b = F.writeBatch(db);
  b.update(F.doc(db, "rooms", id), { stars: F.increment(q.s) });
  b.set(F.doc(F.collection(db, "rooms", id, "log")), { text: q.t, stars: q.s, by: user.displayName || "Friend", uid: user.uid, at: F.serverTimestamp() });
  try { await b.commit(); } catch (x) { toast("Could not save: " + x.message); }
}

/* ---------- JOIN ---------- */
async function joinView() {
  const id = params.get("join"), token = params.get("t");
  root.innerHTML = `${topbar()}<p class="muted center">Checking invitation…</p>`; bindTop();
  try {
    const mine = await F.getDoc(F.doc(db, "rooms", id, "members", user.uid));
    if (mine.exists()) return go("?room=" + id);
    const inv = await F.getDoc(F.doc(db, "rooms", id, "invites", token));
    if (!inv.exists() || !inv.data().active) throw new Error("bad");
    const title = inv.data().title;
    root.innerHTML = `${topbar()}<div class="card center"><h2>You're invited! 💌</h2><p>Join <b>${esc(title)}</b> and start earning XP together.</p><button id="j">Join the party</button><p class="err" id="err"></p></div>`; bindTop();
    $("#j").onclick = async () => {
      const b = F.writeBatch(db);
      b.set(F.doc(db, "rooms", id, "members", user.uid), { name: user.displayName || "Friend", token });
      b.set(F.doc(db, "users", user.uid, "rooms", id), { title });
      try { await b.commit(); go("?room=" + id); } catch (x) { $("#err").textContent = x.message; }
    };
  } catch { root.innerHTML = `${topbar()}<p class="card err">This invitation is invalid or has been revoked.</p>`; bindTop(); }
}
