import { auth, db, A, F } from "./firebase.js";

const root = document.querySelector("#app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STEPS = [0, 50, 120, 220, 350, 520, 750];
const DEF_RANKS = ["Friend", "Trusted Friend", "Close Friend", "Loyal Friend", "Bestie", "Best Friend", "Soul Sister"];
const AVATARS = ["👑", "🦄", "🐱", "🦊", "🐼", "🐸", "🦋", "🌸", "🔥", "⚡", "🎮", "🐉"];
const R0 = DEF_RANKS;
const GEN = [["Share a memory", "text", 20, "Write about your favourite memory together and attach a photo that reminds you of it."], ["Memory Match challenge", "puzzle", 15, "Clear the Memory Match board as fast as you can."], ["Sweet Candy Match", "candy", 25, "Reach the target score in Candy Match to prove your sweet skills."]];
const THEME_DEFS = [
  { k: "rose", n: "Neon Pink", e: "💗", tag: "The classic royal pink-and-gold world.", ranks: R0, fx: ["💗", "✨", "🌸"], sug: GEN },
  { k: "lavender", n: "Lavender Dream", e: "🦋", tag: "Soft purple skies and butterflies.", ranks: R0, fx: ["🦋", "💜", "✨"], sug: GEN },
  { k: "ocean", n: "Ocean Blue", e: "🌊", tag: "Calm waves and shiny shells.", ranks: R0, fx: ["🌊", "🐚", "💧"], sug: GEN },
  { k: "sage", n: "Forest Green", e: "🌿", tag: "Quiet woods and fresh leaves.", ranks: R0, fx: ["🌿", "🍃", "🍀"], sug: GEN },
  { k: "coquette", n: "Coquette Dreamworld", e: "🎀", tag: "Floating hearts, ribbons and crystal castles.", fx: ["🎀", "🌸", "💗", "✨"],
    ranks: ["Petal Pal", "Ribbon Friend", "Sparkle Sis", "Heart Keeper", "Dream Bestie", "Angel Bestie", "Soul Sister"],
    sug: [["The Promise Garden", "text", 30, "Write a promise you want to keep to your bestie. Attach a photo of something pink or floral that matches the promise."], ["Ribbon of Kindness", "text", 20, "Do one kind thing for someone today and describe how it went. Attach a photo of a ribbon, flower or sticker."], ["Sparkle Match", "candy", 25, "Reach the target score in Candy Match to collect the sparkles."]] },
  { k: "academia", n: "Dark Academia", e: "📚", tag: "A secret society of letters, clues and candlelight.", fx: ["📚", "🕯️", "🪶", "🔑"],
    ranks: ["Newcomer", "Apprentice", "Scholar", "Keeper of Letters", "Secret Society Member", "Grand Archivist", "Soul Sister"],
    sug: [["The Secret Letter", "text", 30, "Write a short secret letter to your bestie about what their friendship means to you. Attach a photo of your handwriting."], ["Library Clues", "puzzle", 20, "Solve the Memory Match board to uncover the hidden clues."], ["The Evidence Board", "text", 25, "List three clues that prove you really know your bestie, and attach a photo of your notes."]] },
  { k: "arcade", n: "Neon Arcade", e: "🕹️", tag: "Glowing arenas, combos and friendly battles.", fx: ["🕹️", "⚡", "👾", "🎮"],
    ranks: ["Rookie", "Player One", "Combo Kid", "Arcade Ace", "Pixel Champion", "Neon Legend", "Soul Sister"],
    sug: [["Bestie Battle Royale", "candy", 35, "Beat the target score in Candy Match to win the friendly battle."], ["Speed Run", "puzzle", 20, "Finish the Memory Match board in as few moves as possible."], ["Victory Pose", "text", 20, "Strike your best victory pose, attach the photo, and describe your favourite game moment together."]] },
  { k: "cosmic", n: "Cosmic Soulmates", e: "🌙", tag: "A shared galaxy of constellations and star pets.", fx: ["🌙", "⭐", "🪐", "☄️"],
    ranks: ["Stardust", "Moon Walker", "Comet Rider", "Constellation Keeper", "Star Mage", "Galaxy Guardian", "Cosmic Soulmate"],
    sug: [["Reconnect the Constellation", "text", 30, "Name three stars that stand for your friendship and explain each one. Attach a photo of the night sky or a drawing."], ["Moon Wish", "text", 20, "Write a wish for your bestie under the moon and attach a photo of the sky."], ["Meteor Match", "puzzle", 20, "Clear the Memory Match board to catch every meteor."]] },
  { k: "cottage", n: "Cozy Cottage", e: "🏡", tag: "Decorate a shared home, garden and café.", fx: ["🏡", "🌼", "☕", "🧸"],
    ranks: ["Visitor", "Tea Guest", "Garden Helper", "Cottage Friend", "Café Partner", "Hearth Keeper", "Soul Sister"],
    sug: [["Build Our Dream Café", "text", 30, "Describe your dream café, its menu and its decorations. Attach a photo or a sketch."], ["Garden Gift", "text", 20, "Give your bestie a small gift of kindness, like a note or a plant. Describe it and attach a photo."], ["Cozy Match", "candy", 20, "Reach the target score in Candy Match."]] },
  { k: "kingdom", n: "Royal Kingdom", e: "👑", tag: "Your room is a kingdom that grows with every quest.", fx: ["👑", "⚜️", "🏰", "✨"],
    ranks: ["Villager", "Squire", "Knight", "Noble", "Royal Advisor", "Crown Guardian", "Soul Sister"],
    sug: [["The Crown of Trust", "text", 35, "Describe a moment when you proved your trust in your bestie and what it taught you. Attach a photo."], ["Royal Decree", "text", 20, "Write a friendly royal decree with three rules for your friendship. Attach a photo of it."], ["Knight's Memory Trial", "puzzle", 25, "Complete the Memory Match trial."]] },
  { k: "phantom", n: "Phantom Academy", e: "👻", tag: "Playful spooky mysteries and ghost companions.", fx: ["👻", "🕯️", "🌫️", "🔮"],
    ranks: ["Lost Spirit", "Ghost Hunter Trainee", "Clue Collector", "Spirit Guide", "Phantom Pal", "Haunt Master", "Soul Sister"],
    sug: [["Escape the Haunted Chatroom", "puzzle", 30, "Match all the pairs to find the way out."], ["Ghost Story", "text", 25, "Write a short, silly ghost story starring you and your bestie. Attach a photo of your lantern or spooky corner."], ["Spirit Match", "candy", 20, "Reach the target score to collect the spirits."]] },
  { k: "chaos", n: "Chaos Besties", e: "🤪", tag: "Meme dimension: silly challenges and wild reactions.", fx: ["🤪", "💥", "😂", "🌀"],
    ranks: ["Normal Person", "Slightly Weird", "Chaos Rookie", "Meme Lord", "Gremlin Bestie", "Chaos Queen", "Soul Sister"],
    sug: [["Survive Each Other's Chaos", "text", 30, "Describe the funniest chaos you survived together this week and attach a photo or screenshot."], ["Meme Reaction Mission", "text", 20, "Recreate your bestie's favourite reaction face, attach the photo, and say why it fits them."], ["Chaos Candy", "candy", 25, "Reach the target score before the chaos wins."]] }
];
const themeOf = k => THEME_DEFS.find(x => x.k === k) || THEME_DEFS[0];
const sugDoc = s => ({ title: s[0], type: s[1], xp: s[2], desc: s[3], wrongPenalty: 5, failPenalty: 10, saved: F.serverTimestamp() });
let fxTheme = "";
function applyTheme(k) {
  document.body.dataset.theme = k;
  if (fxTheme === k) return; fxTheme = k;
  const em = themeOf(k).fx;
  document.getElementById("fx").innerHTML = Array.from({ length: 14 }, (_, i) =>
    `<span style="left:${Math.round(Math.random() * 96)}%;animation-delay:${(Math.random() * 12).toFixed(1)}s;animation-duration:${12 + Math.round(Math.random() * 10)}s;font-size:${14 + Math.round(Math.random() * 16)}px">${em[i % em.length]}</span>`).join("");
}
let user = null, prof = { avatar: "👑" }, unsubs = [], params = new URLSearchParams(location.search), mode = "login";

const $ = s => root.querySelector(s);
document.addEventListener("click", e => { const i = e.target.closest("img.ph"); if (i) i.classList.toggle("zoom"); });
const shrink = file => new Promise((ok, no) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = () => {
    let m = 900, q = 0.72, out; const c = document.createElement("canvas"), x = c.getContext("2d");
    do { const k = Math.min(1, m / Math.max(img.width, img.height)); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      x.drawImage(img, 0, 0, c.width, c.height); out = c.toDataURL("image/jpeg", q); m *= 0.8; q = Math.max(0.4, q - 0.08); } while (out.length > 700000 && m > 200);
    URL.revokeObjectURL(u); out.length > 850000 ? no(new Error("Photo is too large, try another one")) : ok(out);
  };
  img.onerror = () => no(new Error("That file is not a valid image")); img.src = u;
});
const toast = m => { const t = document.querySelector("#toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3200); };
const clean = () => { unsubs.forEach(u => u()); unsubs = []; };
const rankIdx = xp => STEPS.reduce((r, s, i) => xp >= s ? i : r, 0);
const myName = () => user.displayName || user.email;
const go = q => { history.pushState(null, "", q || location.pathname); params = new URLSearchParams(location.search); route(); };
window.onpopstate = () => { params = new URLSearchParams(location.search); route(); };

A.onAuthStateChanged(auth, async u => {
  user = u; prof = { avatar: "👑" };
  if (u) { try { const s = await F.getDoc(F.doc(db, "users", u.uid)); if (s.exists()) prof = s.data(); } catch {} }
  route();
});

function route() {
  clean(); applyTheme("rose");
  if (!user) return authView();
  if (params.get("join")) return joinView();
  if (params.get("room")) return roomView(params.get("room"));
  if (params.get("profile")) return profileView();
  homeView();
}

/* ---------- MASCOT & POPUPS ---------- */
const mascot = (mood = "happy") => {
  const ink = "#3b2147";
  const eyes = mood === "cheer"
    ? `<path d="M32 58q10-14 20 0M68 58q10-14 20 0" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="42" cy="58" rx="8" ry="11" fill="${ink}"/><ellipse cx="78" cy="58" rx="8" ry="11" fill="${ink}"/><circle cx="45" cy="54" r="3.5" fill="#fff"/><circle cx="81" cy="54" r="3.5" fill="#fff"/><circle cx="39" cy="62" r="1.8" fill="#fff"/><circle cx="75" cy="62" r="1.8" fill="#fff"/>`;
  const mouth = mood === "sad" ? `<path d="M52 86q8-8 16 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood === "cheer" ? `<path d="M49 78q11 18 22 0z" fill="#e8465f"/>` : `<path d="M52 80q8 8 16 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const extra = mood === "sad" ? `<path d="M33 70q-5 9 0 13q5-4 0-13" fill="#7fd0ff"/>` : mood === "cheer" ? `<text x="2" y="24" font-size="20">✨</text><text x="94" y="30" font-size="18">⭐</text>` : "";
  return `<svg viewBox="0 0 120 120" class="mascot" aria-hidden="true"><ellipse cx="14" cy="78" rx="12" ry="30" fill="#ff7bb8"/><ellipse cx="106" cy="78" rx="12" ry="30" fill="#ff7bb8"/>
  <circle cx="60" cy="64" r="42" fill="#ffe3d3"/><path d="M18 58q0-46 42-46t42 46q-14-22-42-20-28-2-42 20z" fill="#ff7bb8"/>${eyes}
  <circle cx="30" cy="75" r="6" fill="#ffadc8" opacity=".75"/><circle cx="90" cy="75" r="6" fill="#ffadc8" opacity=".75"/>${mouth}
  <path d="M44 16l8 10 8-14 8 14 8-10-4 14H48z" fill="#ffd23f"/>${extra}</svg>`;
};
const popq = [];
function popup(o) { popq.push(o); if (!document.querySelector(".pop")) nextPop(); }
function nextPop() {
  const o = popq.shift(); if (!o) return;
  const d = document.createElement("div"); d.className = "pop";
  d.innerHTML = `<div class="popbox ${o.mood || "happy"}">${mascot(o.mood)}<div class="poptag">${esc(o.tag)}</div><h2>${esc(o.title)}</h2><p>${esc(o.text)}</p>${o.desc ? `<div class="desc popdesc">${esc(o.desc)}</div>` : ""}<button>${esc(o.btn || "Let's go!")}</button></div>`;
  d.querySelector("button").onclick = () => { d.remove(); if (o.onOk) o.onOk(); nextPop(); };
  document.body.appendChild(d);
}

/* ---------- AUTH ---------- */
function authView() {
  const signup = mode === "signup";
  root.innerHTML = `<h1>👑 Friendship Loyalty Game</h1>
  <p class="center muted">Complete missions. Prove your loyalty. Level up. 💗</p>
  <form class="card" id="f"><h2>${signup ? "Create account" : "Welcome back"}</h2>
    ${signup ? `<label>Your name<input id="n" required maxlength="30"></label>` : ""}
    <label>Email<input id="e" type="email" required></label>
    <label>Password<input id="p" type="password" minlength="6" required></label>
    <p class="err" id="err"></p>
    <div class="row"><button>${signup ? "Sign up" : "Log in"}</button>
    <button type="button" class="alt" id="sw">${signup ? "I have an account" : "Create account"}</button>
    ${signup ? "" : `<button type="button" class="link" id="rs">Forgot password?</button>`}</div></form>`;
  $("#sw").onclick = () => { mode = signup ? "login" : "signup"; authView(); };
  if ($("#rs")) $("#rs").onclick = async () => {
    const e = $("#e").value; if (!e) return ($("#err").textContent = "Enter your email first.");
    try { await A.sendPasswordResetEmail(auth, e); toast("Password reset email sent 💌"); } catch (x) { $("#err").textContent = x.message; }
  };
  $("#f").onsubmit = async ev => {
    ev.preventDefault();
    try {
      if (signup) {
        const name = $("#n").value.trim();
        const c = await A.createUserWithEmailAndPassword(auth, $("#e").value, $("#p").value);
        await A.updateProfile(c.user, { displayName: name });
        prof = { name, avatar: "👑" }; await F.setDoc(F.doc(db, "users", c.user.uid), prof); route();
      } else await A.signInWithEmailAndPassword(auth, $("#e").value, $("#p").value);
    } catch (x) { $("#err").textContent = x.message.replace("Firebase: ", ""); }
  };
}

const topbar = () => `<div class="row between"><button class="alt" id="meb"><span class="av s">${esc(prof.avatar || "👑")}</span> My profile</button>
  <span class="row"><button class="alt" id="home">Home</button><button class="alt" id="out">Log out</button></span></div>`;
const bindTop = () => { $("#meb").onclick = () => go("?profile=1"); $("#home").onclick = () => go(); $("#out").onclick = () => A.signOut(auth); };

/* ---------- PROFILE ---------- */
function profileView() {
  let av = prof.avatar || "👑";
  root.innerHTML = `${topbar()}<h1>Your Profile</h1><form class="card center" id="pf">
    <div class="av big" id="pv">${av}</div>
    <div class="avs">${AVATARS.map(a => `<button type="button" class="alt" data-a="${a}">${a}</button>`).join("")}</div>
    <label>Display name<input id="n" value="${esc(myName())}" maxlength="30" required></label>
    <button>Save profile</button></form>`; bindTop();
  root.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { av = b.dataset.a; $("#pv").textContent = av; });
  $("#pf").onsubmit = async e => {
    e.preventDefault();
    const name = $("#n").value.trim();
    try {
      await A.updateProfile(user, { displayName: name });
      prof = { name, avatar: av }; await F.setDoc(F.doc(db, "users", user.uid), prof);
      const rs = await F.getDocs(F.collection(db, "users", user.uid, "rooms")), b = F.writeBatch(db);
      rs.forEach(r => b.update(F.doc(db, "rooms", r.id, "members", user.uid), { name, avatar: av }));
      await b.commit(); toast("Profile saved ✨"); go();
    } catch (x) { toast(x.message); }
  };
}

/* ---------- HOME ---------- */
async function deleteRoomFull(id, title) {
  if (prompt(`Type the room title to delete it forever:\n${title}`) !== title) return toast("Title didn't match — nothing was deleted");
  clean(); root.innerHTML = `${topbar()}<p class="muted center">Deleting room…</p>`; bindTop();
  try {
    const refs = [];
    for (const n of ["tasks", "proofs", "secrets", "invites", "races", "members"]) (await F.getDocs(F.collection(db, "rooms", id, n))).forEach(d => refs.push(d.ref));
    refs.push(F.doc(db, "rooms", id));
    for (let i = 0; i < refs.length; i += 400) { const w = F.writeBatch(db); refs.slice(i, i + 400).forEach(r => w.delete(r)); await w.commit(); }
    await F.deleteDoc(F.doc(db, "users", user.uid, "rooms", id)).catch(() => {});
    toast("Room deleted 🗑️");
  } catch (x) { toast("Could not delete: " + x.message); }
  go();
}
async function removeRoom(id, title) {
  let snap = null; try { snap = await F.getDoc(F.doc(db, "rooms", id)); } catch {}
  const idx = F.doc(db, "users", user.uid, "rooms", id);
  if (!snap || !snap.exists()) { await F.deleteDoc(idx).catch(() => {}); toast("Removed from your list"); return true; }
  if (snap.data().createdBy === user.uid) { await deleteRoomFull(id, snap.data().title); return false; }
  if (!confirm(`Leave “${title}”? You'll lose your progress in this room.`)) return false;
  try { const w = F.writeBatch(db); w.delete(F.doc(db, "rooms", id, "members", user.uid)); w.delete(idx); await w.commit(); toast("You left the room"); return true; } catch (x) { toast(x.message); return false; }
}

function homeView() {
  let th = "rose";
  root.innerHTML = `${topbar()}<h1>Your Friendships</h1>
  <div class="card"><h3>My rooms</h3><div id="rooms" class="muted">Loading…</div></div>
  <form class="card" id="c"><h3>Create a friendship room</h3>
    <p class="muted">You become the Room Owner: you give missions and approve proof of loyalty.</p>
    <label>Friendship title<input id="t" required maxlength="40" placeholder="The Bestie Club"></label>
    <h3>Choose your world</h3><div class="tgrid" id="tg">${THEME_DEFS.map(t => `<button type="button" class="tcard ${t.k === th ? "on" : ""}" data-th="${t.k}"><span class="te">${t.e}</span><b>${esc(t.n)}</b><small>${esc(t.tag)}</small></button>`).join("")}</div>
    <label>7 rank names, comma-separated (filled from your world, edit freely)<textarea id="r" rows="2">${R0.join(", ")}</textarea></label>
    <label class="opt"><input type="checkbox" id="cm" checked> 🏆 Competitive mode: leaderboard and race bonuses</label>
    <label class="opt"><input type="checkbox" id="pn" checked> ⚠️ Star penalties: wrong answers and missed deadlines can cost stars and rank</label>
    <label class="opt"><input type="checkbox" id="sg" checked> ✨ Add this world's suggested missions to my library</label>
    <p class="err" id="err"></p><button>Create room</button></form>`; bindTop();
  $("#tg").onclick = e => {
    const b = e.target.closest("[data-th]"); if (!b) return;
    th = b.dataset.th; applyTheme(th); $("#r").value = themeOf(th).ranks.join(", ");
    root.querySelectorAll(".tcard").forEach(x => x.classList.toggle("on", x === b));
  };
  unsubs.push(F.onSnapshot(F.collection(db, "users", user.uid, "rooms"), snap => {
    $("#rooms").innerHTML = snap.empty ? "No rooms yet — create your first below." :
      snap.docs.map(d => `<div class="row between" style="margin:6px 0"><span>${themeOf(d.data().theme).e} ${esc(d.data().title)}</span><span class="row"><button data-id="${d.id}">Open</button><button class="alt danger" data-rm="${d.id}" data-t="${esc(d.data().title)}" title="Delete or leave this room">🗑</button></span></div>`).join("");
    root.querySelectorAll("[data-id]").forEach(b => b.onclick = () => go("?room=" + b.dataset.id));
    root.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => removeRoom(b.dataset.rm, b.dataset.t));
  }));
  $("#c").onsubmit = async ev => {
    ev.preventDefault();
    const ranks = $("#r").value.split(",").map(s => s.trim()).filter(Boolean);
    if (ranks.length !== 7) return ($("#err").textContent = "Please give exactly 7 rank names.");
    const title = $("#t").value.trim(), theme = th;
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16), token = crypto.randomUUID().replace(/-/g, "");
    const b = F.writeBatch(db);
    b.set(F.doc(db, "rooms", id), { title, theme, ranks, competitive: $("#cm").checked, penalties: $("#pn").checked, createdBy: user.uid, inviteToken: token, created: F.serverTimestamp() });
    b.set(F.doc(db, "rooms", id, "members", user.uid), { name: myName(), avatar: prof.avatar || "👑", xp: 0 });
    b.set(F.doc(db, "rooms", id, "invites", token), { active: true, title });
    b.set(F.doc(db, "users", user.uid, "rooms", id), { title, theme, owner: true });
    if ($("#sg").checked) themeOf(theme).sug.forEach(x => b.set(F.doc(F.collection(db, "users", user.uid, "templates")), sugDoc(x)));
    try { await b.commit(); go("?room=" + id); } catch (x) { $("#err").textContent = x.message; }
  };
}

