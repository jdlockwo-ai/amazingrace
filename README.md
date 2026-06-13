# Vindictus Amazing Race Tracker

GitHub Pages front end + Google Apps Script / Google Sheets backend for a sequentially unlocked in-game Amazing Race competition.

## What is included

- `index.html` — main site
- `style.css` — Horde-themed visual styling and responsive layout
- `script.js` — team login, challenge loading, submission flow, leaderboard loading, and background selector
- `config.js` — event settings and Google Apps Script Web App URL
- `Code.gs` — Google Apps Script backend
- `assets/` — background images used by the site

## Background images

The site includes three background images:

- `assets/horde-bg-1.png`
- `assets/horde-bg-2.png`
- `assets/horde-bg-3.png`

The site randomly chooses a background on first load. Users can also switch backgrounds using the three small background buttons in the hero section. To change the default behavior, edit `BACKGROUND_MODE` in `config.js`.

```js
BACKGROUND_MODE: "random"
```

Options:

- `random` — randomly chooses one of the included images on first visit
- `first` — starts with the first image

## Setup overview

1. Create a new Google Sheet.
2. Open Extensions → Apps Script.
3. Paste the contents of `Code.gs` into Apps Script.
4. Run the setup function if included in the Apps Script file, or manually create the required tabs.
5. Deploy the Apps Script project as a Web App.
6. Copy the Web App URL.
7. Paste the URL into `config.js`:

```js
GAS_URL: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

8. Upload the full folder to GitHub.
9. Enable GitHub Pages for the repository.

## How the race works

Teams enter a team code. The website asks the Google Sheet backend what that team is allowed to see. The backend returns only the current unlocked checkpoint, so future challenge text is not exposed on the site.

After a team submits proof, the checkpoint status becomes pending. A judge reviews the submission in Google Sheets. Once approved, the next checkpoint unlocks.

