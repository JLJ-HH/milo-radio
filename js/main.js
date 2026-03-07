// ===============================
// DOM ELEMENTE
// ===============================
// API Base URL
const API_URL = "./api/auth.php";
const container = document.getElementById("content");
const nav = document.getElementById("navbar");

// ===============================
// ADMIN STATUS
// ===============================
function isAdmin() {
  return sessionStorage.getItem("isAdmin") === "true";
}

async function askForAdminPin() {
  const pin = prompt("Admin PIN eingeben:");

  // Prüfen, ob der Nutzer abgebrochen hat
  if (pin === null) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin }),
    });

    const result = await response.json();

    if (result.success) {
      sessionStorage.setItem("isAdmin", "true");
      alert("Admin-Modus aktiviert");
      loadPage("page2");
    } else {
      alert("Falscher PIN");
    }
  } catch (err) {
    console.error("Auth-Fehler:", err);
    alert("Authentifizierungsfehler");
  }
}

// Admin Logout
async function logoutAdmin() {
  try {
    await fetch(API_URL, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Logout-Fehler:", err);
  }
  sessionStorage.removeItem("isAdmin");
  alert("Admin-Modus beendet");
  loadPage("page1");
}

// ===============================
// NAVBAR ERSTELLEN
// ===============================
function createNavButtons() {
  nav.innerHTML = "";

  // --- RADIO ---
  const radioBtn = document.createElement("button");
  radioBtn.className = "btn btn-outline-primary me-2";
  radioBtn.textContent = "Radio";
  radioBtn.onclick = () => loadPage("page1");
  nav.appendChild(radioBtn);

  // --- GENRES ---
  const genresBtn = document.createElement("button");
  genresBtn.className = "btn btn-outline-secondary me-2";
  genresBtn.textContent = "Genres";
  genresBtn.onclick = () => loadPage("page3");
  nav.appendChild(genresBtn);

  // --- EINSTELLUNGEN (ADMIN) ---
  const settingsBtn = document.createElement("button");
  settingsBtn.className = "btn btn-outline-dark";
  settingsBtn.textContent = "Einstellungen";
  settingsBtn.onclick = () => {
    if (isAdmin()) {
      loadPage("page2");
    } else {
      askForAdminPin();
    }
  };
  nav.appendChild(settingsBtn);
}

// ===============================
// SEITEN LADEN
// ===============================
async function loadPage(page) {
  try {
    const module = await import(`../pages/${page}.js`);
    container.innerHTML = "";
    module.render(container);
    sessionStorage.setItem("currentPage", page);
  } catch (err) {
    console.error("Fehler beim Laden der Seite:", err);
    container.innerHTML =
      '<p class="text-danger">Seite konnte nicht geladen werden.</p>';
  }
}

// ===============================
// INITIALISIERUNG
// ===============================
createNavButtons();
const savedPage = sessionStorage.getItem("currentPage") || "page1";
loadPage(savedPage);
