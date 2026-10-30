# Parzi

Fully self-contained build — Shinzo UI rebranded to Parzi, restyled with the
glassmorphism/space theme, and the assistant orb replaced with an animated
canvas "Jarvis" HUD orb. All JS/CSS libraries are bundled locally (no CDN
dependency for normal use — see the one exception below).

## Folder layout

```
Parzi/
├── index.html              ← the app itself, open this
├── css/
│   ├── parzi-enhanced.css  ← glass/space theme (rebranded, video removed)
│   └── katex.min.css
├── fonts/                  ← self-hosted Inter + JetBrains Mono, KaTeX fonts
├── js/
│   ├── jarvis-orb.js        ← the new canvas orb renderer
│   └── vendor/              ← katex, marked, dompurify, pdf.js, mammoth, mermaid, d3
└── companion-server.js      ← optional local helper for phone control (ADB)
```

## Do you need npm or Node?

**To just use the app: neither, technically.** It's plain HTML/CSS/JS.

- **Easiest / most reliable:** open a terminal in this folder and run:
  ```
  python -m http.server 8000
  ```
  then open `http://localhost:8000` in your browser. This avoids browser
  restrictions some features (like the PDF.js worker) can hit when opening
  a file directly.
- **Also works most of the time:** just double-click `index.html` to open it
  straight in your browser. If PDF reading, docx import, or diagrams (mermaid)
  don't work when opened this way, switch to the `python -m http.server`
  method above.

**Node/npm is only needed for `companion-server.js`** (the optional ADB phone
bridge for "open app" / "call" commands) — run that separately with:
```
node companion-server.js
```
That's Node, not npm — you don't need to run `npm install` for anything here,
since all dependencies are already bundled as plain `.js` files.

## One thing that still needs internet

The in-browser RAG embedding-model feature (under **RAG Spaces**) dynamically
loads `@xenova/transformers` from a CDN, and the embedding models themselves
are downloaded from Hugging Face on first use. This wasn't vendored because:
1. The actual model weight files (50–500MB+) get downloaded at runtime
   regardless of whether the library itself is local, so bundling the library
   alone wouldn't make this feature fully offline anyway.
2. If you never use the WebGPU/in-browser embedding model download feature,
   this never gets touched and has zero effect on anything else.

Everything else — chat, markdown/math rendering, PDF/docx reading, diagrams,
charts, the Parzi orb, and the companion server — works fully offline.

## What changed from the original

- Renamed all "Shinzo" branding/keys to "Parzi" (title, logo, localStorage
  keys, IndexedDB migration flag, export filenames, etc.)
- Removed the space video background entirely; replaced with a CSS-only
  animated starfield (no video file needed)
- Replaced the emoji/CSS-animation orb with a canvas-based animated HUD orb
  (idle / listening / thinking / speaking states, same as before but visually
  upgraded)
- Vendored every CDN script/stylesheet/font as local files

## Companion server capabilities (updated)

`companion-server.js` now does two separate jobs:

1. **Open apps on this PC** — works immediately, no phone or ADB needed.
   Say "open notepad" / "open chrome" / "open spotify" and Parzi asks the
   companion server to launch it, using Windows/macOS/Linux's normal
   "open this like double-clicking it" mechanism.
2. **Open apps / make calls on a USB-connected Android phone** — needs ADB
   and a phone plugged in with USB debugging on (unchanged from before).
   Say "open whatsapp on my phone" or "call Mom" for this.

Run it the same way as before:
```
node companion-server.js
```
The startup log tells you clearly which of the two are ready:
```
Parzi companion server running at http://127.0.0.1:7890  (platform: win32)
PC app-opening is ready to use right now — try "open notepad" / "open chrome".
No phone detected — plug one in via USB with USB debugging on if you want phone app-opening/calling. PC app-opening works fine without it.
```

### Adding more PC apps

