/**
 * USERSTATIONSERVICE (userStationService.js)
 *
 * Dieser Dienst verwaltet die Liste der Sender, die sich der
 * aktuelle Benutzer für seinen Player ausgesucht hat.
 */
class UserStationService {
  constructor() {
    // Liste der vom Nutzer gewählten Sender beim Start laden
    this.stations = this.loadFromStorage();
    // Speicher für Event-Callbacks (z.B. UI aktualisieren bei Änderung)
    this.events = {};
  }

  /**
   * Lädt die gewählten Sender des Nutzers aus dem Browser-Speicher (LocalStorage).
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem("userStations");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Fehler beim Laden der userStations:", e);
      return [];
    }
  }

  /**
   * Ersetzt die gesamte Liste der gewählten Sender und benachrichtigt die App.
   * @param {Array} list Neue Liste von Sendern
   */
  setStations(list) {
    // Sicherheitskopie erstellen
    this.stations = [...list];
    // Im Browser-Speicher dauerhaft sichern
    localStorage.setItem("userStations", JSON.stringify(this.stations));
    // Allen Seiten sagen: "Die Liste hat sich geändert!"
    this.emit("update", this.stations);
  }

  /**
   * Gibt eine Kopie der aktuellen Benutzer-Senderliste zurück.
   */
  getStations() {
    return [...this.stations];
  }

  // --- EVENT-STEUERUNG ---

  // Hiermit können sich Komponenten (wie page1.js) für Updates anmelden
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  // Abmeldung von Updates
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  // Löst die Benachrichtigung aus
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((cb) => cb(data));
  }
}

// Singleton-Instanz exportieren
export const userStationService = new UserStationService();
