// ===== SAFE ELEMENT HELPER =====
function el(id) {
  return document.getElementById(id);
}

// ===== INIT STORAGE =====
if (!localStorage.getItem("requests")) {
  localStorage.setItem("requests", JSON.stringify([]));
}
if (!localStorage.getItem("dailyMessages")) {
  localStorage.setItem("dailyMessages", JSON.stringify({}));
}
if (!localStorage.getItem("coins")) {
  localStorage.setItem("coins", "0");
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

// ===== DAILY MESSAGE =====
function showMessage() {
  let today = new Date().toISOString().split("T")[0];
  let messages = JSON.parse(localStorage.getItem("dailyMessages"));

  let msg = messages[today];

  if (!el("dailyMessage")) return;

  if (!msg) {
    el("dailyMessage").innerText = "No message today 💭";
    return;
  }

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

  reader.onload = function () {
    let messages = JSON.parse(localStorage.getItem("dailyMessages"));

    messages[date] = {
      text,
      image: reader.result || null
    };

    localStorage.setItem("dailyMessages", JSON.stringify(messages));

    if (el("msgStatus")) el("msgStatus").innerText = "Saved ✅";
    loadSavedMessages();
  };

  if (file) reader.readAsDataURL(file);
  else reader.onload();
}

// ===== LOAD SAVED MESSAGES =====
function loadSavedMessages() {
  let container = el("savedMessages");
  if (!container) return;

  let messages = JSON.parse(localStorage.getItem("dailyMessages"));

  let keys = Object.keys(messages);

  if (keys.length === 0) {
    container.innerHTML = "<p style='opacity:0.6;'>No messages yet...</p>";
    return;
  }

  container.innerHTML = "";

  keys.forEach(date => {
    let m = messages[date];

    container.innerHTML += `
      <div class="card">
        <strong>${date}</strong><br>
        ${m.text}<br>
        ${m.image ? `<img src="${m.image}" width="100">` : ""}
      </div>
    `;
  });
}

// ===== SEND REQUEST =====
function sendRequest() {
  let name = el("reqName")?.value;
  let cost = el("reqCost")?.value;

  if (!name || !cost) return notify("Fill all fields");

  let reqs = JSON.parse(localStorage.getItem("requests"));

  let exists = reqs.find(r =>
    r.name === name &&
    (r.status === "pending" || r.status === "approved")
  );

  if (exists) return notify("Already requested ⛔");

  reqs.push({
    id: Date.now(),
    name,
    cost,
    status: "pending"
  });

  localStorage.setItem("requests", JSON.stringify(reqs));
  loadUserRequests();
  notify("Request sent 💌");
}

// ===== USER REQUESTS =====
function loadUserRequests() {
  let container = el("userRequests");
  if (!container) return;

  let reqs = JSON.parse(localStorage.getItem("requests"));

  if (reqs.length === 0) {
    container.innerHTML = "<p style='opacity:0.6;'>No requests yet...</p>";
    return;
  }

  container.innerHTML = "";

  reqs.forEach(r => {
    container.innerHTML += `
    <div class="card">
      ${r.name} - ${r.cost} 🪙
      <br>Status: ${r.status}
      ${
        r.status === "pending"
          ? `<button onclick="cancelRequest(${r.id})">Cancel</button>`
          : ""
      }
    </div>`;
  });
}

// ===== CANCEL =====
function cancelRequest(id) {
  let reqs = JSON.parse(localStorage.getItem("requests"));
  reqs = reqs.filter(r => !(r.id === id && r.status === "pending"));
  localStorage.setItem("requests", JSON.stringify(reqs));
  loadUserRequests();
}

// ===== ADMIN REQUESTS =====
function loadAdminRequests() {
  let container = el("adminRequests");
  if (!container) return;

  let reqs = JSON.parse(localStorage.getItem("requests"));

  if (reqs.length === 0) {
    container.innerHTML = "<p style='opacity:0.6;'>No requests yet...</p>";
    return;
  }

  container.innerHTML = "";

  reqs.forEach(r => {
    container.innerHTML += `
    <div class="card">
      ${r.name} - ${r.cost} 🪙
      <br>Status: ${r.status}

      ${
        r.status === "pending"
          ? `<button onclick="approveRequest(${r.id})">Approve</button>`
          : ""
      }

      ${
        r.status === "approved"
          ? `<button onclick="completeRequest(${r.id})">Complete</button>`
          : ""
      }

      <button onclick="deleteRequest(${r.id})">Delete</button>
    </div>`;
  });
}

// ===== APPROVE =====
function approveRequest(id) {
  let reqs = JSON.parse(localStorage.getItem("requests"));

  reqs = reqs.map(r => {
    if (r.id === id) r.status = "approved";
    return r;
  });

  localStorage.setItem("requests", JSON.stringify(reqs));
  loadAdminRequests();
  notify("Approved ✅");
}

// ===== COMPLETE =====
function completeRequest(id) {
  let reqs = JSON.parse(localStorage.getItem("requests"));

  reqs = reqs.map(r => {
    if (r.id === id) {
      r.status = "completed";

      let coins = parseInt(localStorage.getItem("coins"));
      coins -= parseInt(r.cost);
      localStorage.setItem("coins", coins);
    }
    return r;
  });

  localStorage.setItem("requests", JSON.stringify(reqs));
  loadAdminRequests();
  notify("Completed ✔");
}

// ===== DELETE =====
function deleteRequest(id) {
  let reqs = JSON.parse(localStorage.getItem("requests"));
  reqs = reqs.filter(r => r.id !== id);
  localStorage.setItem("requests", JSON.stringify(reqs));
  loadAdminRequests();
}

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
window.onload = function () {

  testFirebase(); // 🔥 ADD THIS LINE

  let coinEl = document.getElementById("coinCount");
  if (coinEl) coinEl.innerText = localStorage.getItem("coins");

  loadUserRequests();
  loadAdminRequests();
  loadSavedMessages();
};