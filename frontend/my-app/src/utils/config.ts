// src/utils/config.ts

let API_URL = "";

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  // Dev desktop
  API_URL = "http://localhost:8000/api";
} else if (window.location.hostname.startsWith("192.168.")) {
  // LAN access from phone
  API_URL = `http://${window.location.hostname}:8000/api`;
} else {
  // ngrok or deployed environment
  API_URL = "https://0ca4f2492036.ngrok-free.app/api";
}

export default API_URL;
