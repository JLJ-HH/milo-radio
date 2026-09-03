/**
 * USERSTATIONSERVICE (userStationService.js)
 *
 * Verwaltet die Top 6 Favoriten des Nutzers mit fest integrierten Default-Sendern.
 */
const DEFAULT_TOP6_STATIONS = [
  {
    sender_Name: "Cumbias Inmortales / Monterrey",
    sender_Url: "https://ssl.nexuscast.com:9046/;",
    sender_Logo: "./images/cholo_love.png",
    genre: "Cumbia",
    now_playing_url: ""
  },
  {
    sender_Name: "Salsamania - Salsa Radio - 24/7",
    sender_Url: "https://stream.laut.fm/salsamania",
    sender_Logo: "./images/cholo_love.png",
    genre: "Salsa",
    now_playing_url: ""
  },
  {
    sender_Name: "Jazz / Hamburg",
    sender_Url: "https://stream.laut.fm/jazz",
    sender_Logo: "./images/cholo_love.png",
    genre: "Jazz",
    now_playing_url: ""
  },
  {
    sender_Name: "Sensimedia - Hip Hop Radio / USA",
    sender_Url: "https://stream.laut.fm/sensimedia-hiphop",
    sender_Logo: "./images/cholo_love.png",
    genre: "Hip Hop",
    now_playing_url: ""
  },
  {
    sender_Name: "Solo Merengue",
    sender_Url: "https://stream.laut.fm/solomerengue",
    sender_Logo: "./images/cholo_love.png",
    genre: "Merengue",
    now_playing_url: ""
  },
  {
    sender_Name: "Latina Bachata",
    sender_Url: "https://stream.laut.fm/latinabachata",
    sender_Logo: "./images/cholo_love.png",
    genre: "Bachata",
    now_playing_url: ""
  }
];

class UserStationService {
  constructor() {
    this.events = {};
    this.stations = this.loadFromStorage();
  }

  normalizeUrl(url) {
    if (!url || typeof url !== "string") return "";
    return url.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem("userStations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (s) => s && typeof s === "object" && (s.sender_Url || s.sender_url || s.url)
          );
          if (valid.length > 0) {
            return valid.slice(0, 6);
          }
        }
      }
    } catch (e) {
      console.warn("Fehler beim Laden der userStations:", e);
    }

    // Wenn leer: Standard-Sender setzen und dauerhaft speichern
    localStorage.setItem("userStations", JSON.stringify(DEFAULT_TOP6_STATIONS));
    return [...DEFAULT_TOP6_STATIONS];
  }

  setStations(list) {
    const valid = Array.isArray(list)
      ? list
          .filter((s) => s && typeof s === "object" && (s.sender_Url || s.sender_url || s.url))
          .slice(0, 6)
      : [];
    this.stations = valid.length > 0 ? valid : [...DEFAULT_TOP6_STATIONS];
    localStorage.setItem("userStations", JSON.stringify(this.stations));
    this.emit("update", this.stations);
  }

  addStation(station, maxLimit = 6) {
    if (!station || typeof station !== "object") return this.getStations();
    const rawUrl = station.sender_Url || station.sender_url || station.url || "";
    const cleanUrl = this.normalizeUrl(rawUrl);
    if (!cleanUrl) return this.getStations();

    this.stations = this.loadFromStorage();

    const normalizedStation = {
      ...station,
      sender_Url: rawUrl.trim(),
      sender_Name: station.sender_Name || station.sender_name || station.name || "Radio",
      sender_Logo: station.sender_Logo || station.sender_logo || station.logo || "./images/cholo_love.png",
      genre: station.genre || "Allgemein",
      now_playing_url: station.now_playing_url || station.nowPlayingUrl || ""
    };

    const filtered = this.stations.filter((s) => {
      if (!s || typeof s !== "object") return false;
      const sUrl = this.normalizeUrl(s.sender_Url || s.sender_url || s.url || "");
      return sUrl !== cleanUrl;
    });

    const updated = [normalizedStation, ...filtered].slice(0, maxLimit);

    this.setStations(updated);
    return updated;
  }

  getStations() {
    this.stations = this.loadFromStorage();
    return [...this.stations];
  }

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
