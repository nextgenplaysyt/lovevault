// ===== HELPER =====
function el(id) {
  return document.getElementById(id);
}

// ===== NAV =====
function goTo(page) {
  window.location.href = page;
}

// ===== LOGIN =====
async function login() {
  let email = el("username")?.value;
  let password = el("password")?.value;

  if (!email || !password) return notify("Fill all fields");

  try {
    let userCred = await auth.signInWithEmailAndPassword(email, password);

    let loggedEmail = userCred.user.email.trim().toLowerCase();

    if (loggedEmail === "nextgenplaysyt@gmail.com") {
      goTo("admin.html");
    } else {
      goTo("home.html");
    }

  } catch (e) {
    notify("Login failed ❌");
    console.error(e);
  }
}

// ===== REGISTER =====
async function register() {
  let email = el("username")?.value;
  let password = el("password")?.value;

  if (!email || !password) return notify("Fill all fields");

  try {
    // 🔒 Check registration allowed
    let config = await db.collection("settings").doc("config").get();

    if (config.exists && config.data().allowRegister === false) {
      return notify("Registration closed ❌");
    }

    let userCred = await auth.createUserWithEmailAndPassword(email, password);

    await db.collection("users").doc(userCred.user.uid).set({
      email
    });

    notify("Registered ✅");

  } catch (e) {
    notify("Registration failed ❌");
    console.error(e);
  }
}

// ===== LOGOUT =====
function logout() {
  auth.signOut();
  goTo("index.html");
}

// ===== NOTIFY =====
function notify(text) {
  let n = document.createElement("div");
  n.className = "toast";
  n.innerText = text;
  document.body.appendChild(n);

  setTimeout(() => n.remove(), 2500);
}

//
// ================= REQUESTS =================
//

async function sendRequest() {
  let name = el("reqName")?.value;
  let cost = el("reqCost")?.value;

  if (!name || !cost) return notify("Fill all fields");

  try {
    await db.collection("requests").add({
      name,
      cost,
      status: "pending",
      time: Date.now()
    });

    notify("Request sent 💌");
    loadUserRequests();

  } catch (e) {
    notify("Error ❌");
  }
}

async function loadUserRequests() {
  let container = el("userRequests");
  if (!container) return;

  let snapshot = await db.collection("requests").orderBy("time", "desc").get();

  container.innerHTML = "";

  snapshot.forEach(doc => {
    let r = doc.data();

    container.innerHTML += `
      <div class="card">
        ${r.name} - ${r.cost} 🪙
        <br>Status: ${r.status}
        ${
          r.status === "pending"
            ? `<button onclick="cancelRequest('${doc.id}')">Cancel</button>`
            : ""
        }
      </div>
    `;
  });
}

async function cancelRequest(id) {
  await db.collection("requests").doc(id).delete();
  loadUserRequests();
}

async function loadAdminRequests() {
  let container = el("adminRequests");
  if (!container) return;

  let snapshot = await db.collection("requests").orderBy("time", "desc").get();

  container.innerHTML = "";

  snapshot.forEach(doc => {
    let r = doc.data();

    container.innerHTML += `
      <div class="card">
        ${r.name} - ${r.cost} 🪙
        <br>Status: ${r.status}

        ${
          r.status === "pending"
            ? `<button onclick="approveRequest('${doc.id}')">Approve</button>`
            : ""
        }

        ${
          r.status === "approved"
            ? `<button onclick="completeRequest('${doc.id}')">Complete</button>`
            : ""
        }

        <button onclick="deleteRequest('${doc.id}')">Delete</button>
      </div>
    `;
  });
}

async function approveRequest(id) {
  await db.collection("requests").doc(id).update({ status: "approved" });
  loadAdminRequests();
}

async function completeRequest(id) {
  let doc = await db.collection("requests").doc(id).get();
  let cost = doc.data().cost;

  let coins = await getCoins();
  coins -= parseInt(cost);

  await setCoins(coins);

  await db.collection("requests").doc(id).update({
    status: "completed"
  });

  loadCoins();
  loadAdminRequests();
}

async function deleteRequest(id) {
  await db.collection("requests").doc(id).delete();
  loadAdminRequests();
}

//
// ================= MESSAGES =================
//

async function showMessage() {
  let today = new Date().toISOString().split("T")[0];

  let doc = await db.collection("dailyMessages").doc(today).get();

  if (!doc.exists) {
    el("dailyMessage").innerText = "No message today 💭";
    return;
  }

  let msg = doc.data();

  el("dailyMessage").innerHTML = `
    ${msg.text}<br>
    ${msg.image ? `<img src="${msg.image}" width="200">` : ""}
  `;
}

function saveDailyMessage() {
  let date = el("msgDate")?.value;
  let text = el("msgText")?.value;
  let file = el("msgImage")?.files[0];

  let reader = new FileReader();

  reader.onload = async function () {
    await db.collection("dailyMessages").doc(date).set({
      text,
      image: reader.result || null
    });

    notify("Saved ✅");
  };

  if (file) reader.readAsDataURL(file);
  else reader.onload();
}

//
// ================= COINS =================
//

async function getCoins() {
  let doc = await db.collection("coins").doc("main").get();

  if (!doc.exists) {
    await db.collection("coins").doc("main").set({ value: 0 });
    return 0;
  }

  return doc.data().value;
}

async function setCoins(value) {
  await db.collection("coins").doc("main").set({ value });
}

async function loadCoins() {
  let coinEl = el("coinCount");
  if (!coinEl) return;

  let coins = await getCoins();
  coinEl.innerText = coins;
}

//
// ================= REGISTRATION CONTROL =================
//

async function toggleRegistration() {
  try {
    let ref = db.collection("settings").doc("config");

    let doc = await ref.get();

    let current = doc.exists ? doc.data().allowRegister : true;

    let newValue = !current;

    await ref.set({
      allowRegister: newValue
    });

    console.log("🔥 Registration now:", newValue);
    notify("Registration " + (newValue ? "enabled ✅" : "disabled ❌"));

  } catch (e) {
    console.error("❌ Toggle error:", e);
    notify("Toggle failed ❌");
  }
}

async function loadUsers() {
  let container = el("adminUsers");
  if (!container) return;

  let snapshot = await db.collection("users").get();

  container.innerHTML = "";

  snapshot.forEach(doc => {
    let u = doc.data();

    container.innerHTML += `
      <div class="card">
        ${u.email}
        <button onclick="deleteUser('${doc.id}')">Delete</button>
      </div>
    `;
  });
}

async function deleteUser(uid) {
  await db.collection("users").doc(uid).delete();
  notify("User removed ⚠");
  loadUsers();
}

async function loadRegistrationStatus() {
  let statusEl = el("regStatus");
  let toggle = el("regToggle");

  if (!statusEl || !toggle) return;

  let doc = await db.collection("settings").doc("config").get();

  let allowed = doc.exists ? doc.data().allowRegister : true;

  statusEl.innerText = "Status: " + (allowed ? "ON ✅" : "OFF ❌");
  toggle.checked = allowed;
}

async function toggleRegistrationSwitch() {
  let toggle = el("regToggle");

  let newValue = toggle.checked;

  await db.collection("settings").doc("config").set({
    allowRegister: newValue
  });

  loadRegistrationStatus();

  notify("Registration " + (newValue ? "enabled ✅" : "disabled ❌"));
}

// ===== LOAD =====
window.onload = async function () {
  loadCoins();
  loadUserRequests();
  loadAdminRequests();
  loadUsers();
  loadRegistrationStatus();
};
