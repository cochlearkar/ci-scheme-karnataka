# CI Scheme Karnataka — PWA Setup Guide
## Owner: cochlearkar@gmail.com

---

## Files in this package
- `index.html` — the complete mobile app (all 4 role forms)
- `sw.js` — service worker (enables offline use)
- `manifest.json` — makes it installable like a native app
- `Code.gs` — Google Apps Script backend (paste into Apps Script)
- `README.md` — this file

---

## STEP 1 — Set up the Google Sheet & Apps Script

1. Log in to **cochlearkar@gmail.com**
2. Go to **sheets.google.com** → New blank sheet
3. Name it: **CI Scheme Master Register**
4. Click **Extensions → Apps Script**
5. Delete all existing code
6. Open `Code.gs` from this package → copy all → paste into Apps Script
7. Click **Save** (floppy disk icon)
8. Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me (cochlearkar@gmail.com)**
   - Who has access: **Anyone**
9. Click **Deploy** → Authorize when prompted
10. **Copy the Web App URL** — looks like:
    `https://script.google.com/macros/s/AKfyc.../exec`

---

## STEP 2 — Connect the app to your Google Sheet

1. Open `index.html` in a text editor (Notepad is fine)
2. Find this line near the top of the `<script>` section:
   ```
   const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
   ```
3. Replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL you copied in Step 1
4. Save the file

---

## STEP 3 — Host on GitHub Pages (free, permanent)

1. Go to **github.com** → Sign up for a free account (or log in)
2. Click **New repository**
   - Name: `ci-scheme-karnataka`
   - Set to **Public**
3. Upload all files from this package (index.html, sw.js, manifest.json)
4. Go to **Settings → Pages → Source → main branch → / (root)**
5. Your app is now live at:
   `https://YOUR-USERNAME.github.io/ci-scheme-karnataka`

---

## STEP 4 — Set up weekly email alerts

1. In Apps Script, click **Run → setupWeeklyTrigger** (run once)
2. This sets up a Monday 8AM alert email to cochlearkar@gmail.com
3. Lists all babies with no rehab session in 30+ days

---

## STEP 5 — Share with staff

**Hospital coordinators & Rehab institutes:**
Send this WhatsApp message:
> "Please open this link on your phone: [YOUR GITHUB URL]
> Tap the three dots → Add to Home Screen
> Use this app to enter patient data from now on."

**District officers:**
Send by email with the same link.

---

## Updating the app later

- To **change a form field**: edit `index.html`, re-upload to GitHub
- To **add a new sheet tab**: edit `Code.gs` in Apps Script, redeploy
- To **change who gets alerts**: edit the email in `sendWeeklyAlert()` function
- No need to reshare the link — everyone gets updates automatically

---

## Google Sheet tabs that will be created automatically

| Tab name | Contains |
|---|---|
| Hospital_Surgery | All surgery & device registrations |
| Rehab_Sessions | All AVT session logs |
| District_Followup | All follow-up notes |
| State_Outcomes | All milestone & audiogram records |
| Master_Register | One row per baby — auto-updated |
| Submission_Log | Every entry with timestamp |

---

## Support
For help: cochlearkar@gmail.com
Built for Karnataka NPPCD Cochlear Implant Programme
