/**
 * SETTINGS PAGE MODULE (settingsPage.js)
 * 
 * General user settings and links to admin functions.
 */
import { isAdmin, handleAdminLogin } from "../main.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="fw-bold">Einstellungen</h2>
                <button class="btn btn-danger btn-sm rounded-pill px-4 ${isAdmin() ? "" : "d-none"}" id="logoutBtn">Abmelden</button>
            </div>

            <!-- Quick Navigation Menu -->
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
            
            <div class="card bg-dark border-secondary shadow p-4">
                <h5 class="card-title text-primary fw-bold mb-3">App-Informationen</h5>
                <div class="text-white-50">
                    <p class="mb-1">Milo Radio <span class="badge bg-primary ms-2">v5.2 Platinum</span></p>
                    <p class="small">© 2026 • Entwickelt für Premium Audio Erlebnisse.</p>
                </div>
                <hr class="border-secondary my-4">
                <div class="d-flex justify-content-between align-items-center">
                    <span>Admin-Funktionen</span>
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
}
