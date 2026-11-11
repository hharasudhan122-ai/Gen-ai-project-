#!/usr/bin/env node
/**
 * Parzi Companion Server
 * ------------------------------------------------------------
 * A tiny local HTTP server that Parzi (in index.html) talks to for:
 *   - Opening apps on THIS PC          (target: "pc")
 *   - Opening apps on a USB Android phone (target: "phone", via ADB)
 *   - Calling a saved contact on that phone (via ADB)
 *
 * Requirements:
 *   - Node.js (you already have this)
 *   - For phone features only: ADB (Android Debug Bridge) on your PATH,
 *     and an Android phone with USB debugging enabled, plugged in via USB.
 *     PC app-opening needs NEITHER of these — it works standalone.
 *
 * Run it:
 *   node companion-server.js
 *
 * Leave this running in a terminal in the background while you use
 * Parzi. It listens on http://127.0.0.1:7890 by default (matches
 * Parzi's default "Companion URL" setting).
 * ------------------------------------------------------------
 */

const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');

// Optional — only needed for browser automation (open/click/type on web
// pages). Everything else in this file works fine without it. If it's not
// installed, browser features give a clear error telling you to run:
//   npm install chrome-remote-interface
let CDP = null;
try {
  CDP = require('chrome-remote-interface');
} catch {
  /* not installed — browser automation functions will report this clearly when used */
}

const PORT = process.env.PARZI_COMPANION_PORT || 7890;
const PLATFORM = os.platform(); // 'win32' | 'darwin' | 'linux'

// Secret token for authenticating local POST commands
const COMPANION_TOKEN = (process.env.PARZI_COMPANION_TOKEN || crypto.randomBytes(24).toString('hex')).trim();

// CORS allowlist: only the verified live frontend and local loopback origins
const ALLOWED_ORIGIN_HOSTS = new Set([
  'genaia-gilt.vercel.app',
  'localhost',
  '127.0.0.1',
]);

function getCorsOrigin(req) {
  const origin = req?.headers?.origin;
  if (!origin) return null;
  try {
    const parsed = new URL(origin);
    if (ALLOWED_ORIGIN_HOSTS.has(parsed.hostname)) {
      return origin;
    }
  } catch {}
  return null;
}


// =================================================================
// PC app-opening — add / edit friendly-name -> launch-target here.
// =================================================================
//   Windows: the exe name (if it's on PATH) or a full path in quotes,
//            or a URI scheme like 'ms-settings:' / 'spotify:'.
//   macOS:   the .app name as it appears in Applications, e.g. "Safari".
//   Linux:   the binary name as you'd type it in a terminal.
const PC_APP_MAP = {
  win32: {
    notepad: 'notepad.exe',
    calculator: 'calc.exe',
    calc: 'calc.exe',
    paint: 'mspaint.exe',
    explorer: 'explorer.exe',
    files: 'explorer.exe',
    cmd: 'cmd.exe',
    terminal: 'cmd.exe',
    powershell: 'powershell.exe',
    settings: 'ms-settings:',
    chrome: 'chrome',
    edge: 'msedge',
    firefox: 'firefox',
    spotify: 'spotify:',
    whatsapp: 'whatsapp:',
    vscode: 'code',
    'vs code': 'code',
    word: 'winword',
    excel: 'excel',
    powerpoint: 'powerpnt',
    wordpad: 'write.exe',
    task_manager: 'taskmgr.exe',
    'task manager': 'taskmgr.exe',
    control_panel: 'control.exe',
    'control panel': 'control.exe',
  },
  darwin: {
    notes: 'Notes',
    calculator: 'Calculator',
    calc: 'Calculator',
    safari: 'Safari',
    chrome: 'Google Chrome',
    firefox: 'Firefox',
    spotify: 'Spotify',
    whatsapp: 'WhatsApp',
    vscode: 'Visual Studio Code',
    'vs code': 'Visual Studio Code',
    terminal: 'Terminal',
    finder: 'Finder',
    mail: 'Mail',
    settings: 'System Settings',
  },
  linux: {
    calculator: 'gnome-calculator',
    calc: 'gnome-calculator',
    chrome: 'google-chrome',
    firefox: 'firefox',
    spotify: 'spotify',
    vscode: 'code',
    'vs code': 'code',
    terminal: 'gnome-terminal',
    files: 'nautilus',
  },
};

function resolvePcTarget(name) {
  const map = PC_APP_MAP[PLATFORM] || {};
  const key = (name || '').toLowerCase().trim();
  if (map[key]) return map[key];
  const found = Object.keys(map).find((k) => k.includes(key) || key.includes(k));
  return found ? map[found] : null;
}

function openAppOnPC(appName) {
  return new Promise((resolve, reject) => {
    const raw = String(appName || '').trim();
    if (!raw) return reject(new Error('No app name provided.'));

    const mapped = resolvePcTarget(raw);
    const resolved = mapped || raw;

    // Strict validation if not pre-mapped: alphanumeric, spaces, dashes, dots, underscores, colons
    if (!mapped && !/^[a-zA-Z0-9_\-\.\ :]{1,80}$/.test(raw)) {
      return reject(new Error(`Invalid app name "${appName}". Only alphanumeric characters, dashes, and underscores are allowed.`));
    }

    if (PLATFORM === 'win32') {
      // cmd.exe /c start "" <target> executes without shell concatenation vulnerability
      execFile('cmd.exe', ['/c', 'start', '', resolved], { windowsHide: false }, (err) => {
        if (err) return reject(new Error(`Couldn't open "${appName}" on this PC: ${err.message}. Add it to PC_APP_MAP in companion-server.js if it's not a common app.`));
        resolve(resolved);
      });
    } else if (PLATFORM === 'darwin') {
      execFile('open', ['-a', resolved], (err) => {
        if (err) return reject(new Error(`Couldn't open "${appName}" on this Mac: ${err.message}`));
        resolve(resolved);
      });
    } else {
      try {
        const child = spawn(resolved, [], { detached: true, stdio: 'ignore' });
        child.unref();
        child.on('error', (err) => reject(new Error(`Couldn't open "${appName}" on this Linux PC: ${err.message}`)));
        resolve(resolved);
      } catch (err) {
        reject(new Error(`Couldn't open "${appName}": ${err.message}`));
      }
    }
  });
}

