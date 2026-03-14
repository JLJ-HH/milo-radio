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
    stats: { title: "Statistiken", module: "statsPage", icon: "bi-graph-up" },
    settings: { title: "Einstellungen", module: "settingsPage", icon: "bi-gear", adminOnly: true }
};

/**
 * Check if admin is logged in
 */
function isAdmin() {
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
async function handleAdminLogin(targetPage) {
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

// Event Listeners
window.addEventListener("hashchange", router);
window.addEventListener("load", () => {
    renderNavbar();
    router();
});
