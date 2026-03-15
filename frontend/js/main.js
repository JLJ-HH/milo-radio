/**
 * Milo Radio - Main entry point (SPA Router)
 */

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
 * Check if admin is logged in
 */
export function isAdmin() {
    return sessionStorage.getItem("isAdmin") === "true";
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
        a.className = `nav-link ${window.location.hash === '#' + key ? 'active' : ''}`;
        a.href = `#${key}`;
        a.innerHTML = `<span>${page.title}</span>`;
        
        a.onclick = (e) => {
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
            // Immediate UI update
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
        // Dynamic import of the page module
        const module = await import(`./pages/${page.module}.js?v=${Date.now()}`);
        
        appContent.innerHTML = "";
        module.render(appContent);
        
        // Update active state in navbar
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

function handleSwipe() {
    const swipeDistanceX = touchEndX - touchStartX;
    const swipeDistanceY = touchEndY - touchStartY;
    
    // Check if horizontal swipe is dominant and significant
    if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) && Math.abs(swipeDistanceX) > 70) {
        const currentHash = window.location.hash.substring(1) || "radio";
        const currentIndex = pageSequence.indexOf(currentHash);
        
        if (swipeDistanceX > 0) {
            // Swipe Right -> Next Page (Radio -> Genres)
            if (currentIndex < pageSequence.length - 1) {
                const nextHash = pageSequence[currentIndex + 1];
                window.location.hash = nextHash;
            }
        } else {
            // Swipe Left -> Previous Page (Genres -> Radio)
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
}, { passive: true });

// Event Listeners
window.addEventListener("hashchange", router);
window.addEventListener("load", () => {
    renderNavbar();
    router();
});