// =================================================================
// Phone (ADB) — app-opening and calling on a USB-connected Android phone
// =================================================================
const PHONE_APP_MAP = {
  whatsapp: 'com.whatsapp',
  youtube: 'com.google.android.youtube',
  chrome: 'com.android.chrome',
  gmail: 'com.google.android.gm',
  camera: 'com.android.camera',
  phone: 'com.google.android.dialer',
  dialer: 'com.google.android.dialer',
  contacts: 'com.google.android.contacts', // if this doesn't match, run `adb shell pm list packages | grep -i contact` and update it — some OEMs (Samsung, etc.) ship their own
  maps: 'com.google.android.apps.maps',
  spotify: 'com.spotify.music',
  instagram: 'com.instagram.android',
  settings: 'com.android.settings',
  messages: 'com.google.android.apps.messaging',
  playstore: 'com.android.vending',
};

function adb(args) {
  return new Promise((resolve, reject) => {
    execFile('adb', args, { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.trim() || err.message));
      resolve(stdout.trim());
    });
  });
}

async function getDevice() {
  try {
    const out = await adb(['devices']);
    const line = out
      .split('\n')
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean)
      .find((l) => l.endsWith('\tdevice'));
    return line ? line.split('\t')[0] : null;
  } catch {
    return null; // adb not installed, or no devices — treated as "no device"
  }
}

function resolvePhonePackage(name) {
  const key = (name || '').toLowerCase().trim();
  if (PHONE_APP_MAP[key]) return PHONE_APP_MAP[key];
  const found = Object.keys(PHONE_APP_MAP).find((k) => k.includes(key) || key.includes(k));
  return found ? PHONE_APP_MAP[found] : null;
}

async function openAppOnPhone(appName) {
  const device = await getDevice();
  if (!device) throw new Error('No phone connected. Plug in your Android phone via USB with USB debugging enabled.');
  const pkg = resolvePhonePackage(appName);
  if (!pkg) throw new Error(`I don't know the phone app "${appName}" yet. Add it to PHONE_APP_MAP in companion-server.js.`);
  await adb(['-s', device, 'shell', 'monkey', '-p', pkg, '-c', 'android.intent.category.LAUNCHER', '1']);
  return pkg;
}

const CONTACTS_FILE = path.join(__dirname, 'contacts.json');

function loadLocalContacts() {
  try {
    const raw = fs.readFileSync(CONTACTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {}; // missing/invalid file just means "no local overrides" — not an error
  }
}

function lookupLocalContact(name) {
  const contacts = loadLocalContacts();
  const key = (name || '').toLowerCase().trim();
  const entries = Object.entries(contacts).filter(([k]) => !k.startsWith('_'));
  for (const [contactName, number] of entries) {
    if (contactName.toLowerCase().trim() === key) return number;
  }
  // fuzzy fallback: partial match either direction
  for (const [contactName, number] of entries) {
    const cn = contactName.toLowerCase().trim();
    if (cn.includes(key) || key.includes(cn)) return number;
  }
  return null;
}

async function resolveToNumber(device, contactOrNumber) {
  let number = (contactOrNumber || '').replace(/[^\d+]/g, '');
  if (number.length >= 5) return number;

  // Check contacts.json FIRST — this works on every phone regardless of
  // ADB permission restrictions, since it doesn't touch the phone at all.
  // Some phones/Android versions flatly deny ADB shell access to the
  // Contacts provider (SecurityException: requires READ_CONTACTS) — if
  // that's your device, this local file is the reliable path. See
  // contacts.json in this folder to add your own names/numbers.
  const local = lookupLocalContact(contactOrNumber);
  if (local) return local.replace(/[^\d+]/g, '');

  // Fall back to asking the phone directly — works fine on phones that
  // don't restrict this.
  const filterUri = `content://com.android.contacts/data/phones/filter/${encodeURIComponent(contactOrNumber)}`;
  let out;
  try {
    out = await adb(['-s', device, 'shell', 'content', 'query', '--uri', filterUri, '--projection', 'display_name:data1']);
  } catch (e) {
    throw new Error(`Contact lookup failed (${e.message}). Your phone likely restricts ADB's contact access — add "${contactOrNumber}" to contacts.json in the Parzi folder instead (see the file for the format), or say the number directly.`);
  }
  const lines = out.split('\n').map((l) => l.trim()).filter(Boolean);
  const row = lines.find((l) => l.includes('data1='));
  if (!row) throw new Error(`Couldn't find a contact named "${contactOrNumber}" on the phone or in contacts.json. Try saying the number directly, add them to contacts.json, or check the name is saved exactly like that.`);
  const match = row.match(/data1=([\d+]+)/);
  if (!match) throw new Error(`Found "${contactOrNumber}" but couldn't read their phone number.`);
  return match[1];
}

async function callContact(contact) {
  const device = await getDevice();
  if (!device) throw new Error('No phone connected. Plug in your Android phone via USB with USB debugging enabled.');
  const number = await resolveToNumber(device, contact);
  await adb(['-s', device, 'shell', 'am', 'start', '-a', 'android.intent.action.CALL', '-d', `tel:${number}`]);
  return number;
}

// =================================================================
// WhatsApp — open a specific person's chat by name, type a message into
// it, and best-effort "tap" the send/call buttons.
//
// Opening a chat + pre-filling text uses WhatsApp's own official wa.me
// deep link (https://wa.me/<number>?text=<msg>) — this part is solid and
// won't break with WhatsApp updates.
//
// Auto-SENDING and auto-CALLING are NOT officially supported by any
// public WhatsApp API — there is no documented "send" or "call" intent.
// The only way to automate those two specific steps is to literally tap
// the screen where the button usually is, which is inherently fragile:
// it depends on your phone's exact screen resolution/aspect ratio and
// WhatsApp's current UI layout, and can silently miss if either changes.
// If it's tapping the wrong spot, calibrate WA_SEND_TAP / WA_CALL_TAP
// below using the /tap-test endpoint (see README).
// =================================================================
const WA_SEND_TAP = { xPct: 0.92, yPct: 0.905 }; // send button, chat compose screen (portrait)
const WA_CALL_TAP = { xPct: 0.87, yPct: 0.045 }; // voice-call icon, chat header (portrait)

async function getScreenSize(device) {
  const out = await adb(['-s', device, 'shell', 'wm', 'size']);
  const m = out.match(/(\d+)x(\d+)/);
  if (!m) throw new Error("Couldn't read the phone's screen size.");
  return { w: parseInt(m[1], 10), h: parseInt(m[2], 10) };
}

async function tapPct(device, xPct, yPct) {
  const { w, h } = await getScreenSize(device);
  const x = Math.round(w * xPct);
  const y = Math.round(h * yPct);
  await adb(['-s', device, 'shell', 'input', 'tap', String(x), String(y)]);
  return { x, y, screen: `${w}x${h}` };
}

async function whatsappOpenPhone(contactOrNumber, message) {
  const device = await getDevice();
  if (!device) throw new Error('No phone connected. Plug in your Android phone via USB with USB debugging enabled.');
  const number = await resolveToNumber(device, contactOrNumber);
  let url = `https://wa.me/${number.replace(/^\+/, '')}`;
  if (message) url += `?text=${encodeURIComponent(message)}`;
  await adb(['-s', device, 'shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url]);
  return number;
}

async function whatsappTapSendPhone() {
  const device = await getDevice();
  if (!device) throw new Error('No phone connected.');
  return tapPct(device, WA_SEND_TAP.xPct, WA_SEND_TAP.yPct);
}

async function whatsappTapCallPhone() {
  const device = await getDevice();
  if (!device) throw new Error('No phone connected.');
  return tapPct(device, WA_CALL_TAP.xPct, WA_CALL_TAP.yPct);
}

// =================================================================
// WhatsApp on the PC (WhatsApp Desktop) — same idea, different tools:
//   - Open chat + prefill text: the official `whatsapp://send?phone=&text=`
//     deep link (same family as wa.me, registered by WhatsApp Desktop).
//   - Contact-name -> number resolution still goes through the phone via
//     ADB (the PC has no contacts list of its own) — so a phone plugged in
//     is only needed to resolve a NAME. If you say the raw number, no
//     phone is required at all for PC WhatsApp.
//   - Send: WhatsApp Desktop actually sends on Enter by default, so this
//     is more reliable than the phone's tap-hack — just focuses the
//     WhatsApp window and sends an Enter keystroke via PowerShell.
//   - Call: still no public API for this. Best-effort mouse click at an
//     approximate position in the WhatsApp Desktop window, same caveats
//     as the phone version — calibrate with /pc-click-test if it misses.
// =================================================================
function runPowerShell(script) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { timeout: 8000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr?.trim() || stdout?.trim() || err.message));
      resolve((stdout || '').trim());
    });
  });
}

