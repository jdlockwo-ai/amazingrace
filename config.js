/* Vindictus Amazing Race Configuration
   1. Deploy Code.gs as a Google Apps Script Web App.
   2. Paste the Web App URL below.
   3. Commit this file with index.html, style.css, and script.js to GitHub Pages.
*/

const APP_CONFIG = {
  // Paste your deployed Google Apps Script Web App URL here.
  GAS_URL: "https://script.google.com/macros/s/AKfycbySPWuEQNXDS46lvxMeAhLYFdatqyX7EbZk__mw5vqjyByfCdCYS8YPKFCy9rKBLdiL/exec",

  EVENT_NAME: "Vindictus Amazing Race",
  EVENT_DATE: "June 26th",
  EVENT_TIME: "6:00 PM Server Time",
  TEAM_SIZE: "3–5 players",
  FIRST_PRIZE: "1000g",
  SECOND_PRIZE: "500g",

  // true = show a limited public status board. false = hide it during the race.
  SHOW_PUBLIC_STATUS: true,

  // How often the page refreshes team status while a submission is pending.
  AUTO_REFRESH_SECONDS: 20,

  // Site background images stored in the assets folder.
  BACKGROUND_IMAGES: [
    "assets/horde-bg-1.png",
    "assets/horde-bg-2.png",
    "assets/horde-bg-3.png"
  ],

  // Options: "random", "first". Users can also switch backgrounds on the page.
  BACKGROUND_MODE: "random"
};