Edit `PC_APP_MAP` near the top of `companion-server.js` — it's split by OS
(`win32`, `darwin`, `linux`). On Windows, most apps work as long as their
`.exe` is on your PATH; for Store apps or things without a plain `.exe`,
a URI scheme like `spotify:` or `ms-settings:` usually works better —
search "\<app name\> URI protocol" if a plain name doesn't launch it.

### Adding more phone apps

Same idea, in `PHONE_APP_MAP` — find a package name with:
```
adb shell pm list packages | grep -i <part of app name>
```

## WhatsApp contact chat control (new)

You can now say things like:
- "Open Marshall's chat" / "Open Marshall on WhatsApp" — opens that contact's chat
- "Open Marshall and tell him I'm running late" — opens the chat AND types the message in
- "Tell him I'll be there in 10" — types more into the chat you already have open
- "Send it" — sends the currently-typed message
- "Call him" (while a WhatsApp chat is open) — starts a WhatsApp voice call with that contact

### Important limitation: "send" and "call" are best-effort screen taps

Opening a chat and typing text uses WhatsApp's own official `wa.me` deep link —
that part is solid. But **there is no public WhatsApp API to auto-send a
message or start a call** — the only way to automate those two steps is to
literally tap the screen where the button usually is. That's inherently
fragile: it depends on your exact phone's screen size and WhatsApp's current
layout.

Default guessed positions are in `companion-server.js`:
```js
const WA_SEND_TAP = { xPct: 0.92, yPct: 0.905 };
const WA_CALL_TAP = { xPct: 0.87, yPct: 0.045 };
```

**If "send" or "call" tap the wrong spot**, calibrate them:
1. Open a WhatsApp chat on your phone so the send button (or the chat's
   call icon) is visible.
2. From your PC, try taps to find the right spot:
   ```
   curl -X POST http://127.0.0.1:7890/tap-test -H "Content-Type: application/json" -d "{\"xPct\":0.92,\"yPct\":0.905}"
   ```
3. Adjust `xPct`/`yPct` (0 = left/top edge, 1 = right/bottom edge) and repeat
   until it lands exactly on the button, then update the numbers in
   `WA_SEND_TAP` / `WA_CALL_TAP` at the top of `companion-server.js` and
   restart the server.

## Voice listening tuned for background noise

The listening/silence-detection logic now only pays attention to the human
voice frequency band (~300Hz–3400Hz) instead of the full audio spectrum, so
steady background noise (fans, traffic, AC hum) — which is mostly very
low-frequency — is no longer mistaken for you still talking. The ambient
noise floor also keeps recalibrating quietly in the background, so it won't
get fooled if a room gets noisier partway through. If it still cuts you off
too early or waits too long, adjust "Silence timeout (ms)" in Parzi's settings.

## WhatsApp now also works on the PC (WhatsApp Desktop)

Same commands as before, just say "on my phone" if you specifically want the
phone instead — otherwise it now defaults to the **PC** (matching how
"open app" already works):

- "Open Marshall's chat" → opens WhatsApp Desktop to that chat (PC)
- "Open Marshall's chat on my phone" → opens it on the phone instead
- "Tell him I'm on my way" / "Send it" / "Call him" → all follow whichever
  one you opened

### Requirements for PC WhatsApp

- **WhatsApp Desktop must be installed** (the official Microsoft Store app,
  or any build that registers the `whatsapp://` link handler).
- **Contact-name lookup still needs your phone plugged in via USB** — the PC
  has no contacts list of its own, so resolving "Marshall" → a phone number
  is done through the same ADB contact lookup as before. If you say the raw
  number instead of a name, no phone is needed at all.
- **"Send" on PC is actually solid**, not a fragile tap — WhatsApp Desktop
  sends on Enter by default, so this just focuses the WhatsApp window and
  presses Enter via PowerShell.
