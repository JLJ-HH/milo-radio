// ===============================
// DOM ELEMENTE
// ===============================
const container = document.getElementById("content");
const nav = document.getElementById("navbar");

// ===============================
// ADMIN KONFIGURATION
// ===============================
const ADMIN_PIN = "Luisemilio_333";

// ===============================
// ADMIN STATUS
// ===============================
function isAdmin() {
  return sessionStorage.getItem("isAdmin") === "true";
}

function askForAdminPin() {
  const pin = prompt("Admin PIN eingeben:");

  // Prüfen, ob der Nutzer abgebrochen hat
  if (pin === null) {
    return; // einfach nichts machen
  }

  if (pin === ADMIN_PIN) {
    sessionStorage.setItem("isAdmin", "true");
    alert("Admin-Modus aktiviert");
    loadPage("page2");
  } else {
    alert("Falscher PIN");
  }
}

// Optional: Admin Logout (kann später genutzt werden)
function logoutAdmin() {
  sessionStorage.removeItem("isAdmin");
  alert("Admin-Modus beendet");
  loadPage("page1");
}

// ===============================
// NAVBAR ERSTELLEN
// ===============================
function createNavButtons() {
    nav.innerHTML = '';

    // --- RADIO ---
    const radioBtn = document.createElement('button');
    radioBtn.className = 'btn btn-outline-primary me-2';
    radioBtn.textContent = 'Radio';
    radioBtn.onclick = () => loadPage('page1');
    nav.appendChild(radioBtn);

    // --- GENRES ---
    const genresBtn = document.createElement('button');
    genresBtn.className = 'btn btn-outline-secondary me-2';
    genresBtn.textContent = 'Genres';
    genresBtn.onclick = () => loadPage('page3');
    nav.appendChild(genresBtn);

    // --- EINSTELLUNGEN (ADMIN) ---
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn-outline-dark';
    settingsBtn.textContent = 'Einstellungen';
    settingsBtn.onclick = () => {
        if (isAdmin()) {
            loadPage('page2');
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
loadPage("page1");
