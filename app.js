// ===== SAFE ELEMENT HELPER =====
function el(id) {
  return document.getElementById(id);
}

// ===== NAVIGATION =====
function goTo(page) {
  document.body.style.opacity = "0";
  setTimeout(() => window.location.href = page, 200);
}

// ===== LOGIN =====
function login() {
  let u = el("username")?.value;
  let p = el("password")?.value;

  if (u === "admin" && p === "1234") {
    goTo("admin.html");
    return;
  }

  let user = JSON.parse(localStorage.getItem("userData"));

  if (user && u === user.username && p === user.password) {
    if (el("rememberMe")?.checked) {
      localStorage.setItem("savedUser", "user");
    }
    goTo("home.html");
    return;
  }

  if (el("loginNotice")) el("loginNotice").innerText = "Invalid ❌";
}

// ===== REGISTER =====
function register() {
  let u = el("username")?.value;
  let p = el("password")?.value;

  if (!u || !p) return notify("Fill all fields");

  localStorage.setItem("userData", JSON.stringify({ username: u, password: p }));
  notify("Registered ✅");
}

// ===== NOTIFY =====
function notify(text) {
  let n = document.createElement("div");
  n.className = "toast";
  n.innerText = text;
  document.body.appendChild(n);

  setTimeout(() => {
    n.style.opacity = "0";
    setTimeout(() => n.remove(), 300);
  }, 2500);
}

//
// ===================== FIREBASE REQUEST SYSTEM =====================
//

// ===== SEND REQUEST =====
async function sendRequest() {
  let name = el("reqName")?.value;
  let cost = el("reqCost")?.value;

  if (!name || !cost) return notify("Fill all fields");

  await db.collection("requests").add({
    name,
    cost,
    status: "pending",
    time: Date.now()
  });

  notify("Request sent 💌");
  loadUserRequests();
}

// ===== USER REQUESTS =====
async function loadUserRequests() {
  let container = el("userRequests");
  if (!container) return;

  let snapshot = await db.collection("requests").orderBy("time", "desc").get();

  if (snapshot.empty) {
    container.innerHTML = "<p style='opacity:0.6;'>No requests yet...</p>";
    return;
  }

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

// ===== CANCEL =====
async function cancelRequest(id) {
  await db.collection("requests").doc(id).delete();
  loadUserRequests();
}

// ===== ADMIN REQUESTS =====
async function loadAdminRequests() {
  let container = el("adminRequests");
  if (!container) return;

  let snapshot = await db.collection("requests").orderBy("time", "desc").get();

  if (snapshot.empty) {
    container.innerHTML = "<p style='opacity:0.6;'>No requests yet...</p>";
    return;
  }

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

// ===== APPROVE =====
async function approveRequest(id) {
  await db.collection("requests").doc(id).update({
    status: "approved"
  });

  notify("Approved ✅");
  loadAdminRequests();
}

// ===== COMPLETE =====
async function completeRequest(id) {
  let doc = await db.collection("requests").doc(id).get();
  let cost = doc.data().cost;

  let coins = await getCoins();
  coins -= parseInt(cost);

  await setCoins(coins);

  await db.collection("requests").doc(id).update({
    status: "completed"
  });

  notify("Completed ✔");
  loadAdminRequests();
  loadCoins();
}

// ===== DELETE =====
async function deleteRequest(id) {
  await db.collection("requests").doc(id).delete();
  loadAdminRequests();
}

//
// ===================== FIREBASE MESSAGES =====================
//

// ===== SHOW MESSAGE =====
async function showMessage() {
  let today = new Date().toISOString().split("T")[0];

  let doc = await db.collection("dailyMessages").doc(today).get();

  if (!el("dailyMessage")) return;

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

// ===== SAVE MESSAGE =====
function saveDailyMessage() {
  let date = el("msgDate")?.value;
  let text = el("msgText")?.value;
  let file = el("msgImage")?.files[0];

  if (!date || !text) return notify("Fill all fields");

  let reader = new FileReader();

  reader.onload = async function () {
    await db.collection("dailyMessages").doc(date).set({
      text,
      image: reader.result || null
    });

    el("msgStatus").innerText = "Saved ✅";
    loadSavedMessages();
  };

  if (file) reader.readAsDataURL(file);
  else reader.onload();
}

// ===== LOAD SAVED =====
async function loadSavedMessages() {
  let container = el("savedMessages");
  if (!container) return;

  let snapshot = await db.collection("dailyMessages").get();

  if (snapshot.empty) {
    container.innerHTML = "<p style='opacity:0.6;'>No messages yet...</p>";
    return;
  }

  container.innerHTML = "";

  snapshot.forEach(doc => {
    let m = doc.data();

    container.innerHTML += `
      <div class="card">
        <strong>${doc.id}</strong><br>
        ${m.text}<br>
        ${m.image ? `<img src="${m.image}" width="100">` : ""}
      </div>
    `;
  });
}

//
// ===================== FIREBASE COINS =====================
//

// ===== GET COINS =====
async function getCoins() {
  let doc = await db.collection("coins").doc("main").get();

  if (!doc.exists) {
    await db.collection("coins").doc("main").set({ value: 0 });
    return 0;
  }

  return doc.data().value;
}

// ===== SET COINS =====
async function setCoins(value) {
  await db.collection("coins").doc("main").set({
    value
  });
}

// ===== LOAD COINS =====
async function loadCoins() {
  let coinEl = el("coinCount");
  if (!coinEl) return;

  let coins = await getCoins();
  coinEl.innerText = coins;
}

//
// ===================== TEST =====================
//

async function testFirebase() {
  try {
    await db.collection("test").add({
      message: "LoveVault working",
      time: Date.now()
    });
    console.log("Firebase connected ✅");
  } catch (e) {
    console.error("Firebase error ❌", e);
  }
}

// ===== AUTO LOAD =====
window.onload = async function () {

  testFirebase();

  await loadCoins();
  loadUserRequests();
  loadAdminRequests();
  loadSavedMessages();
};