// SendKeys treats + ^ % ~ ( ) { } [ ] as special — wrap each in braces so
// literal text (names, messages, numbers with +) types out correctly
// instead of being interpreted as key combinations.
function escapeSendKeys(str) {
  return String(str).replace(/([+^%~(){}[\]])/g, '{$1}');
}

// Shared PowerShell prelude: finds the ACTUAL WhatsApp Desktop process (by
// process name, not window-title text) and brings its exact window handle
// to the foreground via SetForegroundWindow. This matters: the earlier
// AppActivate("WhatsApp") approach matches ANY window whose title merely
// contains "WhatsApp" — including a browser tab with WhatsApp Web open,
// which would silently steal the keystrokes and send them nowhere useful.
// Targeting the real process's window handle avoids that entirely.
//
// If your WhatsApp Desktop install uses a different process name, add it
// to $candidates below (Task Manager > Details tab shows the real name
// while WhatsApp is running).
const PS_FIND_WHATSAPP = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class ParziWin32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, UIntPtr dwExtraInfo);
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
function Find-WhatsAppHandle {
  $candidates = @("WhatsApp", "WhatsApp.Root", "WhatsAppDesktop")
  foreach ($name in $candidates) {
    $p = Get-Process -Name $name -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($p) { return $p.MainWindowHandle }
  }
  return [IntPtr]::Zero
}
$hwnd = [IntPtr]::Zero
for ($i = 0; $i -lt 4; $i++) {
  $hwnd = Find-WhatsAppHandle
  if ($hwnd -ne [IntPtr]::Zero) { break }
  Start-Sleep -Milliseconds 400
}
if ($hwnd -eq [IntPtr]::Zero) {
  # WhatsApp is very likely running in the background/tray with no open
  # window (Task Manager shows it under "Background processes", 0 "Apps").
  # Relaunch it via its protocol handler to force a visible window, then
  # try again.
  Start-Process "whatsapp:" -ErrorAction SilentlyContinue
  for ($i = 0; $i -lt 8; $i++) {
    Start-Sleep -Milliseconds 500
    $hwnd = Find-WhatsAppHandle
    if ($hwnd -ne [IntPtr]::Zero) { break }
  }
}
if ($hwnd -eq [IntPtr]::Zero) {
  Write-Output "ERR:Couldn't find or open a WhatsApp Desktop window. Try opening WhatsApp Desktop manually once (not just a browser tab), then try again."
  exit
}
[ParziWin32]::ShowWindowAsync($hwnd, 9) | Out-Null
[ParziWin32]::SetForegroundWindow($hwnd) | Out-Null
Start-Sleep -Milliseconds 400
`;

// Opening a chat on PC does NOT use the "whatsapp://" URI scheme — that
// depends on WhatsApp Desktop having registered itself as a protocol
// handler, which isn't guaranteed (and wasn't working in testing). Instead
// this drives WhatsApp Desktop's own search UI directly: Ctrl+F, type the
// name or number, arrow down into the result list, Enter to open it. This
// only requires WhatsApp Desktop to already be open — it does not need a
// phone connected at all, since WhatsApp's own search handles the name
// lookup for you.
async function whatsappOpenPC(contactOrNumber, message) {
  if (PLATFORM !== 'win32') throw new Error('PC WhatsApp is currently only implemented for Windows.');
  let query = (contactOrNumber || '').trim();
  const digits = query.replace(/[^\d+]/g, '');
  if (digits.length >= 5) query = digits; // search by number if that's clearly what was given
  const q = escapeSendKeys(query);
  const msg = message ? escapeSendKeys(message) : '';
  const script = `
