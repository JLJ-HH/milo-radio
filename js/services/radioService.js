// Klasse für einen einfachen Radio-Service
class RadioService {
    constructor() {
        this.audio = new Audio();      // Audio-Element für die Wiedergabe
        this.currentStation = null;    // aktuell abgespielte Radiostation (URL)
        this.events = {};              // Objekt für Event-Callbacks
    }

    // Wiedergabe starten oder zu einer neuen Station wechseln
    play(url) {
        if (!url && !this.currentStation) return;  // nichts tun, wenn keine Station vorhanden
        if (url) {
            this.audio.src = url;                  // Audio-Quelle setzen
            this.currentStation = url;             // aktuelle Station merken
        }
        this.audio.play().catch(err => this.emit('error', err)); // Wiedergabe starten, Fehler-Event senden
        this.emit('play', this.currentStation);   // play-Event auslösen
    }

    // Wiedergabe stoppen und zurücksetzen
    stop() {
        this.audio.pause();       // Audio pausieren
        this.audio.currentTime = 0; // auf Anfang zurücksetzen
        this.emit('stop');        // stop-Event auslösen
    }

    // Lautstärke setzen
    setVolume(value) {
        this.audio.volume = value;
        this.emit('volumeChange', value); // Event bei Lautstärkeänderung
    }

    // Aktuelle Lautstärke abrufen
    getVolume() {
        return this.audio.volume;
    }

    // Aktuelle Station abrufen
    getCurrentStation() {
        return this.currentStation;
    }

    // Event-Listener registrieren
    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    // Event-Listener entfernen
    off(event, callback) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    // Event auslösen und alle registrierten Callback-Funktionen aufrufen
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}

// Singleton-Instanz des RadioService exportieren
export const radioService = new RadioService();
