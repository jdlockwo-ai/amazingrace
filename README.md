# TBC Classic Amazing Race Site

A GitHub Pages site with a Google Sheets / Google Apps Script backend for a Horde-only TBC Classic Amazing Race event.

## What This Version Does

- Sequential checkpoint unlocking
- Clue-based player-facing challenge text
- Judge-only answers and notes in the spreadsheet
- 15 checkpoints total
- Race timer starts when a team first submits Checkpoint 1
- Race timer stops when Checkpoint 14 is approved
- Checkpoint 15 reveals Gurubashi Arena after the race timer is already locked
- Hint 1 adds +2 minutes
- Hint 2 adds +5 minutes
- Rejected submissions can be resubmitted with no penalty
- Team status board shows progress, race time, penalties, and adjusted time
- Future challenge text is not sent to the browser until unlocked

## Files

```text
index.html
style.css
script.js
config.js
Code.gs
assets/
```

## Google Sheet Setup

1. Create a Google Sheet.
2. Go to **Extensions → Apps Script**.
3. Paste the contents of `Code.gs` into Apps Script.
4. Save.
5. Run `setupAmazingRaceSheets` once.
6. Approve permissions.
7. Return to the sheet and edit the `Teams` tab with your real team codes, names, and members.

The setup function creates these tabs:

- `Teams`
- `Checkpoints`
- `Submissions`
- `HintLog`
- `Settings`

## Deploy Apps Script

1. In Apps Script, click **Deploy → New deployment**.
2. Select **Web app**.
3. Set **Execute as:** `Me`.
4. Set **Who has access:** `Anyone`.
5. Deploy.
6. Copy the Web App URL.
7. Paste it into `config.js`:

```js
GAS_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
```

## GitHub Pages Setup

Upload these files to your GitHub repository:

```text
index.html
style.css
script.js
config.js
README.md
assets/
```

Then enable GitHub Pages from the repository settings.

## Judge Workflow

Judges should review submissions in the `Submissions` tab.

Recommended approval method:

1. Select the submission row.
2. Use **Amazing Race → Approve Selected Submission**.
3. Or use **Amazing Race → Reject Selected Submission**.

This automatically writes review timestamps and recalculates team progress/timing.

Manual editing also works by changing `Status` to `Approved` or `Rejected`, but the timer is most accurate when using the menu approval buttons.

## Editing Challenges

You can edit the `Checkpoints` tab to update the website. The site reads challenge text from the sheet every time a team loads its current checkpoint.

Safe columns to edit:

```text
Title
Type
ChallengeText
ProofRequired
Hint1
Hint2
JudgeAnswer
Notes
Active
```

Do not rename the column headers unless you also update `Code.gs`.

## Important Race Rules Built Into This Version

- Level 70 Horde-only teams
- Teams of 3–5
- Teams must stay together
- Any travel is allowed: flying, hearths, summons, portals, boats, zeppelins, flight paths
- No auction house, bank, mailbox, or alts during the race
- Outside resources are allowed
- Item collection must happen during the race
- No fishing challenges

## Checkpoint 15

Checkpoint 15 reveals:

```text
Report to Gurubashi Arena in Stranglethorn Vale and wait for judge instructions.
```

The site does not mention any final duel or final challenge mechanics. It only gives the final location after Checkpoint 14 is approved.
