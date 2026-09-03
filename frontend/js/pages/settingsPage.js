/**
 * SETTINGS PAGE MODULE (settingsPage.js)
 * 
 * Allgemeine Einstellungen, Impressum, Datenschutz & Cache-Verwaltung.
 */
import { isAdmin, handleAdminLogin } from "../main.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white pb-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="fw-bold mb-0">Einstellungen</h2>
                    <p class="text-white-50 small mb-0">App-Verwaltung, Datenschutz & Schnellzugriff.</p>
                </div>
                <button class="btn btn-danger btn-sm rounded-pill px-4 ${isAdmin() ? "" : "d-none"}" id="logoutBtn">Abmelden</button>
            </div>

            <!-- Schnellzugriff -->
            <div class="card bg-dark border-secondary shadow p-4 mb-4">
                <h5 class="card-title text-primary fw-bold mb-4">Schnellzugriff</h5>
                <div class="row g-3">
                    <div class="col-6 col-md-3">
                        <a href="#radio" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2 rounded-4">
                            <i class="bi bi-play-circle fs-3"></i>
                            <span>Radio</span>
                        </a>
                    </div>
                    <div class="col-6 col-md-3">
                        <a href="#genres" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2 rounded-4">
                            <i class="bi bi-tags fs-3"></i>
                            <span>Genres</span>
                        </a>
                    </div>
                    <div class="col-6 col-md-3">
                        <a href="#stats" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2 rounded-4">
                            <i class="bi bi-graph-up fs-3"></i>
                            <span>Meine Stats</span>
                        </a>
                    </div>
                    <div class="col-6 col-md-3">
                        <a href="#admin" class="btn btn-outline-primary w-100 py-3 d-flex flex-column align-items-center gap-2 rounded-4 border-2">
                            <i class="bi bi-shield-lock-fill fs-3"></i>
                            <span>Admin-Panel</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- App-Wartung & Cache -->
            <div class="card bg-dark border-secondary shadow p-4 mb-4">
                <h5 class="card-title text-primary fw-bold mb-3">Wartung & Aktualisierung</h5>
                <p class="text-white-50 small mb-3">Falls Sender nicht laden oder Updates nicht sofort sichtbar sind, kannst du den lokalen App-Cache hier mit einem Klick leeren.</p>
                <div>
                    <button id="settingsResetCacheBtn" class="btn btn-outline-warning rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2">
                        <i class="bi bi-arrow-repeat"></i> <span>App aktualisieren / Cache leeren</span>
                    </button>
                </div>
            </div>
            
            <!-- Rechtliches & Impressum -->
            <div class="card bg-dark border-secondary shadow p-4 mb-4">
                <h5 class="card-title text-primary fw-bold mb-3">Rechtliches & Information</h5>
                <p class="text-white-50 small mb-3">Milo Radio ist ein rein privates, nicht-kommerzielles Radioprojekt.</p>
                <div class="d-flex flex-wrap gap-2">
                    <button class="btn btn-outline-info rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#privacyModal">
                        <i class="bi bi-shield-check"></i> <span>Impressum & Datenschutz</span>
                    </button>
                </div>
            </div>

            <!-- App-Info & Admin -->
            <div class="card bg-dark border-secondary shadow p-4">
                <h5 class="card-title text-primary fw-bold mb-3">App-Informationen</h5>
                <div class="text-white-50">
                    <p class="mb-1">Milo Radio <span class="badge bg-primary ms-2">v1.4.9 Premium</span></p>
                    <p class="small">© 2026 • Entwickelt für erstklassige Audio-Erlebnisse.</p>
                </div>
                <hr class="border-secondary my-4">
                <div class="d-flex justify-content-between align-items-center">
                    <span>Admin-Zugang</span>
                    ${
                      isAdmin()
                        ? '<a href="#admin" class="btn btn-primary px-4 rounded-pill fw-bold">Zum Panel</a>'
                        : '<button class="btn btn-outline-primary px-4 rounded-pill" id="loginBtn">Login</button>'
                    }
                </div>
            </div>
        </div>
    `;

  const loginBtn = container.querySelector("#loginBtn");
  if (loginBtn) {
    loginBtn.onclick = () => handleAdminLogin("admin");
  }

  const logoutBtn = container.querySelector("#logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      sessionStorage.removeItem("isAdmin");
      window.location.hash = "radio";
      window.location.reload();
    };
  }

  const resetBtn = container.querySelector("#settingsResetCacheBtn");
  if (resetBtn) {
    resetBtn.onclick = async () => {
      resetBtn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> <span>Wird aktualisiert...</span>';
      try {
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
        localStorage.removeItem("userStations");
        sessionStorage.clear();
      } catch (e) {
        console.warn("Reset Fehler:", e);
      }
      window.location.href = window.location.pathname + "?updated=" + Date.now();
    };
  }
}