${PS_FIND_WHATSAPP}
$w = New-Object -ComObject wscript.shell
$w.SendKeys("^f")
Start-Sleep -Milliseconds 350
$w.SendKeys("^a")
$w.SendKeys("{DEL}")
Start-Sleep -Milliseconds 150
$w.SendKeys("${q}")
Start-Sleep -Milliseconds 1400
$w.SendKeys("{DOWN}")
Start-Sleep -Milliseconds 350
$w.SendKeys("{ENTER}")
Start-Sleep -Milliseconds 600
${msg ? `$w.SendKeys("${msg}")` : ''}
Write-Output "OK"
`.trim();
  const out = await runPowerShell(script);
  if (out.startsWith('ERR:')) throw new Error(out.slice(4));
  return query;
}

// Typing MORE into a chat that's already open must NOT touch the search
// box again — re-running the search (even with the same name) can land on
// the wrong chat if the search box wasn't perfectly cleared, which is
// exactly the bug that caused a message to nearly go into the wrong group.
// This just types directly, assuming the previously-opened chat's message
// box still has focus (which it does right after opening a chat).
async function whatsappTypeOnlyPC(message) {
  if (PLATFORM !== 'win32') throw new Error('PC WhatsApp is currently only implemented for Windows.');
  const msg = escapeSendKeys(message || '');
  const script = `
${PS_FIND_WHATSAPP}
$w = New-Object -ComObject wscript.shell
$w.SendKeys("${msg}")
Write-Output "OK"
`.trim();
  const out = await runPowerShell(script);
  if (out.startsWith('ERR:')) throw new Error(out.slice(4));
  return true;
}

async function whatsappSendPC() {
  if (PLATFORM !== 'win32') throw new Error('PC WhatsApp send is currently only implemented for Windows.');
  const script = `
${PS_FIND_WHATSAPP}
$w = New-Object -ComObject wscript.shell
$w.SendKeys("~")
Write-Output "OK"
`.trim(); // "~" = Enter in WScript.Shell SendKeys syntax; WhatsApp Desktop sends on Enter by default
  const out = await runPowerShell(script);
  if (out.startsWith('ERR:')) throw new Error(out.slice(4));
  return true;
}

const WA_PC_CALL_CLICK = { xPct: 0.90, yPct: 0.06 }; // approx voice-call icon, WhatsApp Desktop chat header

async function clickInWhatsappWindow(xPct, yPct) {
  if (PLATFORM !== 'win32') throw new Error('PC WhatsApp click-automation is currently only implemented for Windows.');
  const script = `
${PS_FIND_WHATSAPP}
$rect = New-Object ParziWin32+RECT
[ParziWin32]::GetWindowRect($hwnd, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
$x = $rect.Left + [int]($w * ${xPct})
$y = $rect.Top + [int]($h * ${yPct})
[ParziWin32]::SetCursorPos($x, $y) | Out-Null
Start-Sleep -Milliseconds 100
[ParziWin32]::mouse_event(0x0002, 0, 0, 0, [UIntPtr]::Zero)
[ParziWin32]::mouse_event(0x0004, 0, 0, 0, [UIntPtr]::Zero)
Write-Output "OK:$x,$y,$w,$h"
`.trim();
  const out = await runPowerShell(script);
  if (out.startsWith('ERR:')) throw new Error(out.slice(4));
  return out;
}

async function whatsappCallPC() {
  return clickInWhatsappWindow(WA_PC_CALL_CLICK.xPct, WA_PC_CALL_CLICK.yPct);
}

// =================================================================
// Browser automation — open pages, and find/click/type using what's
// ACTUALLY on the page (via Chrome DevTools Protocol), not pixel-guessing.
//
// This launches Edge/Chrome with a remote-debugging port and its OWN
// separate browser profile (kept in your temp folder) — deliberately
// separate from your normal browsing session/profile, so this doesn't
// touch your real logins, history, or open tabs. Requires:
//   npm install chrome-remote-interface
// (a one-time setup, only needed for this feature — nothing else in this
// file needs it.)
// =================================================================
const BROWSER_DEBUG_PORT = 9333; // PC: launched Edge/Chrome with this debug port
const PHONE_BROWSER_DEBUG_PORT = 9334; // PC-local port forwarded to the phone's Chrome via ADB
const BROWSER_PROFILE_DIR = path.join(os.tmpdir(), 'parzi-browser-profile');

function requireCDP() {
  if (!CDP) throw new Error('Browser automation needs a one-time setup: run "npm install chrome-remote-interface" inside the Parzi folder, then restart the companion server.');
}

function launchBrowserWithDebugPort(browserName) {
  if (PLATFORM !== 'win32') throw new Error('PC browser automation is currently only implemented for Windows.');
  const exe = browserName === 'chrome' ? 'chrome' : 'msedge';
  return new Promise((resolve, reject) => {
    exec(`start "" "${exe}" --remote-debugging-port=${BROWSER_DEBUG_PORT} --user-data-dir="${BROWSER_PROFILE_DIR}" --no-first-run`, {}, (err, stdout, stderr) => {
      if (err) return reject(new Error(`Couldn't launch ${exe}: ${stderr?.trim() || err.message}. Is it installed?`));
      resolve();
    });
  });
}