/* ---------- ROOM ---------- */
const TYPES = { text: "✍️ Writing + photo", quiz: "❓ Quiz", puzzle: "🧩 Puzzle", candy: "🍬 Candy Match" };
const ICON = { text: "✍️", quiz: "❓", puzzle: "🧩", candy: "🍬" };
const EM = ["🌸", "🍓", "⭐", "🎀", "🍰", "🦋", "🌙", "💎"];
const quizQs = t => t.questions || [{ q: t.question || "", options: t.options || [] }];
const wc = s => s.trim().split(/\s+/).filter(Boolean).length;
const isLate = t => t.deadline > 0 && Date.now() > t.deadline;
const fmtDue = t => {
  if (!t.deadline) return "";
  const ms = t.deadline - Date.now(), a = Math.abs(ms), h = Math.floor(a / 36e5);
  const left = ms < 0 ? "expired" : h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h ${Math.floor(a % 36e5 / 6e4)}m left`;
  return `${new Date(t.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} (${left})`;
};
let game = null;
function drawGame(tid) {
  const box = document.getElementById("game_" + tid); if (!box) return;
  if (!game || game.id !== tid) game = { id: tid, cards: [...EM, ...EM].sort(() => Math.random() - 0.5).map((e, n) => ({ n, e, up: false, ok: false })), pick: [], moves: 0, t0: Date.now(), lock: false };
  box.innerHTML = `<small class="muted">Moves: ${game.moves}</small><div class="mgrid">${game.cards.map(c => `<button type="button" class="mcard ${c.up || c.ok ? "up" : ""}" data-card="${c.n}">${c.up || c.ok ? c.e : "❓"}</button>`).join("")}</div>`;
}

const CANDY = ["🍬", "🍭", "🍫", "🍒", "🍋", "🍇"], N = 6, rnd = () => Math.floor(Math.random() * CANDY.length), sleep = ms => new Promise(r => setTimeout(r, ms));
let candy = null;
function findMatches(g) {
  const m = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const v = g[r][c]; if (v < 0) continue;
    if (c <= N - 3 && g[r][c + 1] === v && g[r][c + 2] === v) [0, 1, 2].forEach(k => m.add(r * N + c + k));
    if (r <= N - 3 && g[r + 1][c] === v && g[r + 2][c] === v) [0, 1, 2].forEach(k => m.add((r + k) * N + c));
  }
  return m;
}
function collapse(g) {
  for (let c = 0; c < N; c++) {
    const col = []; for (let r = N - 1; r >= 0; r--) if (g[r][c] >= 0) col.push(g[r][c]);
    while (col.length < N) col.push(rnd());
    col.forEach((v, k) => g[N - 1 - k][c] = v);
  }
}
function newBoard() {
  const g = Array.from({ length: N }, () => Array.from({ length: N }, rnd));
  let m; while ((m = findMatches(g)).size) m.forEach(k => g[Math.floor(k / N)][k % N] = rnd());
  return g;
}
function drawCandy(t) {
  const box = document.getElementById("game_" + t.id); if (!box) return;
  if (!candy || candy.id !== t.id) candy = { id: t.id, g: newBoard(), sel: null, score: 0, left: t.moves || 20, used: 0, goal: t.goal || 300, busy: false };
  const c = candy;
  box.innerHTML = `<div class="row between"><b>🎯 ${c.score}/${c.goal}</b><b>Moves left: ${c.left}</b></div><div class="bar sm"><i style="width:${Math.min(100, Math.round(c.score / c.goal * 100))}%"></i></div>
    <div class="cgrid">${c.g.map((row, r) => row.map((v, k) => `<button type="button" class="cd ${c.sel && c.sel[0] === r && c.sel[1] === k ? "sel" : ""}" data-cd="${r},${k}">${v < 0 ? "" : CANDY[v]}</button>`).join("")).join("")}</div>`;
}

function roomView(id) {
  root.innerHTML = `${topbar()}<p class="muted center">Loading room…</p>`; bindTop();
  let room = null, members = [], tasks = [], proofs = {}, secrets = {}, prev = null, owner = false, built = false;
  let selId = null, openId = null, drafts = {}, seen = null, sig = "", lib = [], penBusy = false, subbed = false, shellKey = "";
  game = null;
  const fail = () => { F.deleteDoc(F.doc(db, "users", user.uid, "rooms", id)).catch(() => {}); root.innerHTML = `${topbar()}<p class="card err">Room not found or you're not a member.</p>`; bindTop(); };
  const taskById = tid => tasks.find(x => x.id === tid);
  const paintLib = () => {
    const el = $("#lib"); if (!el) return;
    el.innerHTML = lib.length ? lib.map(t => `<div class="mem"><div style="flex:1"><b>${ICON[t.type || "text"]} ${esc(t.title)}</b> <span class="badge">+${t.xp} XP</span>${t.desc ? `<br><small class="muted">${esc(t.desc.slice(0, 90))}${t.desc.length > 90 ? "…" : ""}</small>` : ""}</div>
      <button data-use="${t.id}">Use</button><button class="alt" data-del="${t.id}">✕</button></div>`).join("")
      : `<p class="muted">No saved missions yet. Tick "Also save to my library" when you assign one, or tap 💾 Save to library.</p>`;
    const sg = $("#sugs");
    if (sg && room) sg.innerHTML = themeOf(room.theme).sug.map((x, k) => `<div class="mem"><div style="flex:1"><b>${ICON[x[1]]} ${esc(x[0])}</b> <span class="badge">+${x[2]} XP</span><br><small class="muted">${esc(x[3])}</small></div><button data-sug="${k}">Use</button></div>`).join("");
  };

  const flip = n => {
    const t = taskById(openId), g = game; if (!t || !g || g.lock) return;
    const c = g.cards[n]; if (c.up || c.ok) return;
    c.up = true; g.pick.push(c); drawGame(t.id);
    if (g.pick.length < 2) return;
    g.moves++; g.lock = true; const [a, b] = g.pick;
    setTimeout(async () => {
      if (a.e === b.e) { a.ok = true; b.ok = true; }
      a.up = false; b.up = false; g.pick = []; g.lock = false; drawGame(t.id);
      if (g.cards.every(x => x.ok)) {
        const secs = Math.round((Date.now() - g.t0) / 1000), mv = g.moves;
        try {
          await F.updateDoc(F.doc(db, "rooms", id, "tasks", t.id), { status: "submitted", proof: `Solved Memory Match in ${mv} moves and ${secs} seconds` });
          game = null; openId = null; popup({ mood: "cheer", tag: "PUZZLE CLEARED!", title: "Brilliant! 🧩", text: `${mv} moves in ${secs}s. Sent to the Room Owner for approval ⏳`, btn: "Nice!" });
        } catch (x) { toast(x.message); }
      }
    }, 750);
  };

  const tapCandy = async (r, k) => {
    const t = taskById(openId), s = candy; if (!t || !s || s.busy || s.left <= 0) return;
    if (!s.sel) { s.sel = [r, k]; return drawCandy(t); }
    const [r0, k0] = s.sel; s.sel = null;
    if (Math.abs(r - r0) + Math.abs(k - k0) !== 1) { s.sel = [r, k]; return drawCandy(t); }
    s.busy = true;
    const swap = () => { const x = s.g[r][k]; s.g[r][k] = s.g[r0][k0]; s.g[r0][k0] = x; };
    swap(); drawCandy(t);
    if (!findMatches(s.g).size) { await sleep(250); swap(); s.busy = false; drawCandy(t); return toast("No match there — try another swap 🍬"); }
    s.left--; s.used++; let m, chain = 0;
    while ((m = findMatches(s.g)).size) {
      chain++; s.score += m.size * 10 * chain; m.forEach(x => s.g[Math.floor(x / N)][x % N] = -1);
      drawCandy(t); await sleep(280); collapse(s.g); drawCandy(t); await sleep(280);
    }
    if (s.score >= s.goal) {
      try {
        await F.updateDoc(F.doc(db, "rooms", id, "tasks", t.id), { status: "submitted", proof: `Candy Match cleared: ${s.score} points in ${s.used} moves` });
        candy = null; openId = null;
        popup({ mood: "cheer", tag: "SWEET VICTORY!", title: "Candy cleared! 🍬", text: "You hit the target score. Sent to the Room Owner for approval ⏳", btn: "Sweet! 🍭" });
      } catch (x) { s.busy = false; toast(x.message); }
      return;
    }
    if (s.left <= 0) { popup({ mood: "sad", tag: "OUT OF MOVES", title: "So close! 🍫", text: `You scored ${s.score}/${s.goal}. Try again with a fresh board!`, btn: "Retry 🔁", onOk: () => { candy = null; drawCandy(t); } }); return; }
    s.busy = false; drawCandy(t);
  };

  const build = () => {
    built = true; sig = ""; owner = room.createdBy === user.uid;
    F.setDoc(F.doc(db, "users", user.uid, "rooms", id), { title: room.title, theme: room.theme }).catch(() => {});
    const link = `${location.origin}${location.pathname}?join=${id}&t=${room.inviteToken}`;
    root.innerHTML = `${topbar()}<h1>${themeOf(room.theme).e} ${esc(room.title)}</h1><div id="mine"></div><div id="pview"></div>
    ${owner ? `<form class="card" id="af"><h3>Assign a mission</h3>
      <label>Mission type<select id="ty"><option value="text">${TYPES.text}</option><option value="quiz">${TYPES.quiz}</option><option value="puzzle">${TYPES.puzzle} (Memory Match)</option><option value="candy">${TYPES.candy} (match-3 game)</option></select></label>
      <label>Mission title<input id="tt" required maxlength="80" placeholder="Send me a voice note cheering me up"></label>
      <label>Mission description — explain what to do (up to 300 words)<textarea id="td" rows="5" placeholder="Describe the mission clearly: what to do, what the photo should show, anything else the friend needs to know…"></textarea></label><small class="muted" id="tdc">0/300 words</small>
      <div id="qz" hidden><div id="qlist"></div><button type="button" class="alt" id="addq">+ Add question</button>${room.penalties ? `<label>❌ Stars lost per wrong answer<input id="wp" type="number" min="0" max="50" value="5"></label>` : ""}</div>
      <div id="cn" hidden class="row"><label style="flex:1">Target score<input id="cg" type="number" min="50" max="2000" value="300"></label><label style="flex:1">Moves allowed<input id="cm" type="number" min="5" max="60" value="20"></label></div>
      <div class="row"><label style="flex:1">Assign to<select id="sel"></select></label><label style="flex:1">XP reward<input id="tx" type="number" min="1" max="100" value="20"></label></div>
      <label>Deadline (optional)<input id="dl" type="datetime-local"></label>
      ${room.penalties ? `<label>⌛ Stars lost if the deadline is missed<input id="fp" type="number" min="0" max="100" value="10"></label>` : ""}${room.competitive ? `<label>🏁 Race bonus for the first friend approved (when assigned to Everyone)<input id="rb" type="number" min="0" max="100" value="10"></label>` : ""}
      <label class="opt"><input type="checkbox" id="sk"> Also save this mission to my library</label>
      <div class="row"><button class="gold">Assign mission</button><button type="button" class="alt" id="sv">💾 Save to library</button></div></form>
    <div class="card"><h3>📚 My mission library</h3><p class="muted">Saved missions work in every room. Tap Use to fill the form, then pick who gets it.</p><div id="lib"></div><h3 style="margin-top:16px">✨ Suggested for this world</h3><div id="sugs"></div></div>
    <form class="card" id="ef"><h3>Edit room</h3><label>Room title<input id="et" required maxlength="40" value="${esc(room.title)}"></label>
      <label>World / theme<select id="eth">${THEME_DEFS.map(t => `<option value="${t.k}" ${t.k === room.theme ? "selected" : ""}>${t.e} ${esc(t.n)}</option>`).join("")}</select></label>
      <label>7 rank names, comma-separated<textarea id="er" rows="2">${esc(room.ranks.join(", "))}</textarea></label><button type="button" class="alt" id="ur">Use this world's rank names</button>
      <label class="opt"><input type="checkbox" id="ecm" ${room.competitive ? "checked" : ""}> 🏆 Competitive mode</label><label class="opt"><input type="checkbox" id="epn" ${room.penalties ? "checked" : ""}> ⚠️ Star penalties</label><p class="err" id="eerr"></p><button>Save changes</button></form>` : ""}
    <div class="card"><h3>${owner ? "Review proof" : "My missions"}</h3><div id="tasks"></div></div>
    <div class="card"><h3>Mission table</h3><div id="tbl" class="scroll"></div></div>
    ${room.competitive ? `<div class="card"><h3>🏆 Arena leaderboard</h3><div id="arena"></div></div>` : ""}
    <div class="card"><h3>Friends, levels & profiles <small class="muted">(tap one)</small></h3><div id="board"></div></div>
    <div class="card"><h3>Rank ladder</h3><ol class="ladder" id="ladder"></ol></div>
    ${owner ? `<div class="card"><h3>Invite a friend</h3><input readonly value="${esc(link)}"><div class="row"><button id="cp">Copy link</button><button class="alt" id="rv">Revoke invite</button></div></div>
    <div class="card"><h3>Danger zone</h3><p class="muted">Deleting removes the room, every mission, photo and member progress for everyone. This can't be undone.</p><button class="alt danger" id="dr">Delete room</button></div>` : ""}
    ${owner ? "" : `<div class="card"><button class="alt danger" id="lv">Leave room</button></div>`}`;
    bindTop();
    if (!owner) $("#lv").onclick = () => removeRoom(id, room.title).then(ok => ok && go());
    if (owner) {
      $("#cp").onclick = () => { navigator.clipboard.writeText(link); toast("Invite link copied 💌"); };
      $("#rv").onclick = async () => { await F.updateDoc(F.doc(db, "rooms", id, "invites", room.inviteToken), { active: false }); toast("Invite revoked"); };
      $("#dr").onclick = () => deleteRoomFull(id, room.title);
      $("#ty").onchange = () => { $("#qz").hidden = $("#ty").value !== "quiz"; $("#cn").hidden = $("#ty").value !== "candy"; };
      $("#td").oninput = () => {
        let w = $("#td").value.trim().split(/\s+/).filter(Boolean);
        if (w.length > 300) { w = w.slice(0, 300); $("#td").value = w.join(" "); }
        $("#tdc").textContent = `${w.length}/300 words`;
      };
      $("#ur").onclick = () => { $("#er").value = themeOf($("#eth").value).ranks.join(", "); };
      $("#ef").onsubmit = async e => {
        e.preventDefault();
        const ranks = $("#er").value.split(",").map(s => s.trim()).filter(Boolean);
        if (ranks.length !== 7) return ($("#eerr").textContent = "Please give exactly 7 rank names.");
        $("#eerr").textContent = "";
        try { await F.updateDoc(F.doc(db, "rooms", id), { title: $("#et").value.trim(), theme: $("#eth").value, ranks, competitive: $("#ecm").checked, penalties: $("#epn").checked }); toast("Room updated ✨"); } catch (x) { toast(x.message); }
      };
      const qHtml = (d = {}) => `<div class="qblock card"><div class="row between"><b class="qn"></b><button type="button" class="alt" data-rmq>Remove</button></div>
        <label>Question<input class="qq" maxlength="140" value="${esc(d.q || "")}"></label>${[0, 1, 2, 3].map(k => `<label>Option ${"ABCD"[k]}<input class="qo" maxlength="80" value="${esc((d.options || [])[k] || "")}"></label>`).join("")}
        <label>Correct answer<select class="qa">${[0, 1, 2, 3].map(k => `<option value="${k}" ${d.a === k ? "selected" : ""}>${"ABCD"[k]}</option>`).join("")}</select></label></div>`;
      const numQ = () => root.querySelectorAll(".qblock .qn").forEach((n, k) => n.textContent = `Question ${k + 1}`);
      const setQs = list => { $("#qlist").innerHTML = (list.length ? list : [{}]).map(qHtml).join(""); numQ(); };
      $("#addq").onclick = () => { if (root.querySelectorAll(".qblock").length >= 10) return toast("Up to 10 questions per quiz"); $("#qlist").insertAdjacentHTML("beforeend", qHtml()); numQ(); };
      $("#qlist").onclick = e => { const b = e.target.closest("[data-rmq]"); if (b && root.querySelectorAll(".qblock").length > 1) { b.closest(".qblock").remove(); numQ(); } };
      setQs([]);
      const readMission = () => {
        const type = $("#ty").value, title = $("#tt").value.trim(), desc = $("#td").value.trim();
        const xp = Math.min(100, Math.max(1, +$("#tx").value || 20)), dl = $("#dl").value ? new Date($("#dl").value).getTime() : 0;
        if (!title) { toast("Give the mission a title ✍️"); return null; }
        if (type === "text" && wc(desc) < 5) { toast("Explain the mission in at least 5 words ✍️"); return null; }
        let extra = {}, answers = [];
        if (type === "quiz") {
          const blocks = [...root.querySelectorAll(".qblock")];
          const questions = blocks.map(b => ({ q: b.querySelector(".qq").value.trim(), options: [...b.querySelectorAll(".qo")].map(x => x.value.trim()) }));
          if (questions.some(x => !x.q || x.options.some(o => !o))) { toast("Fill in every question and all 4 options ❓"); return null; }
          extra = { questions }; answers = blocks.map(b => +b.querySelector(".qa").value);
        } else if (type === "candy") extra = { goal: Math.min(2000, Math.max(50, +$("#cg").value || 300)), moves: Math.min(60, Math.max(5, +$("#cm").value || 20)) };
        const num = (sel, max) => $(sel) ? Math.min(max, Math.max(0, +$(sel).value || 0)) : 0;
        return { type, title, desc, xp, dl, extra, answers, wp: num("#wp", 50), fp: num("#fp", 100), rb: num("#rb", 100) };
      };
      const tpl = m => ({ title: m.title, type: m.type, xp: m.xp, desc: m.desc, wrongPenalty: m.wp, failPenalty: m.fp, ...m.extra, ...(m.type === "quiz" ? { answers: m.answers } : {}), saved: F.serverTimestamp() });
      $("#sv").onclick = async () => {
        const m = readMission(); if (!m) return;
        try { await F.addDoc(F.collection(db, "users", user.uid, "templates"), tpl(m)); toast("Saved to your library 📚"); } catch (x) { toast(x.message); }
      };
      const fillForm = t => {
        $("#ty").value = t.type || "text"; $("#ty").onchange();
        $("#tt").value = t.title; $("#td").value = t.desc || ""; $("#td").oninput(); $("#tx").value = t.xp || 20;
        if (t.type === "quiz") setQs(t.questions ? t.questions.map((x, k) => ({ q: x.q, options: x.options, a: (t.answers || [])[k] })) : [{ q: t.question, options: t.options, a: t.answer }]);
        if (t.type === "candy") { $("#cg").value = t.goal || 300; $("#cm").value = t.moves || 20; }
        if ($("#wp")) $("#wp").value = t.wrongPenalty ?? 5; if ($("#fp")) $("#fp").value = t.failPenalty ?? 10;
        $("#af").scrollIntoView({ behavior: "smooth" }); toast("Loaded 📚 Choose who gets it, set a deadline, then assign.");
      };
      $("#sugs").onclick = e => { const u = e.target.closest("[data-sug]"); if (u) fillForm(sugDoc(themeOf(room.theme).sug[+u.dataset.sug])); };
      $("#lib").onclick = async e => {
        const u = e.target.closest("[data-use]"), d = e.target.closest("[data-del]");
        if (d) { try { await F.deleteDoc(F.doc(db, "users", user.uid, "templates", d.dataset.del)); } catch (x) { toast(x.message); } return; }
        if (!u) return;
        const t = lib.find(x => x.id === u.dataset.use); if (!t) return;
        fillForm(t);
      };
      $("#af").onsubmit = async e => {
        e.preventDefault();
        const sel = $("#sel").value, fr = members.filter(m => m.id !== room.createdBy);
        const targets = sel === "all" ? fr : fr.filter(m => m.id === sel);
        if (!targets.length) return toast("Invite a friend first 💌");
        const m0 = readMission(); if (!m0) return;
        const grp = sel === "all" && m0.rb > 0 && targets.length > 1 ? crypto.randomUUID().replace(/-/g, "") : "";
        const b = F.writeBatch(db);
        targets.forEach(m => {
          const ref = F.doc(F.collection(db, "rooms", id, "tasks"));
          b.set(ref, { title: m0.title, type: m0.type, xp: m0.xp, desc: m0.desc, deadline: m0.dl, assignee: m.id, assigneeName: m.name, status: "todo", proof: "", created: F.serverTimestamp(), wrongPenalty: m0.wp, failPenalty: m0.fp, ...(grp ? { grp, raceBonus: m0.rb } : {}), ...m0.extra });
          if (m0.type === "quiz") b.set(F.doc(db, "rooms", id, "secrets", ref.id), { answers: m0.answers });
        });
        if ($("#sk").checked) b.set(F.doc(F.collection(db, "users", user.uid, "templates")), tpl(m0));
        try { await b.commit(); $("#tt").value = ""; $("#td").value = ""; $("#tdc").textContent = "0/300 words"; $("#sk").checked = false; toast("Mission assigned 🎯"); } catch (x) { toast(x.message); }
      };
      paintLib();
      unsubs.push(F.onSnapshot(F.collection(db, "users", user.uid, "templates"), s => { lib = s.docs.map(d => ({ id: d.id, ...d.data() })); paintLib(); }));
    }
    const act = async e => {
      const cd = e.target.closest("[data-card]");
      if (cd) return flip(+cd.dataset.card);
      const cy = e.target.closest("[data-cd]");
      if (cy) { const [r, k] = cy.dataset.cd.split(",").map(Number); return tapCandy(r, k); }
      const b = e.target.closest("[data-act]"); if (!b) return;
      const t = taskById(b.dataset.id), a = b.dataset.act, ref = F.doc(db, "rooms", id, "tasks", b.dataset.id); if (!t) return;
      try {
        if (a === "start") {
          if (isLate(t)) return toast("⌛ This mission has expired");
          popup({ mood: "cheer", tag: "MISSION ACCEPTED", title: t.title, text: `${TYPES[t.type || "text"]} · +${t.xp} XP${t.deadline ? ` · Due ${fmtDue(t)}` : ""}. Ready, player?`, desc: t.desc, btn: "Let's go! ▶", onOk: () => { openId = t.id; game = null; candy = null; sig = ""; paint(); } });
        } else if (a === "sub") {
          const f = document.getElementById("f_" + t.id).files[0], proof = document.getElementById("p_" + t.id).value.trim();
          if (!f) return toast("Attach a photo as proof 📸");
          if (wc(proof) < 5) return toast("Write at least 5 words ✍️");
          if (isLate(t)) return toast("⌛ This mission has expired");
          b.disabled = true; b.textContent = "Uploading…";
          const photo = await shrink(f), w = F.writeBatch(db);
          w.set(F.doc(db, "rooms", id, "proofs", t.id), { photo, by: user.uid, at: F.serverTimestamp() });
          w.update(ref, { status: "submitted", proof }); await w.commit();
          delete drafts[t.id]; openId = null;
          popup({ mood: "happy", tag: "PROOF SENT", title: "Nice work! 💌", text: "Your proof is with the Room Owner. Fingers crossed! 🤞", btn: "Okay!" });
        } else if (a === "quiz") {
          const qs = quizQs(t), picks = qs.map((_, n) => root.querySelector(`input[name="q_${t.id}_${n}"]:checked`));
          if (picks.some(p => !p)) return toast("Answer every question first 🎯");
          if (isLate(t)) return toast("⌛ This mission has expired");
          await F.updateDoc(ref, { status: "submitted", proof: `Answered ${qs.length} question${qs.length > 1 ? "s" : ""}`, choices: picks.map(p => +p.value) }); openId = null;
          popup({ mood: "happy", tag: "ANSWER LOCKED IN", title: "Good luck! 🍀", text: "The Room Owner will check your answer.", btn: "Okay!" });
        } else if (a === "ok") {
          const mref = F.doc(db, "rooms", id, "members", t.assignee);
          let wrong = 0;
          if ((t.type || "text") === "quiz" && room.penalties && t.wrongPenalty > 0) { const ans = secrets[t.id] || [], ch = t.choices || [t.choice]; wrong = quizQs(t).filter((_, n) => ans[n] !== undefined && ans[n] !== ch[n]).length; }
          const lose = wrong * (t.wrongPenalty || 0);
          const res = await F.runTransaction(db, async tx => {
            const ts = await tx.get(ref), ms = await tx.get(mref);
            if (!ts.exists() || ts.data().status !== "submitted" || !ms.exists()) return null;
            const d = ts.data(); let bonus = 0, rref = null;
            if (room.competitive && d.raceBonus > 0 && d.grp) { rref = F.doc(db, "rooms", id, "races", d.grp); if (!(await tx.get(rref)).exists()) bonus = d.raceBonus; }
            const cur = ms.data().xp || 0, nxt = Math.max(0, cur + d.xp + bonus - lose);
            tx.update(ref, { status: "approved", ...(lose ? { lost: lose } : {}), ...(bonus ? { raceWinner: true } : {}) });
            tx.update(mref, { xp: nxt });
            if (bonus) tx.set(rref, { winner: d.assignee, task: ref.id });
            return { net: nxt - cur, bonus };
          });
          if (!res) toast("Already handled — no double award 🔒");
          else toast(res.bonus || lose ? `Approved ✅ ${res.net >= 0 ? "+" : ""}${res.net} XP${res.bonus ? ` (🏁 race bonus +${res.bonus})` : ""}${lose ? ` (−${lose} for wrong answers)` : ""}` : `Approved +${t.xp} XP ✅`);
        } else if (a === "no") await F.updateDoc(ref, { status: "rejected" });
        else if (a === "del") { const w = F.writeBatch(db); w.delete(ref); w.delete(F.doc(db, "rooms", id, "proofs", t.id)); w.delete(F.doc(db, "rooms", id, "secrets", t.id)); await w.commit(); }
      } catch (x) { toast(x.message); sig = ""; paint(); }
    };
    $("#tasks").onclick = act; $("#tbl").onclick = act;
    $("#tasks").oninput = e => {
      const ta = e.target.closest("textarea[data-wc]"); if (!ta) return;
      let w = ta.value.trim().split(/\s+/).filter(Boolean);
      if (w.length > 300) { w = w.slice(0, 300); ta.value = w.join(" "); }
      drafts[ta.dataset.wc] = ta.value; document.getElementById("wc_" + ta.dataset.wc).textContent = `${w.length}/300 words`;
    };
    $("#board").onclick = e => { const r = e.target.closest("[data-m]"); if (r) { selId = r.dataset.m; paint(); $("#pview").scrollIntoView({ behavior: "smooth" }); } };
    $("#pview").onclick = e => { if (e.target.closest("[data-close]")) { selId = null; paint(); } else if (e.target.closest("[data-edit]")) go("?profile=1"); };
    if (!subbed) {
    subbed = true;
    if (owner) {
      unsubs.push(F.onSnapshot(F.collection(db, "rooms", id, "proofs"), s => {
        proofs = {}; s.docs.forEach(d => { const ph = d.data().photo; if (typeof ph === "string" && ph.startsWith("data:image/jpeg;base64,")) proofs[d.id] = ph; }); paint();
      }));
      unsubs.push(F.onSnapshot(F.collection(db, "rooms", id, "secrets"), s => { secrets = {}; s.docs.forEach(d => secrets[d.id] = d.data().answers || [d.data().answer]); paint(); }));
    }
    unsubs.push(F.onSnapshot(F.collection(db, "rooms", id, "tasks"), s => { tasks = s.docs.map(d => ({ id: d.id, ...d.data() })); react(); notifyNew(); notifyPenalty(); applyPenalties(); paint(); }));
    }
  };

  const react = () => {
    const cur = {}; tasks.forEach(t => cur[t.id] = t.status);
    if (seen) tasks.forEach(t => {
      const was = seen[t.id], ty = t.type || "text";
      if (!owner && t.assignee === user.uid) {
        if (was === "submitted" && t.status === "approved") popup({ mood: "cheer", tag: "MISSION COMPLETE!", title: "Yes! You did it! 🎉", text: `You successfully completed “${t.title}” and earned +${t.xp} XP!`, btn: "Yay! ✨" });
        else if (was === "submitted" && t.status === "rejected") popup({ mood: "sad", tag: "TRY AGAIN", title: "Oh no… sent back!", text: `“${t.title}” needs another try. You've got this!`, btn: "Retry 🔁" });
      } else if (owner && t.status === "submitted" && was !== "submitted") toast(`📬 ${t.assigneeName} sent proof for “${t.title}”`);
    });
    seen = cur;
  };

  const notifyNew = () => {
    if (owner) return;
    const key = `seenTasks_${user.uid}_${id}`; let known;
    try { known = JSON.parse(localStorage.getItem(key) || "[]"); } catch { known = []; }
    const fresh = tasks.filter(t => t.assignee === user.uid && t.status === "todo" && !isLate(t) && !known.includes(t.id));
    if (!fresh.length) return;
    try { localStorage.setItem(key, JSON.stringify([...known, ...fresh.map(t => t.id)])); } catch {}
    if (fresh.length === 1) { const t = fresh[0]; popup({ mood: "happy", tag: "NEW MISSION!", title: t.title, text: `${TYPES[t.type || "text"]} · +${t.xp} XP${t.deadline ? ` · Due ${fmtDue(t)}` : ""}`, desc: t.desc, btn: "On it! 💪" }); }
    else popup({ mood: "happy", tag: "NEW MISSIONS!", title: `${fresh.length} new missions`, text: fresh.map(t => `• ${t.title} (+${t.xp} XP)`).join("\n"), btn: "On it! 💪" });
  };

  const applyPenalties = async () => {
    if (!owner || !room || !room.penalties || penBusy) return;
    const due = tasks.filter(t => isLate(t) && ["todo", "rejected"].includes(t.status) && t.failPenalty > 0 && !t.penalized);
    if (!due.length) return;
    penBusy = true;
    for (const t of due) {
      const ref = F.doc(db, "rooms", id, "tasks", t.id), mref = F.doc(db, "rooms", id, "members", t.assignee);
      try {
        const hit = await F.runTransaction(db, async tx => {
          const ts = await tx.get(ref), ms = await tx.get(mref);
          if (!ts.exists() || ts.data().penalized || !["todo", "rejected"].includes(ts.data().status)) return false;
          if (ms.exists()) tx.update(mref, { xp: Math.max(0, (ms.data().xp || 0) - t.failPenalty) });
          tx.update(ref, { penalized: true, lost: t.failPenalty }); return true;
        });
        if (hit) toast(`⌛ ${t.assigneeName} missed “${t.title}” (−${t.failPenalty} stars)`);
      } catch {}
    }
    penBusy = false;
  };

  const notifyPenalty = () => {
    if (owner) return;
    const key = `seenLost_${user.uid}_${id}`; let known;
    try { known = JSON.parse(localStorage.getItem(key) || "[]"); } catch { known = []; }
    const fresh = tasks.filter(t => t.assignee === user.uid && t.lost > 0 && !known.includes(t.id));
    if (!fresh.length) return;
    try { localStorage.setItem(key, JSON.stringify([...known, ...fresh.map(t => t.id)])); } catch {}
    fresh.forEach(t => popup(t.penalized
      ? { mood: "sad", tag: "DEADLINE MISSED", title: "Oh no… time ran out!", text: `“${t.title}” expired and you lost ${t.lost} stars.`, btn: "I'll do better 💪" }
      : { mood: "sad", tag: "WRONG ANSWERS", title: "Ouch… stars lost!", text: `You missed some answers on “${t.title}” and lost ${t.lost} stars.`, btn: "Next time! 🍀" }));
  };

  const friendCard = t => {
    const more = t.desc ? `<details><summary>📖 Instructions</summary><div class="desc">${esc(t.desc)}</div></details>` : "";
    const ty = t.type || "text", due = t.deadline ? `<span class="badge ${isLate(t) ? "rejected" : "todo"}">⏰ ${esc(fmtDue(t))}</span>` : "";
    if (t.status === "approved") return `<div class="task">✅ ${esc(t.title)} <span class="badge approved">+${t.xp} XP earned</span>${more}</div>`;
    if (t.status === "submitted") return `<div class="task">⏳ ${esc(t.title)} <span class="badge submitted">waiting for approval</span>${more}</div>`;
    if (isLate(t)) return `<div class="task locked">⌛ ${esc(t.title)} ${due}<br><small class="err">Mission expired.${t.penalized ? ` −${t.lost} stars for the missed deadline.` : ""}</small>${more}</div>`;
    let body;
    if (openId !== t.id) body = `<button class="gold" data-act="start" data-id="${t.id}">Start mission ▶</button>`;
    else if (ty === "quiz") body = `${quizQs(t).map((x, n) => `<div class="qcard"><p><b>${n + 1}. ${esc(x.q)}</b></p>${x.options.map((o, i) => `<label class="opt"><input type="radio" name="q_${t.id}_${n}" value="${i}"> ${"ABCD"[i]}. ${esc(o)}</label>`).join("")}</div>`).join("")}<button data-act="quiz" data-id="${t.id}">Lock in answers</button>`;
    else if (ty === "candy") body = `<p class="muted">Tap a candy, then a neighbour to swap. Match 3+ to score ${t.goal || 300} points in ${t.moves || 20} moves!</p><div id="game_${t.id}"></div>`;
    else if (ty === "puzzle") body = `<p class="muted">Match all the pairs! Your result is sent automatically.</p><div id="game_${t.id}"></div>`;
    else body = `<label>📸 Photo proof (required)<input type="file" accept="image/*" id="f_${t.id}"></label>
      <label>Your answer (up to 300 words)<textarea id="p_${t.id}" data-wc="${t.id}" rows="8" placeholder="Write your mission response here…">${esc(drafts[t.id] || "")}</textarea></label>
      <small class="muted" id="wc_${t.id}">${wc(drafts[t.id] || "")}/300 words</small><br><button data-act="sub" data-id="${t.id}">Submit proof</button>`;
    return `<div class="task"><b>${ICON[ty]} ${esc(t.title)}</b> <span class="badge">+${t.xp} XP</span> ${due}${t.status === "rejected" ? `<br><small class="err">Sent back — try again!</small>` : ""}${t.desc ? `<div class="desc"><b>📖 Mission instructions</b><br>${esc(t.desc)}</div>` : ty === "text" ? `<p class="muted"><small>No written instructions were added to this mission.</small></p>` : ""}<div style="margin-top:8px">${body}</div></div>`;
  };

  const ownerTasks = () => {
    const pend = tasks.filter(t => t.status === "submitted");
    $("#tasks").innerHTML = pend.length ? pend.map(t => {
      const ty = t.type || "text"; let ev;
      if (ty === "quiz") {
        const ans = secrets[t.id] || [], ch = t.choices || [t.choice], qs = quizQs(t); let ok = 0;
        const lines = qs.map((x, n) => { const good = ans[n] === ch[n]; if (good) ok++; return `<li>${esc(x.q)}<br><small>Chose: ${esc(x.options[ch[n]] ?? "—")} ${ans[n] === undefined ? "" : good ? `<span class="badge approved">✅</span>` : `<span class="badge rejected">❌ correct: ${esc(x.options[ans[n]] ?? "")}</span>`}</small></li>`; }).join("");
        ev = `<br><b>Score: ${ans.length ? ok + "/" + qs.length : "…"}</b><ol class="log">${lines}</ol>`;
      }
      else if (ty === "puzzle" || ty === "candy") ev = `<br>${ICON[ty]} ${esc(t.proof)}`;
      else ev = `<br>“${esc(t.proof)}”<br>${proofs[t.id] ? `<img class="ph" src="${proofs[t.id]}" alt="proof photo">` : `<small class="muted">(loading photo…)</small>`}`;
      return `<div class="task"><b>${TYPES[ty]} · ${esc(t.title)}</b> <span class="badge">+${t.xp} XP</span>${t.desc ? `<details><summary>📖 Mission instructions</summary><div class="desc">${esc(t.desc)}</div></details>` : ""}<small class="muted">${esc(t.assigneeName)} submitted:</small>${ev}
        <div class="row" style="margin-top:8px"><button data-act="ok" data-id="${t.id}">Approve</button><button class="alt" data-act="no" data-id="${t.id}">Send back</button></div></div>`;
    }).join("") : `<p class="muted">Nothing waiting for review.</p>`;
  };

  const paint = () => {
    if (!room || !built) return;
    applyTheme(room.theme); root.querySelector("h1").textContent = `${themeOf(room.theme).e} ${room.title}`;
    if (openId) { const o = taskById(openId); if (!o || !["todo", "rejected"].includes(o.status) || isLate(o)) openId = null; }
    if (!openId) { game = null; candy = null; }
    const me = members.find(m => m.id === user.uid), mx = me?.xp || 0, i = rankIdx(mx), next = STEPS[i + 1];
    if (!owner) {
      if (me) { if (prev !== null && i > prev) popup({ mood: "cheer", tag: "LEVEL UP!", title: room.ranks[i], text: `You unlocked a new rank and reached ${mx} XP! 🔓`, btn: "Awesome! 🎮" });
        else if (prev !== null && i < prev) popup({ mood: "sad", tag: "RANK DROPPED", title: room.ranks[i], text: `Your stars dropped to ${mx} XP. Win them back with your next mission!`, btn: "I'll bounce back 💪" });
        prev = i; }
      const pct = next ? Math.round((mx - STEPS[i]) / (next - STEPS[i]) * 100) : 100;
      $("#mine").innerHTML = `<div class="card center"><div class="av big">${esc(me?.avatar || prof.avatar || "👑")}</div><div class="rank">${esc(room.ranks[i])}</div>
        <div class="stars">⭐ ${mx} XP</div><div class="bar"><i style="width:${pct}%"></i></div>
        <small class="muted">${next ? `${next - mx} XP to ${esc(room.ranks[i + 1])}` : "Highest rank reached 👑"}</small></div>`;
    } else $("#mine").innerHTML = `<div class="card center"><div class="av big">${esc(prof.avatar || "👑")}</div><b>You are the Room Owner 👑</b><br><small class="muted">Assign missions, then approve or send back the proof.</small></div>`;

    const fr = members.filter(m => m.id !== room.createdBy).sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const row = m => {
      const x = m.xp || 0, k = rankIdx(x), nx = STEPS[k + 1], pc = nx ? Math.round((x - STEPS[k]) / (nx - STEPS[k]) * 100) : 100;
      const mt = tasks.filter(t => t.assignee === m.id), dn = mt.filter(t => t.status === "approved").length, pn = mt.filter(t => t.status === "submitted").length;
      return `<div class="mem click" data-m="${m.id}"><span class="av">${esc(m.avatar || "👑")}</span><div style="flex:1"><b>${esc(m.name)}</b> <small class="muted">${esc(room.ranks[k])} · ${x} XP</small>
        <div class="bar sm"><i style="width:${pc}%"></i></div><small class="muted">${nx ? `${nx - x} XP to ${esc(room.ranks[k + 1])}` : "Max rank 👑"} · ${dn}/${mt.length} missions${pn ? ` · ${pn} to review` : ""}</small></div></div>`;
    };
    const ow = members.find(m => m.id === room.createdBy);
    $("#board").innerHTML = (ow ? `<div class="mem click" data-m="${ow.id}"><span class="av">${esc(ow.avatar || "👑")}</span><div style="flex:1"><b>${esc(ow.name)}</b> <span class="badge">Room Owner 👑</span></div></div>` : "") +
      (fr.length ? fr.map(row).join("") : `<p class="muted">No friends have joined yet — share the invite link!</p>`);

    if (room.competitive && $("#arena")) {
      const medals = ["🥇", "🥈", "🥉"];
      $("#arena").innerHTML = fr.length ? fr.map((m, k) => {
        const up = fr[k - 1], gap = up ? (up.xp || 0) - (m.xp || 0) : 0;
        return `<div class="mem"><span class="medal">${medals[k] || "#" + (k + 1)}</span><span class="av">${esc(m.avatar || "👑")}</span><div style="flex:1"><b>${esc(m.name)}</b>${m.id === user.uid ? " (you)" : ""}<br><small class="muted">${m.xp || 0} XP · ${esc(room.ranks[rankIdx(m.xp || 0)])}${up ? (gap ? ` · ${gap} XP behind ${esc(up.name)}` : ` · tied with ${esc(up.name)}`) : " · leading! 👑"}</small></div></div>`;
      }).join("") : `<p class="muted">The competition starts when friends join.</p>`;
    }
    const refXp = owner ? Math.max(0, ...fr.map(m => m.xp || 0)) : mx;
    $("#ladder").innerHTML = room.ranks.map((n, k) => {
      const un = refXp >= STEPS[k], show = un || owner || k === rankIdx(refXp) + 1, here = fr.filter(m => rankIdx(m.xp || 0) === k);
      return `<li class="${un ? "open" : "locked"} ${!owner && k === i ? "on" : ""}"><span>${un ? "🔓" : "🔒"} ${k + 1}. ${show ? esc(n) : "???"} ${here.map(m => esc(m.avatar || "👑")).join(" ")}</span><span>${un ? "Unlocked" : STEPS[k] + " XP to unlock"}</span></li>`;
    }).join("");

    const order = { submitted: 0, todo: 1, rejected: 2, approved: 3 }, dnAll = tasks.filter(t => t.status === "approved").length;
    $("#tbl").innerHTML = tasks.length ? `<small class="muted">Room progress: ${dnAll}/${tasks.length} missions complete</small><div class="bar sm"><i style="width:${Math.round(dnAll / tasks.length * 100)}%"></i></div>
      <table><thead><tr><th>Friend</th><th>Mission</th><th>XP</th><th>Due</th><th>Status</th>${owner ? "<th></th>" : ""}</tr></thead><tbody>` +
      [...tasks].sort((a, b) => order[a.status] - order[b.status]).map(t => `<tr><td>${esc(members.find(m => m.id === t.assignee)?.avatar || "👑")} ${esc(t.assigneeName)}</td><td>${ICON[t.type || "text"]} ${esc(t.title)}</td><td>${t.xp}</td>
        <td>${t.deadline ? esc(new Date(t.deadline).toLocaleDateString([], { dateStyle: "medium" })) + (isLate(t) && t.status !== "approved" ? " ⌛" : "") : "—"}</td>
        <td><span class="badge ${t.status}">${t.status === "approved" ? "✅ done" : t.status}</span>${t.raceWinner ? " 🏁" : ""}${t.lost ? ` <small class="err">−${t.lost}</small>` : ""}</td>${owner ? `<td>${t.status !== "approved" ? `<button class="alt" data-act="del" data-id="${t.id}">✕</button>` : ""}</td>` : ""}</tr>`).join("") + `</tbody></table>`
      : `<p class="muted">No missions assigned yet.</p>`;

    const pm = selId && members.find(m => m.id === selId);
    $("#pview").innerHTML = pm ? (() => {
      const isO = pm.id === room.createdBy, x = pm.xp || 0, k = rankIdx(x), nx = STEPS[k + 1], pc = nx ? Math.round((x - STEPS[k]) / (nx - STEPS[k]) * 100) : 100, mt = tasks.filter(t => t.assignee === pm.id);
      return `<div class="card center"><div class="av big">${esc(pm.avatar || "👑")}</div><h2>${esc(pm.name)}</h2>` + (isO ? `<p class="muted">Room Owner 👑 · ${tasks.length} missions assigned</p>` :
        `<div class="rank">${esc(room.ranks[k])}</div><div class="stars">⭐ ${x} XP</div><div class="bar"><i style="width:${pc}%"></i></div>
        <p class="muted">${mt.filter(t => t.status === "approved").length}/${mt.length} missions complete</p>
        <ol class="log" style="text-align:left">${mt.map(t => `<li>${t.status === "approved" ? "✅" : t.status === "submitted" ? "⏳" : "🎯"} ${esc(t.title)} <span class="badge ${t.status}">${t.status}</span></li>`).join("")}</ol>`) +
        `<div class="row" style="justify-content:center">${pm.id === user.uid ? `<button data-edit>Edit my profile</button>` : ""}<button class="alt" data-close>Close</button></div></div>`;
    })() : "";

    if (owner) {
      const sel = $("#sel"), v = sel.value;
      sel.innerHTML = `<option value="all">Everyone</option>` + fr.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
      if ([...sel.options].some(o => o.value === v)) sel.value = v;
    }
    const nsig = JSON.stringify([tasks.map(t => [t.id, t.status, t.deadline]), owner ? Object.keys(proofs).length + Object.keys(secrets).length : 0, openId]);
    if (nsig !== sig) {
      sig = nsig;
      if (owner) ownerTasks();
      else { const mine = tasks.filter(t => t.assignee === user.uid); $("#tasks").innerHTML = mine.length ? mine.map(friendCard).join("") : `<p class="muted">No missions yet. The Room Owner will assign your tasks soon!</p>`; const o = openId && taskById(openId); if (o && o.type === "puzzle") drawGame(o.id); else if (o && o.type === "candy") drawCandy(o); }
    }
  };

  unsubs.push(F.onSnapshot(F.doc(db, "rooms", id), s => { if (!s.exists()) return fail(); room = s.data(); const key = `${!!room.competitive}${!!room.penalties}`; if (!built || key !== shellKey) { shellKey = key; build(); } paint(); }, fail));
  unsubs.push(F.onSnapshot(F.collection(db, "rooms", id, "members"), s => { members = s.docs.map(d => ({ id: d.id, ...d.data() })); paint(); }));
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
    root.innerHTML = `${topbar()}<div class="card center"><h2>You're invited! 💌</h2><p>Join <b>${esc(title)}</b> and prove your loyalty through missions.</p><button id="j">Join the party</button><p class="err" id="err"></p></div>`; bindTop();
    $("#j").onclick = async () => {
      const b = F.writeBatch(db);
      b.set(F.doc(db, "rooms", id, "members", user.uid), { name: myName(), avatar: prof.avatar || "👑", xp: 0, token });
      b.set(F.doc(db, "users", user.uid, "rooms", id), { title });
      try { await b.commit(); go("?room=" + id); } catch (x) { $("#err").textContent = x.message; }
    };
  } catch { root.innerHTML = `${topbar()}<p class="card err">This invitation is invalid or has been revoked.</p>`; bindTop(); }
}
