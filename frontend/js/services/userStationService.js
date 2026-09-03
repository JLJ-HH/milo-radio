/**
 * USERSTATIONSERVICE (userStationService.js)
 *
 * Verwaltet die Liste der Top 6 Favoriten des Nutzers.
 * Absolut robuster URL-Abgleich und synchrone Persistierung.
 */
class UserStationService {
  constructor() {
    this.events = {};
    this.stations = this.loadFromStorage();
  }

  /**
   * Hilfsfunktion: Bereinigt eine URL für verlässlichen Vergleich
   */
  normalizeUrl(url) {
    if (!url || typeof url !== "string") return "";
    return url.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
  }

  /**
   * Lädt die gewählten Sender des Nutzers aus dem Browser-Speicher (LocalStorage).
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem("userStations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 6);
        }
      }
    } catch (e) {
      console.warn("Fehler beim Laden der userStations:", e);
    }
    return [];
  }

  /**
   * Ersetzt die gesamte Liste der gewählten Sender und benachrichtigt die App.
   * @param {Array} list Neue Liste von Sendern
   */
  setStations(list) {
    this.stations = Array.isArray(list) ? list.slice(0, 6) : [];
    localStorage.setItem("userStations", JSON.stringify(this.stations));
    this.emit("update", this.stations);
  }

  /**
   * Fügt einen Sender ganz oben an (Position 1 / Index 0).
   * Falls bereits vorhanden, wird er an Position 1 verschoben.
   * Begrenzt die Liste automatisch auf maximal `maxLimit` (Standard: 6).
   * Ältere Sender am Ende der Liste fallen automatisch heraus.
   * @param {Object} station 
   * @param {number} maxLimit 
   */
  addStation(station, maxLimit = 6) {
    if (!station) return this.stations;
    const rawUrl = station.sender_Url || station.sender_url || station.url || "";
    const cleanUrl = this.normalizeUrl(rawUrl);
    if (!cleanUrl) return this.stations;

    // Aktuellen Stand laden
    this.stations = this.loadFromStorage();

    const normalizedStation = {
      ...station,
      sender_Url: rawUrl.trim(),
      sender_Name: station.sender_Name || station.sender_name || station.name || "Radio",
      sender_Logo: station.sender_Logo || station.sender_logo || station.logo || "./images/cholo_love.png",
      genre: station.genre || "Allgemein",
      now_playing_url: station.now_playing_url || station.nowPlayingUrl || ""
    };

    // 1. Vorheriges Vorkommen anhand normalisierter URL herausfiltern (verhindert Duplikate)
    const filtered = this.stations.filter((s) => {
      const sUrl = this.normalizeUrl(s.sender_Url || s.sender_url || s.url || "");
      return sUrl !== cleanUrl;
    });

    // 2. An Position 1 (Index 0) einfügen
    const updated = [normalizedStation, ...filtered];

    // 3. Auf maxLimit begrenzen (der älteste fällt hinten raus)
    const limited = updated.slice(0, maxLimit);

    // 4. Dauerhaft speichern & Event feuern
    this.setStations(limited);
    return limited;
  }

  /**
   * Gibt eine Kopie der aktuellen Benutzer-Senderliste zurück.
   */
  getStations() {
    this.stations = this.loadFromStorage();
    return [...this.stations];
  }

  // --- EVENT-STEUERUNG ---
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    // Asynchron via requestAnimationFrame / setTimeout, damit synchrone Klick-Handler nicht unterbrochen werden
    setTimeout(() => {
      if (this.events[event]) {
        this.events[event].forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error("Event Handler Fehler:", err);
          }
        });
      }
    }, 0);
  }
}

export const userStationService = new UserStationService();
