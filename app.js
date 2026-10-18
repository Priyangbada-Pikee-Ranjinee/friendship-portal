import { auth, db, A, F } from "./firebase.js";

const root = document.querySelector("#app");
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const STEPS = [0, 50, 120, 220, 350, 520, 750];
const DEF_RANKS = ["Friend", "Trusted Friend", "Close Friend", "Loyal Friend", "Bestie", "Best Friend", "Soul Sister"];
const AVATARS = ["👑", "🦄", "🐱", "🦊", "🐼", "🐸", "🦋", "🌸", "🔥", "⚡", "🎮", "🐉"];
let user = null, prof = { avatar: "👑" }, unsubs = [], params = new URLSearchParams(location.search), mode = "login";

const $ = s => root.querySelector(s);
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
  clean(); document.body.dataset.theme = "rose";
  if (!user) return authView();
  if (params.get("join")) return joinView();
  if (params.get("room")) return roomView(params.get("room"));
  if (params.get("profile")) return profileView();
  homeView();
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

const topbar = () => `<div class="row between"><button class="alt" id="meb"><span class="av s">${esc(prof.avatar || "👑")}</span> ${esc(myName())}</button>
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
function homeView() {
  root.innerHTML = `${topbar()}<h1>Your Friendships</h1>
  <div class="card"><h3>My rooms</h3><div id="rooms" class="muted">Loading…</div></div>
  <form class="card" id="c"><h3>Create a friendship room</h3>
    <p class="muted">You become the Room Owner: you give missions and approve proof of loyalty.</p>
    <label>Friendship title<input id="t" required maxlength="40" placeholder="The Bestie Club"></label>
    <label>Theme<select id="th"><option value="rose">Neon Pink</option><option value="lavender">Purple</option><option value="ocean">Ocean Blue</option><option value="sage">Green</option></select></label>
    <label>7 rank names, comma-separated (lowest to highest)<textarea id="r" rows="2">${DEF_RANKS.join(", ")}</textarea></label>
    <p class="err" id="err"></p><button>Create room</button></form>`; bindTop();
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
    b.set(F.doc(db, "rooms", id), { title, theme, ranks, createdBy: user.uid, inviteToken: token, created: F.serverTimestamp() });
    b.set(F.doc(db, "rooms", id, "members", user.uid), { name: myName(), avatar: prof.avatar || "👑", xp: 0 });
    b.set(F.doc(db, "rooms", id, "invites", token), { active: true, title });
    b.set(F.doc(db, "users", user.uid, "rooms", id), { title, theme });
    try { await b.commit(); go("?room=" + id); } catch (x) { $("#err").textContent = x.message; }
  };
}

/* ---------- ROOM ---------- */
function roomView(id) {
  root.innerHTML = `${topbar()}<p class="muted center">Loading room…</p>`; bindTop();
  let room = null, members = [], tasks = [], prev = null, owner = false, built = false;
  const fail = () => { root.innerHTML = `${topbar()}<p class="card err">Room not found or you're not a member.</p>`; bindTop(); };

  const build = () => {
    built = true; owner = room.createdBy === user.uid;
    const link = `${location.origin}${location.pathname}?join=${id}&t=${room.inviteToken}`;
    root.innerHTML = `${topbar()}<h1>${esc(room.title)}</h1>
    <div id="mine"></div>
    ${owner ? `<form class="card" id="af"><h3>Assign a mission</h3>
      <label>Task to prove loyalty<input id="tt" required maxlength="80" placeholder="Send me a voice note cheering me up"></label>
      <div class="row"><label style="flex:1">Assign to<select id="sel"></select></label><label style="flex:1">XP reward<input id="tx" type="number" min="1" max="100" value="20"></label></div>
      <button class="gold">Assign mission</button></form>` : ""}
    <div class="card"><h3>${owner ? "Review proof" : "My missions"}</h3><div id="tasks"></div></div>
    <div class="card"><h3>Friends & ranks</h3><div id="board"></div></div>
    ${owner ? `<div class="card"><h3>Invite a friend</h3><input readonly value="${esc(link)}"><div class="row"><button id="cp">Copy link</button><button class="alt" id="rv">Revoke invite</button></div></div>` : ""}`;
    bindTop();
    if (owner) {
      $("#cp").onclick = () => { navigator.clipboard.writeText(link); toast("Invite link copied 💌"); };
      $("#rv").onclick = async () => { await F.updateDoc(F.doc(db, "rooms", id, "invites", room.inviteToken), { active: false }); toast("Invite revoked"); };
      $("#af").onsubmit = async e => {
        e.preventDefault();
        const sel = $("#sel").value, fr = members.filter(m => m.id !== room.createdBy);
        const targets = sel === "all" ? fr : fr.filter(m => m.id === sel);
        if (!targets.length) return toast("Invite a friend first 💌");
        const title = $("#tt").value.trim(), xp = Math.min(100, Math.max(1, +$("#tx").value || 20)), b = F.writeBatch(db);
        targets.forEach(m => b.set(F.doc(F.collection(db, "rooms", id, "tasks")), { title, xp, assignee: m.id, assigneeName: m.name, status: "todo", proof: "", created: F.serverTimestamp() }));
        try { await b.commit(); $("#tt").value = ""; toast("Mission assigned 🎯"); } catch (x) { toast(x.message); }
      };
    }
    $("#tasks").onclick = async e => {
      const b = e.target.closest("[data-act]"); if (!b) return;
      const t = tasks.find(x => x.id === b.dataset.id), ref = F.doc(db, "rooms", id, "tasks", b.dataset.id);
      try {
        if (b.dataset.act === "sub") {
          const proof = document.getElementById("p_" + t.id).value.trim();
          if (!proof) return toast("Write your proof first ✍️");
          await F.updateDoc(ref, { status: "submitted", proof }); toast("Proof sent! Waiting for approval ⏳");
        } else if (b.dataset.act === "ok") {
          const w = F.writeBatch(db); w.update(ref, { status: "approved" });
          w.update(F.doc(db, "rooms", id, "members", t.assignee), { xp: F.increment(t.xp) }); await w.commit(); toast(`Approved +${t.xp} XP ✅`);
        } else if (b.dataset.act === "no") await F.updateDoc(ref, { status: "rejected" });
        else if (b.dataset.act === "del") await F.deleteDoc(ref);
      } catch (x) { toast(x.message); }
    };
    const tq = owner ? F.collection(db, "rooms", id, "tasks") : F.query(F.collection(db, "rooms", id, "tasks"), F.where("assignee", "==", user.uid));
    unsubs.push(F.onSnapshot(tq, s => { tasks = s.docs.map(d => ({ id: d.id, ...d.data() })); paint(); }));
  };

  const paint = () => {
    if (!room || !built) return;
    document.body.dataset.theme = room.theme;
    const me = members.find(m => m.id === user.uid), mx = me?.xp || 0, i = rankIdx(mx), next = STEPS[i + 1];
    if (!owner) {
      if (prev !== null && i > prev) toast(`🎮 LEVEL UP! ${room.ranks[i]}`); prev = i;
      const pct = next ? Math.round((mx - STEPS[i]) / (next - STEPS[i]) * 100) : 100;
      $("#mine").innerHTML = `<div class="card center"><div class="av big">${esc(me?.avatar || prof.avatar || "👑")}</div><div class="rank">${esc(room.ranks[i])}</div>
        <div class="stars">⭐ ${mx} XP</div><div class="bar"><i style="width:${pct}%"></i></div>
        <small class="muted">${next ? `${next - mx} XP to ${esc(room.ranks[i + 1])}` : "Highest rank reached 👑"}</small></div>`;
    } else $("#mine").innerHTML = `<div class="card center"><div class="av big">${esc(prof.avatar || "👑")}</div><b>You are the Room Owner 👑</b><br><small class="muted">Assign missions, then approve or send back the proof.</small></div>`;

    const fr = members.filter(m => m.id !== room.createdBy).sort((a, b) => (b.xp || 0) - (a.xp || 0));
    $("#board").innerHTML = fr.length ? fr.map(m => {
      const k = rankIdx(m.xp || 0), mt = tasks.filter(t => t.assignee === m.id), done = mt.filter(t => t.status === "approved").length, pend = mt.filter(t => t.status === "submitted").length;
      return `<div class="mem"><span class="av">${esc(m.avatar || "👑")}</span><div style="flex:1"><b>${esc(m.name)}</b><br><small class="muted">${esc(room.ranks[k])} · ${m.xp || 0} XP</small></div>
        ${owner ? `<span class="badge">${done}/${mt.length} done${pend ? ` · ${pend} to review` : ""}</span>` : ""}</div>`;
    }).join("") : `<p class="muted">No friends have joined yet — share the invite link!</p>`;

    if (owner) {
      const sel = $("#sel"), v = sel.value;
      sel.innerHTML = `<option value="all">Everyone</option>` + fr.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
      if ([...sel.options].some(o => o.value === v)) sel.value = v;
      const pend = tasks.filter(t => t.status === "submitted"), rest = tasks.filter(t => t.status !== "submitted");
      $("#tasks").innerHTML = (pend.length ? pend.map(t => `<div class="task"><b>${esc(t.title)}</b> <span class="badge">+${t.xp} XP</span><br>
        <small class="muted">${esc(t.assigneeName)} says:</small> “${esc(t.proof)}”<div class="row" style="margin-top:8px"><button data-act="ok" data-id="${t.id}">Approve</button><button class="alt" data-act="no" data-id="${t.id}">Send back</button></div></div>`).join("")
        : `<p class="muted">Nothing waiting for review.</p>`) +
        (rest.length ? `<h3 style="margin-top:16px">All missions</h3>` + rest.map(t => `<div class="row between task"><span>${esc(t.assigneeName)} — ${esc(t.title)} <span class="badge ${t.status}">${t.status}</span></span>${t.status !== "approved" ? `<button class="alt" data-act="del" data-id="${t.id}">Remove</button>` : ""}</div>`).join("") : "");
    } else {
      $("#tasks").innerHTML = tasks.length ? tasks.map(t => t.status === "approved" ? `<div class="task">✅ ${esc(t.title)} <span class="badge approved">+${t.xp} XP earned</span></div>`
        : t.status === "submitted" ? `<div class="task">⏳ ${esc(t.title)} <span class="badge submitted">waiting for approval</span></div>`
        : `<div class="task"><b>🎯 ${esc(t.title)}</b> <span class="badge">+${t.xp} XP</span>${t.status === "rejected" ? `<br><small class="err">Sent back — try again with better proof.</small>` : ""}
          <textarea id="p_${t.id}" rows="2" placeholder="Describe how you completed it (or paste a link)"></textarea><button data-act="sub" data-id="${t.id}">Submit proof</button></div>`).join("")
        : `<p class="muted">No missions yet. The Room Owner will assign your tasks soon!</p>`;
    }
  };

  unsubs.push(F.onSnapshot(F.doc(db, "rooms", id), s => { if (!s.exists()) return fail(); room = s.data(); built ? paint() : build(); paint(); }, fail));
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
