/**
 * RADIOSERVICE (radioService.js)
 *
 * Diese Klasse kümmert sich um die eigentliche Audio-Wiedergabe.
 * Sie steuert das Abspielen, Stoppen und die Lautstärke.
 */
class RadioService {
  constructor() {
    // Das Standard-Browser-Element für Audio-Wiedergabe
    this.audio = new Audio();
    // Merkt sich die URL der aktuellen Station
    this.currentStation = null;
    // Speichert Callback-Funktionen für Events (z.B. wenn Musik startet)
    this.events = {};
  }

  /**
   * Startet die Wiedergabe einer Stream-URL.
   * @param {string} url Die Stream-Adresse des Radiosenders
   */
  play(url) {
    // Falls keine URL übergeben wurde und keine gespeichert ist -> Abbruch
    if (!url && !this.currentStation) return;

    if (url) {
      this.audio.src = url; // Neue Stream-Quelle setzen
      this.currentStation = url; // Station merken
      // Letzte Station im Browser-Speicher sichern (für Neustart)
      localStorage.setItem("lastStationUrl", url);
    }

    // Status "spielt gerade" merken
    localStorage.setItem("isPlaying", "true");

    // Wiedergabe starten (asynchron)
    this.audio.play().catch((err) => {
      console.error("Audio-Fehler:", err);
      this.emit("error", err);
    });

    // Event auslösen, dass die Wiedergabe läuft
    this.emit("play", this.currentStation);
  }

  /**
   * Stoppt die Wiedergabe komplett.
   */
  stop() {
    this.audio.pause(); // Wiedergabe pausieren
    this.audio.currentTime = 0; // "Nadel" auf Anfang (wichtig bei Dateien, weniger bei Streams)
    localStorage.setItem("isPlaying", "false");
    this.emit("stop"); // Event auslösen, dass gestoppt wurde
  }

  /**
   * Setzt die Lautstärke (Wert zwischen 0.0 und 1.0).
   */
  setVolume(value) {
    this.audio.volume = value;
    this.emit("volumeChange", value);
  }

  getVolume() {
    return this.audio.volume;
  }

  getCurrentStation() {
    return this.currentStation;
  }

  // --- EVENT-SYSTEM (Hintergrund-Kommunikation) ---

  // Registriert eine Funktion, die bei einem Ereignis (z.B. 'play') ausgeführt wird
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  // Entfernt eine zuvor registrierte Funktion
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  // Löst ein Ereignis aus und benachrichtigt alle angemeldeten Funktionen
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((cb) => cb(data));
  }
}

// Wir exportieren eine einzige Instanz (Singleton), damit alle Seiten
// dasselbe Radio-Objekt benutzen.
export const radioService = new RadioService();