- **"Call" on PC is still best-effort**, same caveat as the phone version —
  no public API exists for it, so it's a calculated mouse-click at an
  approximate position in the WhatsApp Desktop window. If it misses,
  calibrate it:
  ```
  curl -X POST http://127.0.0.1:7890/pc-click-test -H "Content-Type: application/json" -d "{\"xPct\":0.90,\"yPct\":0.06}"
  ```
  Adjust `xPct`/`yPct` until it lands on the call icon in the chat header,
  then update `WA_PC_CALL_CLICK` near the top of `companion-server.js`.

## Fewer misfires when it mishears a name

If you spell a name out to correct a mishearing (e.g. "no, P-R-I-N-G-A-Y" or
"P, R, I, N, G, A, Y"), Parzi now reconstructs the spelled word in code and
tells the model to use that exact spelling — instead of re-guessing from a
garbled transcript on every correction attempt.

## Important fix: PC WhatsApp open now actually works

Earlier builds tried to open WhatsApp Desktop chats via a `whatsapp://` deep
link — this depends on WhatsApp Desktop having registered itself as a
protocol handler, which isn't guaranteed and wasn't working reliably.

**It's been replaced with direct keyboard automation of WhatsApp Desktop's
own search**, which requires WhatsApp Desktop to already be open (Parzi will
tell you clearly if it isn't): it sends Ctrl+F, types the name or number,
arrows down into the result list, and presses Enter to open that chat — the
exact same thing you'd do by hand. This also means **a phone is no longer
needed at all for PC WhatsApp** — WhatsApp's own search resolves the contact
name for you.

## More reliable phone contact lookup + calling

Contact lookup (used by both "call someone" and phone-side WhatsApp) now
uses Android's actual purpose-built contact-filter query instead of pulling
the entire contact list and text-matching it in JS — this should fix cases
where a real, correctly-spelled contact still wasn't found. If a lookup
still fails, the error message will now say so clearly and suggest saying
the number directly (some phones/Android versions restrict ADB's contact
access).

Also added a **Contacts** app entry to `PHONE_APP_MAP` — say "open contacts
on my phone" to launch it directly (alongside the existing "open dialer" /
"open phone").

## Fixed: PC WhatsApp automation was possibly hitting the wrong window

If you had WhatsApp Web open in a browser tab at the same time as (or
instead of) the actual WhatsApp Desktop app, the previous title-based window
matching (`AppActivate("WhatsApp")`) could match that browser tab instead —
since its title also contains "WhatsApp" — silently sending the keystrokes
nowhere useful. This is the most likely explanation if it reported success
but nothing visibly happened.

Fixed by targeting the actual WhatsApp Desktop **process** directly (not a
window-title guess) and explicitly bringing that exact window to the
foreground before sending any keys. If your WhatsApp Desktop install uses a
process name other than "WhatsApp" or "WhatsAppDesktop", check Task Manager
→ Details tab while it's running, and add the real name to the
`$candidates` list inside `PS_FIND_WHATSAPP` near the top of
`companion-server.js`.

**Good habit going forward:** close any WhatsApp Web browser tabs before
testing PC WhatsApp commands, to rule out interference while things are
still being tuned.

## Fixed: WhatsApp running in background/tray with no window

Your Task Manager screenshot showed exactly what was going wrong: WhatsApp
was listed under "Background processes" with **0 Apps** — meaning it had no
open window at all for anything to click into, and its real process name is
`WhatsApp.Root`, not `WhatsApp`.

Fixed both:
- Added `WhatsApp.Root` to the list of process names it looks for.
- If WhatsApp truly has no window open yet (background/tray only), it now
  automatically relaunches it via its protocol handler to force a window
  open, waits, and retries — instead of just failing.

## Critical fix: typing "more" into a chat could land on the wrong chat/group

Found and fixed a real bug: saying something like "type hi to him" after
already opening a chat was re-running the whole search-and-open flow again
— including re-typing the contact name into the search box, which never got
cleared first. That produced doubled-up search text that matched nothing,
leaving whatever chat was already selected (which could be an unrelated
group) still active — and then typing your message into THAT chat instead.

