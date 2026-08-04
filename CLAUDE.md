# CLAUDE.md — Filming Logger

A single-page offline web app Jay uses to log every filmed snowboard run on the
Argentina data-collection trip. **The project is "Filming Logger"; the app calls
itself "Track Logger" on screen and on the home screen.** Both names are correct
— don't "fix" one to match the other.

Built 2026-08-03 from a single HTML file Jay wrote, packaged as an installable
PWA. Extracted from the video-coach session so this project's rules stand alone.

- **Live:** https://trackkai.github.io/filming-logger/
- **Repo:** `trackkai/filming-logger` (**public** — GitHub Pages on a free plan
  cannot serve a private repo; Jay approved this knowing the filming schedule and
  maneuver taxonomy are readable. No keys have ever been in it — keep it that way.)

## What it does

Three tabs. **Log Run** captures one filmed run (day, run number, category,
maneuver, pitch, radius, steering, snow, camera, a sync clack timestamp, notes).
**Data Holes** shows the 18-cell groomed matrix — pitch × radius × steering — and
which cells are short of the 5-run quota. **History** lists saved runs and
exports CSV.

Everything is in the browser. No server, no accounts, no network at runtime.

## The one rule that matters: it must work with no signal

This runs on a mountain with no bars. `sw.js` is cache-first and precaches the
whole shell on first load, so once installed it never waits on a network. Data
is `localStorage`. Verified by killing the server outright and logging runs.

**Deploying:**

```bash
git push            # GitHub Pages rebuilds in ~40s
```

**Bump `CACHE` in `sw.js` on every content change** (`track-log-v3` → `v4`).
Installed phones only take an update when that string changes. Forget it and
your change silently never reaches the phone.

Phones update themselves on the next open **with a signal**. Offline, nothing
changes under you — which is the point. Don't ship changes mid-trip unless Jay
asks; there is no rollback button on a phone.

## Testing

Serve over `localhost` — service workers need a secure context, so `file://`
and a LAN IP both give you an installable-looking page with no offline at all.

```bash
node -e 'import("express").then(({default:e})=>{const a=e();a.use(e.static("."));a.listen(8907)})'
```

**The trap that will fool you:** after a change, the page often still shows the
OLD build. That is the service worker working correctly, not a broken edit.
Clear it before concluding anything:

```js
for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
location.reload();
```

To prove offline actually works: load the page, kill the server, reload.

## Phone gotchas, all learned the hard way

- **iOS installs only from Safari.** Chrome on iOS cannot add a PWA to the home
  screen. Android/Samsung uses Chrome → Install app.
- **The home-screen name is burned in at install.** Renaming the app in the
  manifest does not rename an existing icon. Changing it means delete and re-add
  — **which wipes localStorage.** Export the CSV first, always.
- **Form fields must be ≥16px** or iOS zooms the whole page when one is focused.
- **CSV export goes through the share sheet** (`navigator.share`) on iOS. A
  `download` attribute does nothing in standalone mode and the button looks
  broken exactly when the backup matters. The anchor stays as the desktop and
  Android fallback.
- **Voice notes need a signal** — the phone ships audio away to be transcribed.
  The app says so rather than failing silently.
- **`env(safe-area-inset-*)` padding** — standalone mode has no browser chrome to
  keep clear of the notch and home bar.

## Data, and the only real risk

Two `localStorage` keys: `track_ai_runs_db` (saved runs) and
`track_ai_run_draft` (the in-progress form). `track_ai_last_export` drives the
"N runs not backed up yet" nudge in History.

**The phone is the only copy.** Updates never touch it — verified — but deleting
the app icon does, and iOS can evict storage. Export the CSV to Drive every
evening. That nudge exists to make the habit stick; don't remove it.

## Deliberate choices — don't undo these

- **Matrix cells carry the run colour as their background** (green/blue/black),
  so the pitch is not abbreviated into the label and SHORT/MEDIUM/LONG and
  SLID/CARVED fit in full. The count sits on a dark chip so red/amber/green stay
  legible on all three grounds, including in snow glare.
- **Critical Holes lists every short cell** in its own scroll box. It used to cap
  at 8 with "+10 more", hiding the very cells the panel exists to surface.
- **HYBRID steering counts toward no matrix cell.** The matrix is SLID vs CARVED
  only. Those runs are still saved and exported, and the app says so out loud
  rather than letting them go quietly missing from the quota.
- **A save that fails on full storage keeps the run on screen** and says so,
  instead of clearing the form as though it had saved.
- **Day is just a number.** The dropdown used to prescribe a theme per day
  (Warmup, Green Focus…). Conditions decide what a day becomes.
- **Icons are generated from source**, not binary blobs — `git log` has the
  zero-dependency PNG writer if they need regenerating.

## Hosting — settled, don't relitigate

- **Google Drive cannot host this.** Drive web hosting was deprecated in 2015 and
  switched off in August 2016. HTML served from Drive downloads or opens in a
  viewer — no origin, no service worker, no install. Verified, not assumed.
- **Do not put this on the video-coach Azure app.** That is production for the
  coach engine (see that project's CLAUDE.md). This is a separate, static thing.
- Private hosting is possible on Cloudflare Pages if the public repo ever becomes
  a problem, or by upgrading the GitHub plan — the URL would change with the
  former, which matters because an installed PWA is bound to its origin.

## Still open

- **Quick Ride needs its own maneuver list.** The category was renamed from
  "Secondary CASI Library" and still holds the old bumps/switch/flatland/
  freestyle placeholders. Jay will supply the level-one list.
- Nothing has been logged for real yet — as of 2026-08-03 the app has only been
  installed and tested.
