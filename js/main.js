/**
 * HAUPTLOGIK (main.js)
 *
 * Diese Datei steuert das Laden der Seiten, die Navigation
 * und die Authentifizierung für den Admin-Bereich.
 */

// ============================================================
// 1. GLOBALE VARIABLEN UND DOM-ELEMENTE
// ============================================================

// Adresse zur PHP-Schnittstelle für den Login
const API_URL = "./api/auth.php";

// Wo der Inhalt der Seiten eingefügt wird
const container = document.getElementById("content");

// Die Navigationsleiste (oben)
const nav = document.getElementById("navbar");

// ============================================================
// 2. ADMIN-STATUS UND AUTHENTIFIZIERUNG
// ============================================================

/**
 * Prüft, ob der Admin-Modus in der aktuellen Browser-Sitzung aktiv ist.
 */
function isAdmin() {
  return sessionStorage.getItem("isAdmin") === "true";
}

/**
 * Öffnet eine Abfrage für den Admin-PIN und prüft diesen über die API.
 */
async function askForAdminPin() {
  const pin = prompt("Admin PIN eingeben:");

  // Falls der Nutzer "Abbrechen" klickt
  if (pin === null) {
    return;
  }

  try {
    // Anfrage an den Server senden
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin }),
    });

    const result = await response.json();

    if (result.success) {
      // Login erfolgreich: Status im Browser merken
      sessionStorage.setItem("isAdmin", "true");
      alert("Admin-Modus aktiviert");
      loadPage("page2"); // Admin-Seite (Einstellugen) laden
    } else {
      alert("Falscher PIN");
    }
  } catch (err) {
    console.error("Auth-Fehler:", err);
    alert("Fehler bei der Anmeldung am Server");
  }
}

/**
 * Meldet den Admin ab und zerstört die Sitzung auf dem Server.
 */
async function logoutAdmin() {
  try {
    await fetch(API_URL, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Logout-Fehler:", err);
  }
  // Status im Browser löschen
  sessionStorage.removeItem("isAdmin");
  alert("Admin-Modus beendet");
  loadPage("page1"); // Zurück zum Radio-Player
}

// ============================================================
// 3. NAVIGATION (BUTTONS ERSTELLEN)
// ============================================================

/**
 * Erstellt die Buttons in der Haupt-Navigation (Radio, Genres, Einstellungen).
 */
function createNavButtons() {
  nav.innerHTML = "";

  // --- Button: RADIO ---
  const radioBtn = document.createElement("button");
  radioBtn.className = "btn btn-outline-primary me-2";
  radioBtn.textContent = "Radio";
  radioBtn.onclick = () => loadPage("page1");
  nav.appendChild(radioBtn);

  // --- Button: GENRES ---
  const genresBtn = document.createElement("button");
  genresBtn.className = "btn btn-outline-secondary me-2";
  genresBtn.textContent = "Genres";
  genresBtn.onclick = () => loadPage("page3");
  nav.appendChild(genresBtn);

  // --- Button: EINSTELLUNGEN (ADMIN) ---
  const settingsBtn = document.createElement("button");
  settingsBtn.className = "btn btn-outline-dark";
  settingsBtn.textContent = "Einstellungen";
  settingsBtn.onclick = () => {
    // Wenn bereits eingeloggt -> direkt zur Seite, sonst PIN abfragen
    if (isAdmin()) {
      loadPage("page2");
    } else {
      askForAdminPin();
    }
  };
  nav.appendChild(settingsBtn);
}

// ============================================================
// 4. SEITEN-LADESYSTEM (DYNAMISCH)
// ============================================================

/**
 * Lädt eine Seite (JS-Modul) dynamisch und zeigt sie im Container an.
 * @param {string} page Name der Seite (z.B. 'page1')
 */
async function loadPage(page) {
  try {
    // JavaScript-Datei der Seite laden
    const module = await import(`../pages/${page}.js`);

    // Alten Inhalt löschen und neuen Inhalt rendern
    container.innerHTML = "";
    module.render(container);

    // Die aktuell gewählte Seite merken (für Refresh/Neustart)
    sessionStorage.setItem("currentPage", page);
  } catch (err) {
    console.error("Fehler beim Laden der Seite:", err);
    container.innerHTML =
      '<p class="text-danger">Seite konnte nicht geladen werden.</p>';
  }
}

// ============================================================
// 5. INITIALISIERUNG BEIM START
// ============================================================

// Navigations-Leiste befüllen
createNavButtons();

// Zuletzt besuchte Seite wiederherstellen (oder standardmäßig page1 laden)
const savedPage = sessionStorage.getItem("currentPage") || "page1";
loadPage(savedPage);