Fixed with two changes:
1. **Opening a chat now clears the search box first** (select-all + delete)
   before typing a new query, so repeated opens can't accumulate stale text.
2. **Typing more into an already-open chat is now a completely separate,
   simpler action** that does not touch the search box at all — it just
   types directly into the chat that's already open and focused.

**Also added an explicit confirmation step per your request:** after
opening a chat or typing a message, Parzi now says something like *"I've
typed '...' into X's chat. Double-check that's the right chat on screen —
should I send it?"* instead of quietly waiting for you to say "send." Please
still glance at the screen before saying yes, especially for anything
consequential — this automation is inherently a best-effort UI-automation
approach, not a guaranteed-safe one.

## New: browser automation (open, click, type — reads the real page)

Say things like:
- "Open youtube" / "Search for pasta recipes" — opens a site or does a search
- "Click Sign in" — clicks anything on the page, matched by its visible text
- "Type my email in the email field" — types into a matching input
- "Press enter" / "Submit" — submits the currently-focused field

### How this actually works (and why it's reliable)

Instead of guessing where things are from a screenshot (which needs a vision
model you don't have), this asks the browser itself what's on the page —
every visible link, button, and input, with its real text/label and exact
position — via the Chrome DevTools Protocol (the same interface tools like
Puppeteer/Playwright use). Then it matches what you said against that real
list. This is far more reliable than pixel-guessing, and needs no vision
model at all.

### One-time setup required

This feature needs one extra package (everything else in this project needs
zero installs, so this is opt-in):
```
cd path\to\Parzi
npm install
```
That's it — `package.json` is already set up to pull in `chrome-remote-interface`.
If you skip this, every other feature (PC apps, phone, WhatsApp) still works
fine; only browser commands will tell you to run this.

### Important notes

- This launches Edge/Chrome with a **separate, dedicated profile** (kept in
  your temp folder) just for automation — it deliberately does NOT touch
  your normal browser window, logins, or tabs. Think of it as Parzi's own
  private browser window.
- "Click X" matches the exact or closest visible text on the page — the
  more precisely you describe it (exact button text works best), the more
  reliable the match.
- Typing does not auto-submit — say "press enter" / "submit" separately,
  same safety pattern as WhatsApp.

## Answering "does npm run dev work?" — now, yes (it didn't before)

There was no "dev" script defined before, so `npm run dev` would have just
errored with "Missing script: dev". Since you already have npm for browser
automation anyway, I wired up real scripts so you don't need Python at all
if you don't want to:

```
cd path\to\Parzi
npm install
npm run dev
```

That one command now starts **both** the frontend file server AND the
companion server together, labeled in one terminal:
```
[FRONTEND]  Serving Parzi on http://127.0.0.1:8000
[COMPANION] Parzi companion server running at http://127.0.0.1:7890
```
Open `http://127.0.0.1:8000` and you're fully running — one command, one
terminal, Ctrl+C stops both at once.

Other scripts, if you want them separately:
- `npm run serve` — just the frontend (no companion server)
- `npm run companion` (same as `npm start`) — just the companion server

**Python's `python -m http.server` still works too** if you'd rather not
install npm packages — both approaches serve the exact same static files,
pick whichever you prefer.

## Fixed: browser typing could duplicate text (same bug class as WhatsApp)

Typing into a field (especially the fallback "first visible field" case)
previously clicked and inserted text without clearing what was already
there — so re-searching Google after already having a query typed appended
onto it instead of replacing it. Fixed by clearing the field directly via
the page's own DOM before typing, not just clicking and inserting blind.

## Fixed: "enter/open the first link" was being typed instead of clicked

"Open/click/enter/go to the first link/result" now reliably means clicking
a link, never typing — both through clearer instructions to the model, and
a deterministic safety-net override (same pattern as the phone/PC target
override) that catches this specific phrasing even if a weaker model still
gets confused. Position-based clicking ("first/second/third result") is now
handled directly by index into the page's links, not by trying to match
literal text that doesn't exist anywhere on the page.

## New: browser automation now also works on the phone

Say "open youtube on my phone" and it controls Chrome on your Android phone
instead of the PC. This uses the **exact same technology as Chrome's own
`chrome://inspect` feature on desktop** — Chrome for Android already exposes
a DevTools connection whenever USB debugging is on, no rooting or extra
phone-side setup needed. The companion server just forwards a local port to
it via `adb forward` (same `npm install` requirement as PC browser
automation — nothing extra needed beyond that).

Reading, clicking, and typing all work identically to the PC version once
open — same DOM-based understanding, same position/text matching for clicks.

## WhatsApp PC: names should be more reliable now

Increased the wait time between typing a search query and selecting a
result before opening a chat — name-based fuzzy search on WhatsApp Desktop
appears to take noticeably longer to populate than a raw phone number
match, and the previous fixed delay was likely too short for names
specifically. If a name still doesn't resolve, saying the number directly
remains the reliable fallback.

## Fixed: crash in the voice VU meter (RangeError)

Found and fixed a real bug: the audio level was normalized by dividing by
128, but `getByteFrequencyData` actually returns values 0–255 — so louder
audio pushed the calculated level above 1.0, which made the VU-meter bar
calculation go negative and crash with `RangeError: Invalid count value`.
Fixed the math (divide by 255, the actual max) and added a hard clamp so
this class of bug can't happen again regardless of input.

## Fixed: opening a browser with no site/query gave a blank, useless page

"Open chrome" with nothing else specified was building
`https://www.google.com/search?q=` (empty query) instead of just going
somewhere useful. Now defaults to Google's homepage when no site or search
term is given.

## Improved: "click the second result" was often clicking the wrong thing

On a search results page, ALL links count — including Google's own nav bar
(Images, Videos, Sign in, etc.), so "second link" could land on navigation
instead of an actual result. Now it prefers links that wrap a heading
(h1–h3), which is how virtually every search engine marks up real results,
and only falls back to counting all links if that pattern isn't present.

## New: "what's on this page" now actually works

Previously there was no way to ask this — it got typed as literal text into
a field instead (visible in your last log: "Typed into page: what is in
this page"). Now it's a real action: Parzi reads the actual page content
(same DOM-based approach as clicking) and speaks back a short summary of
what's there — result titles, links, or field names — instead of either
failing silently or typing your question into a search box.

## WhatsApp phone contact lookup — likely a phone-side ADB restriction

Both "Marshall" and "Dad" failing (very different names) points away from a
spelling/fuzzy-match issue and toward your phone/Android version restricting
ADB's access to the Contacts content provider — some OEMs and newer Android
versions lock this down more than stock Android. To confirm this
definitively, run this yourself with the phone connected:

```
adb shell content query --uri "content://com.android.contacts/data/phones/filter/Dad" --projection display_name:data1
```

- If it prints nothing or an error → confirms it's a permission/access
  restriction on your phone, not a bug in Parzi — saying the number directly
  remains the reliable path for phone WhatsApp/calling on this device.
- If it prints a real row with the number → paste that output back and
  there's likely something more specific to fix in how the result is parsed.

## Confirmed: your phone hard-blocks ADB contact access (not a Parzi bug)

Your diagnostic output confirmed it precisely:
```
java.lang.SecurityException: Permission Denial: ... requires android.permission.READ_CONTACTS
```
`uid=2000` is the ADB shell user itself — your Android version/OEM denies
it contact access outright. This is an OS-level security decision on your
specific phone, not something any query trick can work around.

### The real fix: `contacts.json`

Added a local contacts file (`contacts.json`, right next to
`companion-server.js`) that's checked **first**, before ever touching the
phone. This works on every phone regardless of ADB restrictions, since it
doesn't ask the phone anything at all.

Edit it to add your real contacts:
```json
{
  "Dad": "+911234567890",
  "Marshall": "+911234567890"
}
```
Then saying "call Dad" or "open Dad's WhatsApp chat" resolves the number
from this file instantly — no ADB contact query involved. Restart the
companion server after editing it.

## Fixed: "open chrome" on phone → "type X" not working

Found the actual cause: "open chrome" was being classified as `open_app`
(which just launches the Chrome icon, no different from tapping it
yourself) instead of `browser_open` (which sets up the actual automation
connection). These are two unrelated systems that happen to share the word
"chrome" — `open_app` has no way to be typed or clicked into afterward,
which is exactly why "type hi" had nothing to type into.

Fixed with a deterministic reroute: saying "open chrome/edge/firefox" now
always goes through `browser_open` instead, regardless of how the local
model classifies it — so a follow-up "type X in it" will actually have a
live, controllable browser session to type into. This applies on both PC
and phone.

## New: 🔗 Ledger — hash-chained attendance / meeting / seating records

A new sidebar tab, **🔗 Ledger**, adds a tamper-evident record of check-ins,
meetings, and desk assignments — a lightweight private "blockchain," fully
local, no server, no external chain.

- Every entry (attendance, meeting, seating, roster change) is a **block**
  containing a SHA-256 hash of its own contents *and* the previous block's
  hash (`crypto.subtle.digest`, no libraries). Editing anything in the past
  breaks the chain from that point forward — the status pill at the top of
  the Ledger tab turns red and names the exact broken block number.
- Blocks are append-only and stored the same way everything else in this
  app is stored — one `szndb_ledger_*` key per block in **localStorage**,
  not IndexedDB. That's a deliberate change from the original feature spec:
  this codebase was already built as "100% localStorage, zero IndexedDB"
  for privacy/simplicity, so the ledger follows that same pattern instead
  of introducing a second storage engine.
- Roster (employee list) can be built two ways, and they work together:
  - **Import** an existing sheet (xlsx/csv/docx/pdf) as a genesis
    `roster_import` block — pick "Roster" as the upload's allocation type.
  - **Auto-build**: the first time a name is checked in / logged / seated
    (by voice, manually, or via any Attendance/Seating/Conference import),
    Parzi creates that employee automatically and logs a `roster_add`
    block. Corrections always go through the roster panel (✏️) and are
    logged as `roster_update` blocks — never a silent edit.
- Uploading a file always asks **what the file is for first**
  (Roster / Attendance / Seating / Conference) since the same "upload a
  sheet" button can mean four different things with different columns.
- xlsx/csv parsing uses **SheetJS**, lazy-loaded from a CDN the first time
  you import one (one-time internet fetch — everything else stays local).
  docx/pdf reuse the app's existing `mammoth`/`pdf.js` pipeline.
- Parzi (voice/chat) can drive the ledger directly: "check in Priya",
  "log a meeting called Sprint Planning with John and Priya", "put Priya
  at desk 12", "who was absent yesterday", "was today's meeting ever
  modified". `query_ledger` always answers from real ledger data computed
  in JS — the LLM is never allowed to guess the answer.

## New: 🔍 Locate a file / open it in Explorer

Parzi can now find a file by name or type and reveal it in File
Explorer (Windows) / Finder (macOS): "find my Q3 report", "where's that
roster excel file", "open the folder with the seating pdf". This needs
the companion server running (same as "open app" / calls):

- `POST /files/search {query, fileType}` — searches Documents, Downloads,
  Desktop, and OneDrive's Documents/Desktop for a name and/or extension
  match, and returns each match's format (Excel spreadsheet, PDF
  document, Word document, etc.) so Parzi can tell them apart and pick
  the most recently modified one when several match.
- `POST /files/locate {path}` — reveals that exact file, selected, in
  Explorer/Finder (`explorer.exe /select,` on Windows, `open -R` on
  macOS; Linux opens the containing folder, since there's no universal
  "select in file manager" command there).

No new dependencies — both routes use Node's built-in `fs`/`path`/`os`.