async function ensurePCBrowser(browserName) {
  requireCDP();
  try {
    await CDP.List({ port: BROWSER_DEBUG_PORT });
    return BROWSER_DEBUG_PORT; // already up and controllable
  } catch {
    await launchBrowserWithDebugPort(browserName);
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        await CDP.List({ port: BROWSER_DEBUG_PORT });
        return BROWSER_DEBUG_PORT;
      } catch {
        /* keep waiting for it to come up */
      }
    }
    throw new Error('Browser launched but the automation connection never came up. Try again in a moment.');
  }
}

// Phone browser control uses the exact same mechanism as Chrome's own
// "chrome://inspect" feature on desktop: Chrome for Android already exposes
// a DevTools socket whenever the phone has USB debugging enabled — no extra
// flags or rooting needed. We just forward a local PC port to that socket
// via `adb forward`, then talk to it exactly like the PC browser.
async function ensurePhoneBrowser() {
  requireCDP();
  const device = await getDevice();
  if (!device) throw new Error('No phone connected. Plug in your Android phone via USB with USB debugging enabled.');
  // Make sure Chrome is actually open on the phone (the devtools socket only
  // exists while Chrome is running).
  await adb(['-s', device, 'shell', 'monkey', '-p', 'com.android.chrome', '-c', 'android.intent.category.LAUNCHER', '1']).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  await adb(['-s', device, 'forward', `tcp:${PHONE_BROWSER_DEBUG_PORT}`, 'localabstract:chrome_devtools_remote']);
  for (let i = 0; i < 10; i++) {
    try {
      await CDP.List({ port: PHONE_BROWSER_DEBUG_PORT });
      return PHONE_BROWSER_DEBUG_PORT;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Couldn't connect to Chrome on the phone. Make sure Chrome is installed and open, and USB debugging is enabled (this uses the same connection chrome://inspect on desktop uses).");
}

async function withBrowserTab(port, fn) {
  requireCDP();
  const targets = await CDP.List({ port });
  const page = targets.find((t) => t.type === 'page') || targets[0];
  if (!page) throw new Error('No browser page found to control. Try opening one first.');
  const client = await CDP({ target: page, port });
  try {
    return await fn(client, page);
  } finally {
    await client.close();
  }
}

// Common site name -> actual domain, so "open youtube" navigates directly
// instead of doing a Google search for the word "youtube". Add more here
// as you find sites you say by name often.
const SITE_SHORTCUTS = {
  youtube: 'youtube.com',
  gmail: 'mail.google.com',
  google: 'google.com',
  maps: 'maps.google.com',
  amazon: 'amazon.in',
  flipkart: 'flipkart.com',
  whatsapp: 'web.whatsapp.com',
  github: 'github.com',
  reddit: 'reddit.com',
  wikipedia: 'wikipedia.org',
  netflix: 'netflix.com',
};

function toUrlOrSearch(input) {
  const s = (input || '').trim();
  if (!s) return 'https://www.google.com'; // "open chrome" with no site/query given — go somewhere useful, not a blank search
  if (/^https?:\/\//i.test(s)) return s;
  const key = s.toLowerCase();
  if (SITE_SHORTCUTS[key]) return `https://${SITE_SHORTCUTS[key]}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(s)) return `https://${s}`;
  return `https://www.google.com/search?q=${encodeURIComponent(s)}`;
}

async function resolveBrowserPort(where, browserName) {
  return where === 'phone' ? ensurePhoneBrowser() : ensurePCBrowser(browserName);
}

async function browserOpen(where, browserName, urlOrQuery) {
  const port = await resolveBrowserPort(where, browserName);
  const url = toUrlOrSearch(urlOrQuery);
  return withBrowserTab(port, async (client) => {
    const { Page } = client;
    await Page.enable();
    const navPromise = Page.loadEventFired();
    await Page.navigate({ url });
    await Promise.race([navPromise, new Promise((r) => setTimeout(r, 6000))]);
    await new Promise((r) => setTimeout(r, 800)); // let the page settle before anything reads/clicks it
    return url;
  });
}

// This is the "understanding" part — it asks the page itself what's
// visible and interactive, rather than guessing from a screenshot. Far
// more reliable, and works with any local text-only model since there's
// no image involved at all.
const SCAN_SCRIPT = `
(function(){
  const els = Array.from(document.querySelectorAll('a, button, input, textarea, select, [role="button"], [onclick]'));
  const visible = els.filter(el => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 4 && r.height > 4 && style.visibility !== 'hidden' && style.display !== 'none';
  });
  return visible.slice(0, 60).map((el, i) => {
    const r = el.getBoundingClientRect();
    const label = (el.innerText || el.value || el.placeholder || el.getAttribute('aria-label') || el.getAttribute('title') || el.name || '').trim().replace(/\\s+/g,' ').slice(0, 60);
    const hasHeading = !!el.querySelector('h1, h2, h3');
    return { i, tag: el.tagName.toLowerCase(), type: el.type || '', label, hasHeading, x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
  });
})()
`.trim();

function portFor(where) {
  return where === 'phone' ? PHONE_BROWSER_DEBUG_PORT : BROWSER_DEBUG_PORT;
}

async function browserRead(where) {
  return withBrowserTab(portFor(where), async (client) => {
    const { Runtime } = client;
    await Runtime.enable();
    const result = await Runtime.evaluate({ expression: SCAN_SCRIPT, returnByValue: true });
    return result.result.value || [];
  });
}

const ORDINAL_WORDS = { first: 0, '1st': 0, top: 0, second: 1, '2nd': 1, third: 2, '3rd': 2, fourth: 3, '4th': 3, fifth: 4, '5th': 4 };
function parseOrdinal(text) {
  const m = (text || '').toLowerCase().match(/\b(first|1st|top|second|2nd|third|3rd|fourth|4th|fifth|5th)\b/);
  return m ? ORDINAL_WORDS[m[1]] : null;
}

async function browserClick(where, textHint) {
  return withBrowserTab(portFor(where), async (client) => {
    const { Runtime, Input } = client;
    await Runtime.enable();
    const result = await Runtime.evaluate({ expression: SCAN_SCRIPT, returnByValue: true });
    const scan = result.result.value || [];
    const ord = parseOrdinal(textHint);
    let target;
    if (ord !== null) {
      // "open/click/enter the first link/result" — position-based. Prefer
      // links that wrap a heading (h1-h3), which is how virtually every
      // search engine marks up an actual result — this avoids counting
      // nav-bar links (Images, Videos, Sign in, etc.) as "link #1, #2...".
      // Falls back to all links if the page doesn't have that pattern.
      const links = scan.filter((e) => e.tag === 'a');
      const resultLinks = links.filter((e) => e.hasHeading);
      const pool = resultLinks.length ? resultLinks : links;
      target = pool[ord];
      if (!target) throw new Error(`Couldn't find that many links on the page (only found ${pool.length}).`);
    } else {
      const q = (textHint || '').toLowerCase().trim();
      target = scan.find((e) => e.label.toLowerCase() === q) || scan.find((e) => e.label.toLowerCase().includes(q));
      if (!target) throw new Error(`Couldn't find anything on the page matching "${textHint}". Try describing it differently (its exact visible text works best), or say "the first link/result" for position-based clicking.`);
    }
    await Input.dispatchMouseEvent({ type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await Input.dispatchMouseEvent({ type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    return target;
  });
}

async function browserType(where, fieldHint, text) {
  return withBrowserTab(portFor(where), async (client) => {
    const { Runtime, Input } = client;
    await Runtime.enable();
    // Finds the target field AND clears its existing value directly via the
    // DOM (not a keyboard shortcut) before we click+type — this is the
    // actual fix: the previous version clicked and inserted text without
    // clearing first, so retyping into the same field (e.g. Google's search
    // box after a search already ran) appended onto old text instead of
    // replacing it, same bug class as the earlier WhatsApp search issue.
    const hintJson = JSON.stringify(fieldHint || '');
    const findAndClearScript = `
(function(){
  const hint = ${hintJson}.toLowerCase().trim();
  const els = Array.from(document.querySelectorAll('input, textarea'));
  const visible = els.filter(el => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 4 && r.height > 4 && style.visibility !== 'hidden' && style.display !== 'none';
  });
  let target = null;
  if (hint) {
    target = visible.find(el => ((el.placeholder||'') + ' ' + (el.getAttribute('aria-label')||'') + ' ' + (el.name||'') + ' ' + (el.id||'')).toLowerCase().includes(hint));
  }
  if (!target) target = visible[0];
  if (!target) return null;
  target.focus();
  target.value = '';
  target.dispatchEvent(new Event('input', { bubbles: true }));
  const r = target.getBoundingClientRect();
  return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) };
})()
`.trim();
    const result = await Runtime.evaluate({ expression: findAndClearScript, returnByValue: true });
    const target = result.result.value;
    if (!target) throw new Error('No text field found on the page to type into.');
    await Input.dispatchMouseEvent({ type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await Input.dispatchMouseEvent({ type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1 });
    await Input.insertText({ text: text || '' });
    return target;
  });
}

async function browserSubmit(where) {
  return withBrowserTab(portFor(where), async (client) => {
    const { Input } = client;
    await Input.dispatchKeyEvent({ type: 'keyDown', windowsVirtualKeyCode: 13, key: 'Enter' });
    await Input.dispatchKeyEvent({ type: 'keyUp', windowsVirtualKeyCode: 13, key: 'Enter' });
    return true;
  });
}

// =================================================================
// File locate/search — "find my Q3 report" / "open explorer where
// that pdf is" style requests from Parzi. Two endpoints:
//   /files/search  — searches common folders for a name/extension match
//   /files/locate  — reveals a specific file in Explorer/Finder
// Deliberately scoped to a fixed, small set of everyday folders rather
// than the whole disk — fast, predictable, and avoids scanning things
// like node_modules or system directories.
// =================================================================
const FILE_FORMAT_LABELS = {
  '.xlsx': 'Excel spreadsheet', '.xls': 'Excel spreadsheet', '.csv': 'CSV spreadsheet',
  '.docx': 'Word document', '.doc': 'Word document', '.pdf': 'PDF document',
  '.pptx': 'PowerPoint deck', '.ppt': 'PowerPoint deck', '.txt': 'text file',
  '.png': 'PNG image', '.jpg': 'JPEG image', '.jpeg': 'JPEG image',
  '.zip': 'ZIP archive', '.json': 'JSON file', '.md': 'Markdown file',
};
function formatLabelFor(ext) {
  return FILE_FORMAT_LABELS[ext.toLowerCase()] || (ext ? `${ext.replace('.', '').toUpperCase()} file` : 'file');
}

function searchRoots() {
  const home = os.homedir();
  const roots = [
    path.join(home, 'Documents'),
    path.join(home, 'Downloads'),
    path.join(home, 'Desktop'),
    path.join(home, 'OneDrive', 'Documents'),
    path.join(home, 'OneDrive', 'Desktop'),
  ];
  return roots.filter((r) => {
    try { return fs.statSync(r).isDirectory(); } catch { return false; }
  });
}

const SKIP_DIRS = new Set(['node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information']);

function walkSearch(query, fileType, maxResults = 20, maxDepth = 4) {
  const q = (query || '').toLowerCase().trim();
  const ext = fileType ? `.${fileType.replace(/^\./, '').toLowerCase()}` : '';
  const results = [];

  function walk(dir, depth) {
    if (depth > maxDepth || results.length >= maxResults * 4) return; // gather a bit extra, then sort+trim
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, depth + 1);
      } else if (entry.isFile()) {
        const nameExt = path.extname(entry.name).toLowerCase();
        if (ext && nameExt !== ext) continue;
        if (q && !entry.name.toLowerCase().includes(q)) continue;
        if (!q && !ext) continue; // require at least one filter
        let stat;
        try { stat = fs.statSync(full); } catch { continue; }
        results.push({
          path: full,
          name: entry.name,
          ext: nameExt,
          formatLabel: formatLabelFor(nameExt),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        });
      }
    }
  }

  for (const root of searchRoots()) walk(root, 0);
  results.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  return results.slice(0, maxResults);
}

function revealInExplorer(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath || typeof filePath !== 'string') return reject(new Error('Invalid file path.'));
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) return reject(new Error(`File no longer exists at ${resolvedPath}`));

    if (PLATFORM === 'win32') {
      // explorer.exe /select,"<resolvedPath>" without shell exec interpolation
      execFile('explorer.exe', [`/select,${resolvedPath}`], { windowsHide: false }, () => resolve(true));
    } else if (PLATFORM === 'darwin') {
      execFile('open', ['-R', resolvedPath], () => resolve(true));
    } else {
      execFile('xdg-open', [path.dirname(resolvedPath)], () => resolve(true));
    }
  });
}

// =================================================================
// HTTP server
// =================================================================
function send(res, status, body) {
  const headers = {
    'Content-Type': 'application/json',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Parzi-Token',
  };
  const origin = res._req ? getCorsOrigin(res._req) : null;
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

let divineProcess = null;

async function checkDivineStatus() {
  try {
    const r = await fetch('http://127.0.0.1:4173', { signal: AbortSignal.timeout(1500) });
    return { running: true, url: 'http://127.0.0.1:4173', status: r.status };
  } catch {
    return { running: false, url: 'http://127.0.0.1:4173' };
  }
}

function launchDivineServer() {
  return new Promise((resolve) => {
    checkDivineStatus().then((st) => {
      if (st.running) {
        return resolve({ ok: true, message: 'Already running', url: st.url });
      }
      const gevDir = path.join(__dirname, 'divines eye', 'gev-build');
      const isWin = PLATFORM === 'win32';
      const cmd = isWin ? 'npm.cmd' : 'npm';
      divineProcess = spawn(cmd, ['run', 'dev'], {
        cwd: gevDir,
        detached: true,
        stdio: 'ignore',
        shell: true,
      });
      divineProcess.unref();
      setTimeout(async () => {
        const check = await checkDivineStatus();
        resolve({
          ok: true,
          message: 'Launched Divine Eye server',
          running: check.running,
          url: 'http://127.0.0.1:4173',
        });
      }, 2500);
    });
  });
}

/**
 * Internet Search Sandbox
 * Fetches verified present-day knowledge from Wikipedia and DuckDuckGo.
 */
async function searchWeb(query, limit = 5) {
  if (!query || !query.trim()) return [];
  const results = [];
  const cleanQ = query.trim();

  // 1. Wikipedia API - factual encyclopedia data
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQ)}&format=json&utf8=1&origin=*`;
    const wRes = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'ParziCompanion/2.0 (Intelligent Voice Companion)' },
      signal: AbortSignal.timeout(5000),
    });
    if (wRes.ok) {
      const wData = await wRes.json();
      const items = wData?.query?.search || [];
      for (const item of items.slice(0, 3)) {
        const title = item.title;
        const snippet = (item.snippet || '')
          .replace(/<span class="searchmatch">/g, '')
          .replace(/<\/span>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&amp;/g, '&');
        const link = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
        if (snippet.trim()) {
          results.push({
            title: `Wikipedia: ${title}`,
            link,
            snippet,
            source: 'wikipedia',
          });
        }
      }
    }
  } catch (err) {
    console.warn('Companion Wikipedia search failed:', err.message);
  }

  // 2. DuckDuckGo Instant Answer API
  try {
    const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(cleanQ)}&format=json&no_html=1&skip_disambig=1`;
    const dRes = await fetch(ddgApiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000),
    });
    if (dRes.ok) {
      const dData = await dRes.json();
      if (dData.AbstractText) {
        results.push({
          title: dData.Heading || cleanQ,
          link: dData.AbstractURL || 'https://duckduckgo.com',
          snippet: dData.AbstractText,
          source: 'duckduckgo',
        });
      }
      if (Array.isArray(dData.RelatedTopics)) {
        for (const topic of dData.RelatedTopics.slice(0, 2)) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 60),
              link: topic.FirstURL,
              snippet: topic.Text,
              source: 'duckduckgo',
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Companion DDG API search failed:', err.message);
  }

  // 3. DuckDuckGo HTML search for broader coverage
  if (results.length < limit) {
    try {
      const ddgHtmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQ)}`;
      const hRes = await fetch(ddgHtmlUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(6000),
      });
      if (hRes.ok) {
        const html = await hRes.text();
        const snippetMatches = [...html.matchAll(/class="result__snippet[^>]*>(.*?)<\/a>/gs)];
        const linkMatches = [...html.matchAll(/class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gs)];

        for (let i = 0; i < Math.min(linkMatches.length, snippetMatches.length, limit); i++) {
          let link = linkMatches[i][1];
          const unwrap = link.match(/uddg=([^&]+)/);
          if (unwrap) link = decodeURIComponent(unwrap[1]);
          const rawTitle = linkMatches[i][2]?.replace(/<[^>]+>/g, '').trim() || '';
          const rawSnippet = snippetMatches[i][1]?.replace(/<[^>]+>/g, '').trim() || '';
          if (rawTitle && rawSnippet) {
            results.push({
              title: rawTitle,
              link,
              snippet: rawSnippet,
              source: 'duckduckgo',
            });
          }
        }
      }
    } catch (err) {
      console.warn('Companion DDG HTML search failed:', err.message);
    }
  }

  return results.slice(0, limit);
}

const server = http.createServer((req, res) => {
  res._req = req;

  if (req.method === 'OPTIONS') return send(res, 204, {});

  // Require secret token on all state-changing POST requests
  if (req.method === 'POST') {
    const token = req.headers['x-parzi-token'];
    if (!token || token !== COMPANION_TOKEN) {
      return send(res, 401, { ok: false, error: 'Unauthorized: missing or invalid X-Parzi-Token' });
    }
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

  if (req.method === 'GET' && reqUrl.pathname === '/health') {
    getDevice().then((device) => send(res, 200, { ok: true, platform: PLATFORM, adbDevice: device }));
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/search') {
    const q = reqUrl.searchParams.get('q') || '';
    const limit = parseInt(reqUrl.searchParams.get('limit') || '5', 10);
    searchWeb(q, limit).then((results) => send(res, 200, { ok: true, query: q, results }));
    return;
  }

  if (req.method === 'GET' && reqUrl.pathname === '/divine/status') {
    checkDivineStatus().then((st) => send(res, 200, st));
    return;
  }

  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', async () => {
    let parsed = {};
    try {
      parsed = body ? JSON.parse(body) : {};
    } catch {
      /* ignore bad JSON, parsed stays {} */
    }

    try {
      if (req.method === 'POST' && req.url === '/open-app') {
        const target = parsed.target === 'phone' ? 'phone' : 'pc'; // defaults to PC
        if (target === 'phone') {
          const pkg = await openAppOnPhone(parsed.app);
          send(res, 200, { ok: true, target, package: pkg });
        } else {
          const resolved = await openAppOnPC(parsed.app);
          send(res, 200, { ok: true, target, resolved });
        }
      } else if (req.method === 'POST' && req.url === '/call') {
        const number = await callContact(parsed.contact);
        send(res, 200, { ok: true, number });
      } else if (req.method === 'POST' && req.url === '/whatsapp/open') {
        const target = parsed.target === 'phone' ? 'phone' : 'pc';
        const number = target === 'phone'
          ? await whatsappOpenPhone(parsed.contact, parsed.message)
          : await whatsappOpenPC(parsed.contact, parsed.message);
        send(res, 200, { ok: true, target, number });
      } else if (req.method === 'POST' && req.url === '/whatsapp/type') {
        const target = parsed.target === 'phone' ? 'phone' : 'pc';
        if (target === 'phone') {
          // Phone side re-opens the wa.me link with new text — safe here since
          // it's a direct deep link (not a stateful search box like the PC).
          await whatsappOpenPhone(parsed.contact, parsed.message);
        } else {
          await whatsappTypeOnlyPC(parsed.message);
        }
        send(res, 200, { ok: true, target });
      } else if (req.method === 'POST' && req.url === '/whatsapp/send') {
        const target = parsed.target === 'phone' ? 'phone' : 'pc';
        const result = target === 'phone' ? await whatsappTapSendPhone() : await whatsappSendPC();
        send(res, 200, { ok: true, target, result });
      } else if (req.method === 'POST' && req.url === '/whatsapp/call') {
        const target = parsed.target === 'phone' ? 'phone' : 'pc';
        const result = target === 'phone' ? await whatsappTapCallPhone() : await whatsappCallPC();
        send(res, 200, { ok: true, target, result });
      } else if (req.method === 'POST' && req.url === '/tap-test') {
        // Calibration helper for the PHONE tap-hack: POST {"xPct":0.5,"yPct":0.5}.
        const device = await getDevice();
        if (!device) throw new Error('No phone connected.');
        const tap = await tapPct(device, parsed.xPct ?? 0.5, parsed.yPct ?? 0.5);
        send(res, 200, { ok: true, tap });
      } else if (req.method === 'POST' && req.url === '/pc-click-test') {
        // Calibration helper for the PC click-hack: POST {"xPct":0.5,"yPct":0.5}.
        const result = await clickInWhatsappWindow(parsed.xPct ?? 0.5, parsed.yPct ?? 0.5);
        send(res, 200, { ok: true, result });
      } else if (req.method === 'POST' && req.url === '/browser/open') {
        const where = parsed.target === 'phone' ? 'phone' : 'pc';
        const url = await browserOpen(where, parsed.browser || 'edge', parsed.url || '');
        send(res, 200, { ok: true, where, url });
      } else if (req.method === 'POST' && req.url === '/browser/read') {
        const where = parsed.target === 'phone' ? 'phone' : 'pc';
        const elements = await browserRead(where);
        send(res, 200, { ok: true, elements });
      } else if (req.method === 'POST' && req.url === '/browser/click') {
        const where = parsed.target === 'phone' ? 'phone' : 'pc';
        const target = await browserClick(where, parsed.text);
        send(res, 200, { ok: true, target });
      } else if (req.method === 'POST' && req.url === '/browser/type') {
        const where = parsed.target === 'phone' ? 'phone' : 'pc';
        const target = await browserType(where, parsed.field, parsed.text);
        send(res, 200, { ok: true, target });
      } else if (req.method === 'POST' && req.url === '/browser/submit') {
        const where = parsed.target === 'phone' ? 'phone' : 'pc';
        await browserSubmit(where);
        send(res, 200, { ok: true });
      } else if (req.method === 'POST' && req.url === '/files/search') {
        const matches = walkSearch(parsed.query || '', parsed.fileType || '');
        send(res, 200, { ok: true, matches });
      } else if (req.method === 'POST' && (reqUrl.pathname === '/search' || req.url === '/search')) {
        const q = parsed.query || parsed.q || '';
        const limit = parseInt(parsed.limit || '5', 10);
        const results = await searchWeb(q, limit);
        send(res, 200, { ok: true, query: q, results });
      } else if (req.method === 'POST' && (reqUrl.pathname === '/divine/launch' || req.url === '/divine/launch')) {
        const launched = await launchDivineServer();
        send(res, 200, launched);
      } else {
        send(res, 404, { ok: false, error: 'Unknown endpoint' });
      }
    } catch (e) {
      send(res, 200, { ok: false, error: e.message });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Parzi companion server running at http://127.0.0.1:${PORT}  (platform: ${PLATFORM})`);
  console.log(`🔑 Companion Security Token: ${COMPANION_TOKEN}`);
  console.log('   (Enter this token in Parzi Settings > Companion App to authorize commands)');
  console.log('PC app-opening is ready to use right now — try "open notepad" / "open chrome".');
  console.log('File search/locate is ready too — try "find my Q3 report" (searches Documents/Downloads/Desktop/OneDrive).');
  getDevice().then((device) => {
    if (device) console.log(`Phone connected: ${device} — phone app-opening and calling are ready too.`);
    else console.log('No phone detected — plug one in via USB with USB debugging on if you want phone app-opening/calling. PC app-opening works fine without it.');
  });
});
