# TBC Classic Amazing Race Tracker

GitHub Pages static site + Google Apps Script / Google Sheets backend for a Horde-only TBC Classic Amazing Race event.

## Features

- Team-code access
- Sequential checkpoint unlocks
- Future challenge text hidden until the prior checkpoint is approved
- Clue-based checkpoint text with judge-only answers in the spreadsheet
- Hint 1 / Hint 2 buttons
- Automatic hint penalties: Hint 1 = +2 minutes, Hint 2 = +5 minutes
- Race timer starts when Checkpoint 1 is first submitted
- Race timer stops when Checkpoint 14 is approved
- Checkpoint 15 reveals Gurubashi Arena only after Checkpoint 14 is approved
- Public team status board with race time, penalties, and adjusted time

## Setup

1. Create a Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `Code.gs` into Apps Script.
4. Save the project.
5. Run `setupAmazingRaceSheets` once.
6. Approve permissions.
7. Deploy as a Web App:
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Copy the Web App URL ending in `/exec`.
9. Paste it into `config.js` as `GAS_URL`.
10. Upload `index.html`, `style.css`, `script.js`, `config.js`, and the `assets` folder to GitHub Pages.

## Spreadsheet workflow

Players submit checkpoints through the website. Judges review the `Submissions` tab and change `Status` to:

- `Approved`
- `Rejected`
- `Pending`

Rejected submissions can be resubmitted with no penalty.

The `Checkpoints` tab controls the website challenge content. You can edit the player-facing `ChallengeText`, hints, proof requirements, judge answers, and notes from the spreadsheet.

Do not rename the sheet tabs or column headers unless you also update `Code.gs`.
