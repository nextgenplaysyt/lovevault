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
    await auth.createUserWithEmailAndPassword(email, password);
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
    console.error(e);
    notify("Error sending request ❌");
  }
}

async function loadUserRequests() {
  let container = el("userRequests");
  if (!container) return;

  try {
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

  } catch (e) {
    console.error(e);
    notify("Error loading requests ❌");
  }
}

async function cancelRequest(id) {
  try {
    await db.collection("requests").doc(id).delete();
    loadUserRequests();
  } catch (e) {
    console.error(e);
  }
}

async function loadAdminRequests() {
  let container = el("adminRequests");
  if (!container) return;

  try {
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

  } catch (e) {
    console.error(e);
  }
}

async function approveRequest(id) {
  try {
    await db.collection("requests").doc(id).update({ status: "approved" });
    loadAdminRequests();
  } catch (e) {
    console.error(e);
  }
}

async function completeRequest(id) {
  try {
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

  } catch (e) {
    console.error(e);
  }
}

async function deleteRequest(id) {
  try {
    await db.collection("requests").doc(id).delete();
    loadAdminRequests();
  } catch (e) {
    console.error(e);
  }
}

//
// ================= MESSAGES =================
//

async function showMessage() {
  let today = new Date().toISOString().split("T")[0];

  try {
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

  } catch (e) {
    console.error(e);
  }
}

function saveDailyMessage() {
  let date = el("msgDate")?.value;
  let text = el("msgText")?.value;
  let file = el("msgImage")?.files[0];

  if (!date || !text) return notify("Fill all fields");

  let reader = new FileReader();

  reader.onload = async function () {
    try {
      await db.collection("dailyMessages").doc(date).set({
        text,
        image: reader.result || null
      });

      notify("Saved ✅");
    } catch (e) {
      console.error(e);
    }
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
// ================= REGISTER CONTROL =================
//

function checkRegisterAllowed() {
  let btn = el("registerBtn");

  auth.onAuthStateChanged(user => {
    if (btn && user) {
      btn.style.display = "none";
    }
  });
}

// ===== LOAD =====
window.onload = async function () {
  checkRegisterAllowed();
  loadCoins();
  loadUserRequests();
  loadAdminRequests();
};
