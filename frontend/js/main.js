/**
 * Milo Radio - Main entry point (SPA Router)
 */

import { playerBar } from "./components/playerBar.js";
import { stationService } from "./services/stationServiceV5.js";

const API_AUTH_URL = "../backend/api/auth.php";
const appContent = document.getElementById("app-content");
const navList = document.getElementById("nav-list");

// Pages configuration
const pages = {
    radio: { title: "Radio", module: "radioPage", icon: "bi-play-circle" },
    genres: { title: "Genres", module: "genresPage", icon: "bi-tags" },
    stats: { title: "Meine Stats", module: "statsPage", icon: "bi-graph-up" },
    admin: { title: "Admin", module: "adminPage", icon: "bi-shield-lock", adminOnly: true },
    settings: { title: "Einstellungen", module: "settingsPage", icon: "bi-gear" }
};

// Navigation sequence for swipes
const pageSequence = ["radio", "genres", "stats", "admin", "settings"];

/**
 * Check if admin is logged in (synced with server)
 */
export function isAdmin() {
    return sessionStorage.getItem("isAdmin") === "true";
}

/**
 * Sync authentication state with server
 */
async function syncAuth() {
    try {
        const response = await fetch(API_AUTH_URL);
        const result = await response.json();
        if (result.success) {
            sessionStorage.setItem("isAdmin", "true");
        } else {
            sessionStorage.removeItem("isAdmin");
        }
    } catch (err) {
        console.error("Auth-Sync-Fehler:", err);
    }
}

/**
 * Create navigation links
 */
function renderNavbar() {
    navList.innerHTML = "";
    
    Object.keys(pages).forEach(key => {
        const page = pages[key];
        
        const li = document.createElement("li");
        li.className = "nav-item";
        
        const a = document.createElement("a");
        a.className = `nav-link ${window.location.hash === '#' + key || (!window.location.hash && key === 'radio') ? 'active' : ''}`;
        a.href = `#${key}`;
        a.innerHTML = `<span>${page.title}</span>`;
        
        a.onclick = (e) => {
            closeMobileNavbar();
            
            if (page.adminOnly && !isAdmin()) {
                e.preventDefault();
                handleAdminLogin(key);
            }
        };
        
        li.appendChild(a);
        navList.appendChild(li);
    });
}

/**
 * Handle Admin PIN Login
 */
export async function handleAdminLogin(targetPage) {
    const pin = prompt("Admin PIN eingeben:");
    if (!pin) return;

    try {
        const response = await fetch(API_AUTH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin })
        });
        const result = await response.json();

        if (result.success) {
            sessionStorage.setItem("isAdmin", "true");
            window.location.hash = targetPage;
            renderNavbar();
            router();
        } else {
            alert("Falscher PIN");
        }
    } catch (err) {
        console.error("Auth-Fehler:", err);
    }
}

/**
 * Router: Load page module based on hash
 */
async function router() {
    const hash = window.location.hash.substring(1) || "radio";
    const pageKey = pages[hash] ? hash : "radio";
    const page = pages[pageKey];

    // Check permissions
    if (page.adminOnly && !isAdmin()) {
        window.location.hash = "radio";
        return;
    }

    try {
        const module = await import(`./pages/${page.module}.js?v=28`);
        
        appContent.innerHTML = "";
        module.render(appContent);
        
        window.scrollTo({ top: 0, behavior: "instant" });
        renderNavbar();
        
    } catch (err) {
        console.error("Router error:", err);
        appContent.innerHTML = `
            <div class="alert alert-danger">
                <h4>Fehler beim Laden</h4>
                <p>Die Seite "${page.title}" konnte nicht geladen werden.</p>
                <button class="btn btn-primary" onclick="window.location.hash='radio'">Zurück zum Radio</button>
            </div>
        `;
    }
}

// --- Swipe Gestures Implementation ---
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function closeMobileNavbar() {
    const navbarCollapse = document.getElementById("navbarNav");
    if (navbarCollapse && typeof bootstrap !== "undefined") {
        const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
        if (bsCollapse && navbarCollapse.classList.contains("show")) {
            bsCollapse.hide();
        } else if (navbarCollapse.classList.contains("show")) {
            new bootstrap.Collapse(navbarCollapse).hide();
        }
    }
}

function handleSwipe() {
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    const edgeThreshold = window.innerWidth * 0.1;
    if (touchStartX < edgeThreshold || touchStartX > window.innerWidth - edgeThreshold) {
        return;
    }

    const isHorizontal = Math.abs(swipeDistanceX) > 50;
    const isStraight = Math.abs(swipeDistanceY) < 30;
    
    if (isHorizontal && isStraight) {
        const currentHash = window.location.hash.substring(1) || "radio";
        const currentIndex = pageSequence.indexOf(currentHash);
        
        if (swipeDistanceX > 0) {
            if (currentIndex < pageSequence.length - 1) {
                const nextHash = pageSequence[currentIndex + 1];
                window.location.hash = nextHash;
            }
        } else {
            if (currentIndex > 0) {
                const prevHash = pageSequence[currentIndex - 1];
                window.location.hash = prevHash;
            }
        }
    }
}

document.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

// App Initialization
async function initApp() {
    await syncAuth();
    await stationService.initPromise;

    playerBar.init();
    renderNavbar();
    router();
}

window.addEventListener("hashchange", router);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
