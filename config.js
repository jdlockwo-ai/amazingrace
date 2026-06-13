/* Horde Amazing Race Configuration
   1. Deploy Code.gs as a Google Apps Script Web App.
   2. Paste the Web App URL below.
   3. Commit this file with index.html, style.css, script.js, and assets/ to GitHub Pages.
*/

const APP_CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/AKfycbx04x8qJDZ7Ef3u8ElDMQOAPd1wzCuiP4DLrefx34F9EPVascZqr2RDw5B1EmLckJea/exec",

  EVENT_NAME: "TBC Classic Amazing Race",
  EVENT_TAGLINE: "Horde-only • Level 70 • Sequential checkpoint race",
  EVENT_DATE: "June 26th",
  EVENT_TIME: "6:00 PM Server Time",
  TEAM_SIZE: "3–5 players",
  FIRST_PRIZE: "1000g",
  SECOND_PRIZE: "500g",

  SHOW_PUBLIC_STATUS: true,
  AUTO_REFRESH_SECONDS: 20,

  BACKGROUNDS: [
    "assets/horde-bg-1.png",
    "assets/horde-bg-2.png",
    "assets/horde-bg-3.png"
  ],
  RANDOM_BACKGROUND: true
};
