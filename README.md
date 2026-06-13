# Vindictus Amazing Race Tracker

A GitHub Pages website + Google Sheets backend for running a sequential in-game competition.

Teams only see their current unlocked checkpoint. Once a judge approves their submission in the Google Sheet, the next checkpoint unlocks automatically.

## Files

```text
index.html      Main GitHub Pages site
style.css       Site styling
script.js       Site logic and Google Apps Script communication
config.js       Event settings and Apps Script Web App URL
Code.gs         Google Apps Script backend
README.md       Setup instructions
```

## What This Supports

- Team-code access
- Sequential challenge unlocks
- 15 checkpoint structure
- Hidden future checkpoints
- Proof submissions through the website
- Judge approval through Google Sheets
- Pending / approved / rejected status
- Rejection notes shown to teams
- Public team status board
- Final duel arena time-bonus rules

## Step 1 — Create the Google Sheet Backend

1. Go to Google Drive.
2. Create a new Google Sheet.
3. Name it something like `Vindictus Amazing Race Backend`.
4. Open the Sheet.
5. Go to `Extensions` → `Apps Script`.
6. Delete any starter code.
7. Paste the full contents of `Code.gs`.
8. Save the Apps Script project.
9. Reload the Google Sheet.
10. A new menu called `Amazing Race` should appear.
11. Click `Amazing Race` → `Create / Reset Event Sheets`.

This creates four tabs:

```text
Teams
Checkpoints
Submissions
Settings
```

## Step 2 — Add Your Teams

Open the `Teams` tab.

Each team needs a unique team code.

Example:

| TeamCode | TeamName | Members |
|---|---|---|
| HORDE01 | Horde Hustlers | Name1, Name2, Name3 |
| HORDE02 | Tauren Track Stars | Name1, Name2, Name3 |

Give each team their own code before the event.

Do not make team codes too obvious if you do not want teams opening each other’s checkpoint page.

## Step 3 — Edit the Checkpoints

Open the `Checkpoints` tab.

You can edit:

- Title
- Type
- ChallengeText
- ProofRequired
- Active

The website will only show a team the checkpoint they currently have unlocked.

Future checkpoint text is not sent to the website until the team reaches that checkpoint.

## Step 4 — Deploy the Apps Script Web App

In Apps Script:

1. Click `Deploy` → `New deployment`.
2. Choose type: `Web app`.
3. Description: `Vindictus Amazing Race Backend`.
4. Execute as: `Me`.
5. Who has access: `Anyone`.
6. Click `Deploy`.
7. Authorize the script when prompted.
8. Copy the Web App URL.

The URL should look something like:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

## Step 5 — Connect the Website

Open `config.js`.

Replace this:

```js
GAS_URL: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE",
```

with your deployed Apps Script Web App URL:

```js
GAS_URL: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
```

## Step 6 — Host on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files:

```text
index.html
style.css
script.js
config.js
README.md
```

You do not need to upload `Code.gs` unless you want it stored in the repo for reference.

3. Go to repository `Settings`.
4. Open `Pages`.
5. Set source to `Deploy from a branch`.
6. Choose your main branch and root folder.
7. Save.
8. GitHub will give you a Pages URL.

## How Teams Submit Challenges

1. Team opens the GitHub Pages site.
2. Team enters their team code.
3. The site loads only their current checkpoint.
4. Team submits answer/proof.
5. Submission appears in the `Submissions` tab as `Pending`.
6. Judge changes status to `Approved` or `Rejected`.
7. If approved, the next checkpoint unlocks.
8. If rejected, the team sees the judge note and can resubmit.

## Judge Approval Workflow

Open the `Submissions` tab.

For each submission, update the `Status` column:

```text
Pending
Approved
Rejected
```

Optional:

- Add feedback in `JudgeNotes`.
- Add time penalties in `PenaltyMinutes`.
- Add reviewer name in `ReviewedBy`.
- Add review time in `ReviewedAt`.

The website checks the Sheet each time the team refreshes. If a submission is pending, the site auto-refreshes every 20 seconds.

## Final Arena Scoring

This site includes the final arena rules:

```text
Final Time = Race Time + Penalties − Arena Bonus
```

Recommended arena bonuses:

```text
1st Place Arena Finish: −10 minutes
2nd Place Arena Finish: −6 minutes
3rd Place Arena Finish: −3 minutes
All Other Teams: No deduction
```

You can track final arena placement in the `Teams` tab:

- ArenaPlace
- ArenaBonusMinutes
- PenaltiesMinutes
- Checkpoint14Finish

## Important Notes

GitHub Pages is static hosting. It cannot securely store submissions by itself. The Google Apps Script + Google Sheet backend is what stores team submissions and controls challenge unlocking.

The website uses JSONP requests to avoid browser CORS issues when communicating between GitHub Pages and Google Apps Script.

## Recommended Event Operation

Before the event:

- Add real teams and team codes.
- Edit all 15 checkpoint clues.
- Test one full team flow.
- Test approving and rejecting submissions.
- Keep the Google Sheet open for judges.

During the event:

- Teams submit from the website.
- Judges approve/reject in the Sheet.
- Teams refresh or wait for auto-refresh.
- After Checkpoint 14, record race times.
- Run the final Duel Arena spectator challenge.
- Apply arena bonuses.
- Announce final adjusted times.
