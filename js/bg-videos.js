/**
 * Parzi UI — Per-tab background video controller + opening screen + clap/snap wake
 * ------------------------------------------------------------
 * Video allocation:
 *   chat                     -> models-tools-dashboard.mp4
 *   ledger                   -> chat-network.mp4
 *   knowledge, ragspaces     -> knowledge-ragspaces-ai.mp4
 *   workspace, promptlib     -> spaces-promptlib-list.mp4
 *   models, tools            -> models-tools-dashboard.mp4
 *   graph                    -> graph-analytics.mp4
 *   parzi, settings          -> parzibg.mp4
 *
 * Opening screen:
 *   Uses opening.mp4 (plays ONCE). Near end, shows "ENTER SYSTEM" button.
 *   Auto-dismisses when video ends.
 *
 * Clap/snap wake:
 *   Listens for 2 sharp percussion impulses (claps or snaps) within 1400ms
 *   to activate Parzi Assistant and greet "Hi Hari, how can I help you?".
 * ------------------------------------------------------------
 */
(function () {
  const BG_MAP = {
    ledger: 'assets/bg/chat-network.mp4',
  };

  const videos = {}; // tabId -> <video>

  function inject(tabId, src) {
    const section = document.getElementById(`view-${tabId}`);
    if (!section || section.querySelector('.view-bgvideo-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'view-bgvideo-wrap';
    wrap.setAttribute('aria-hidden', 'true');

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.preload = 'auto';
    video.setAttribute('aria-hidden', 'true');
    video.dataset.src = src;
    wrap.appendChild(video);
    videos[tabId] = video;

    section.insertBefore(wrap, section.firstChild);
  }

  function activate(tabId) {
    Object.entries(videos).forEach(([id, vid]) => {
      if (id !== tabId) {
        vid.pause();
        vid.classList.remove('is-visible');
      }
    });

    const video = videos[tabId];
    if (!video) return;

    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
    }
    video.classList.add('is-visible');
    const playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(() => { });
    }

    const section = document.getElementById(`view-${tabId}`);
    if (section) {
      section.classList.remove('animate-tab-enter');
      void section.offsetWidth;
      section.classList.add('animate-tab-enter');
    }
  }

  /* ══════════════════════════════════════════════════
     OPENING SCREEN now lives in js/parzi-intro-orb.js
     (orb mouse-morph poster + GSAP ScrollTrigger
     scrollytelling). Kept as a thin shim here so the
     rest of this file's call sites don't need to change.
     ══════════════════════════════════════════════════ */
  function setupIntro() {
    if (window.setupParziIntro) window.setupParziIntro();
  }

  function hookAppSwitchTab() {
    if (typeof app !== 'undefined' && typeof app.switchTab === 'function') {
      if (!app._bgSwitchHooked) {
        const originalSwitchTab = app.switchTab.bind(app);
        app.switchTab = function (id) {
          originalSwitchTab(id);
          activate(id);
        };
        app._bgSwitchHooked = true;
      }
      const activeSection = document.querySelector('.view.active');
      if (activeSection) activate(activeSection.id.replace('view-', ''));
    } else {
      setTimeout(hookAppSwitchTab, 50);
    }
  }

  /* ══════════════════════════════════════════════════
     TIME-DOMAIN WAVEFORM CLAP & SNAP WAKE DETECTOR
     ══════════════════════════════════════════════════
     Uses Web Audio time-domain PCM peak deviation & high-frequency
     transient tracking to detect 2 continuous claps or snaps within 1400ms.
  ══════════════════════════════════════════════════ */
  const WINDOW_MS = 1400; // Max window between 2 snaps/claps
  const MIN_GAP_MS = 90;   // Min gap between distinct impulses

  let _clapAudioCtx = null;
  let _clapAnalyser = null;
  let _clapStream = null;
  let _clapRaf = null;
  let _clapTimes = [];
  let _inSpike = false;
  let _lastImpulse = 0;

  let _clapEnabled = false;   // controlled by the toggle button

  function _syncClapUI() {
    var on = !!_clapStream;
    var dot = document.getElementById("clapDot");
    var txt = document.getElementById("clapText");
    if (dot) dot.style.background = on ? "var(--teal)" : "var(--amber)";
    if (txt) txt.textContent       = on ? "Snap Wake: ON" : "Snap Wake: OFF";
    var qb  = document.getElementById("clapWakeQuickBtn");
    if (qb) {
      qb.textContent          = on ? "\uD83D\uDC4F Snap Wake: ON" : "\uD83D\uDC4F Snap Wake: OFF";
      qb.style.borderColor    = on ? "var(--teal)" : "var(--border2)";
      qb.style.color          = on ? "var(--teal)" : "var(--text2)";
      qb.style.background     = on ? "rgba(45,224,200,0.10)" : "";
    }
    var sb  = document.getElementById("clapWakeSideBtn");
    var ss  = document.getElementById("clapSideStatus");
    if (sb) {
      sb.textContent         = on ? "\uD83D\uDFE2 Switch OFF" : "\uD83D\uDD34 Switch ON";
      sb.style.background    = on ? "rgba(45,224,200,0.12)" : "rgba(224,96,96,0.10)";
      sb.style.borderColor   = on ? "var(--teal)" : "var(--red)";
      sb.style.color         = on ? "var(--teal)" : "var(--red)";
    }
    if (ss) ss.textContent = on ? "\u2705 Clap Wake is ON \u2014 snap twice to wake Parzi" : "Clap Wake is off";
  }
  window.toggleClapWake = async function () {
    if (_clapStream) {
      // TURN OFF
      cancelAnimationFrame(_clapRaf); _clapRaf = null;
      _clapStream.getTracks().forEach(t => t.stop()); _clapStream = null;
      if (_clapAudioCtx) { _clapAudioCtx.close().catch(() => {}); _clapAudioCtx = null; }
      _clapAnalyser = null; _clapTimes = []; _inSpike = false;
      _clapEnabled = false;
      _syncClapUI();
      if (typeof toast === "function") toast("Clap/Snap Wake turned OFF", "info");
    } else {
      // TURN ON
      _clapEnabled = true;
      await startClapWake(true);
    }
  };

  async function startClapWake(userInitiated) {
    if (_clapStream) return;
    try {
      _clapStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      console.warn('Parzi clap-wake: mic permission pending/denied.', e);
      const clapDot = document.getElementById('clapDot');
      const clapText = document.getElementById('clapText');
      if (clapDot) clapDot.style.background = 'var(--red)';
      if (clapText) clapText.innerText = 'Clap Wake: Mic blocked (click to fix)';
      if (userInitiated && typeof toast === 'function') {
        toast('🎙️ Microphone access denied or blocked by browser settings: ' + e.message, 'error');
      }
      return;
    }

    _clapAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (_clapAudioCtx.state === 'suspended') {
      await _clapAudioCtx.resume().catch(() => { });
    }

    const src = _clapAudioCtx.createMediaStreamSource(_clapStream);
    _clapAnalyser = _clapAudioCtx.createAnalyser();
    _clapAnalyser.fftSize = 512;
    src.connect(_clapAnalyser);

    const timeData = new Uint8Array(_clapAnalyser.fftSize);
    const freqData = new Uint8Array(_clapAnalyser.frequencyBinCount);

    const clapDot = document.getElementById('clapDot');
    const clapText = document.getElementById('clapText');
    if (clapDot) clapDot.style.background = 'var(--green)';
    if (clapText) clapText.innerText = 'Clap Wake: Active 👏';
    _syncClapUI();   // sync all toggle buttons to ON state

    if (userInitiated && typeof toast === 'function') {
      toast('🟢 Clap & Snap Wake Active! Snap or clap 2 times continuously.', 'success');
    }

    function tick() {
      if (!_clapStream) { cancelAnimationFrame(_clapRaf); return; }

      // Don't trigger clap wake or pop up toasts while Parzi is actively engaged/conversing!
      if (typeof app !== 'undefined' && app.parzi && app.parzi.active) {
        _clapTimes = [];
        _inSpike = false;
        _clapRaf = requestAnimationFrame(tick);
        return;
      }

      _clapAnalyser.getByteTimeDomainData(timeData);
      _clapAnalyser.getByteFrequencyData(freqData);

      // 1. Time domain waveform amplitude peak deviation from baseline (128)
      let maxDev = 0;
      for (let i = 0; i < timeData.length; i++) {
        const dev = Math.abs(timeData[i] - 128);
        if (dev > maxDev) maxDev = dev;
      }

      // 2. High frequency energy (> 1.5kHz)
      let highSum = 0;
      const startBin = Math.floor(freqData.length / 4);
      for (let i = startBin; i < freqData.length; i++) {
        highSum += freqData[i];
      }
      const highAvg = highSum / (freqData.length - startBin) / 255;

      const now = Date.now();
      // Threshold: peak deviation >= 18 (out of 128) OR high frequency peak >= 0.15
      const isImpulse = (maxDev >= 18) || (highAvg >= 0.15 && maxDev >= 12);

      if (!_inSpike && isImpulse && (now - _lastImpulse > MIN_GAP_MS)) {
        _inSpike = true;
        _lastImpulse = now;

        _clapTimes.push(now);
        _clapTimes = _clapTimes.filter(t => now - t <= WINDOW_MS);

        if (_clapTimes.length === 1) {
          if (typeof toast === 'function') {
            toast('👏 1 snap/clap detected! (Snap once more now...)', 'info');
          }
        } else if (_clapTimes.length >= 2) {
          _clapTimes = [];
          if (typeof toast === 'function') {
            toast('✨ Double Snap/Clap Detected! Waking Parzi...', 'success');
          }
          _onDoubleClap();
        }
      } else if (_inSpike && maxDev < 10 && highAvg < 0.08) {
        _inSpike = false;
      }

      _clapRaf = requestAnimationFrame(tick);
    }
    tick();
  }

  function _onDoubleClap() {
    const parziView = document.getElementById('view-parzi');
    const isVisible = parziView && parziView.classList.contains('active');
    if (!isVisible && typeof app !== 'undefined' && typeof app.switchTab === 'function') {
      app.switchTab('parzi');
    }

    setTimeout(() => {
      const parzi = (typeof app !== 'undefined') ? app.parzi : null;
      if (!parzi) return;

      if (!parzi.active) {
        const greeting = 'Hi Hari, how can I help you?';

        if (parzi._addBubble) parzi._addBubble('ai', '👋 ' + greeting);

        const speakGreeting = () => {
          if (parzi.app && parzi.app.voice && typeof parzi.app.voice.speak === 'function') {
            if (parzi._setOrb) parzi._setOrb('speaking', 'Hi Hari…');
            parzi.app.voice.speak(greeting).then(() => {
              if (parzi.start) parzi.start();
            }).catch(() => {
              if (parzi.start) parzi.start();
            });
          } else {
            const utt = new SpeechSynthesisUtterance(greeting);
            utt.onend = () => { if (parzi.start) parzi.start(); };
            speechSynthesis.speak(utt);
          }
        };

        if (parzi.settings && !parzi.settings.model) {
          if (parzi._addBubble) parzi._addBubble('ai', '⚠️ Select a model in Parzi settings first.');
        } else {
          speakGreeting();
        }
      }
    }, 300);
  }

  function setupClapWakeEvents() {
    // Only resume AudioContext on user gesture; do NOT auto-start mic.
    // Clap wake now starts only when the user explicitly enables it via the button.
    const resumeCtx = () => {
      if (_clapAudioCtx && _clapAudioCtx.state === "suspended") {
        _clapAudioCtx.resume().catch(() => {});
      }
    };
    ["pointerdown", "click", "keydown", "touchstart"].forEach(evtName => {
      document.addEventListener(evtName, resumeCtx, { passive: true });
    });
    // Do NOT auto-start: wait for the user to click the button.
  }

  /* ══════════════════════════════════════════════════ */

  function init() {
    Object.keys(BG_MAP).forEach(tabId => inject(tabId, BG_MAP[tabId]));
    setupIntro();
    hookAppSwitchTab();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        Object.values(videos).forEach(v => v.pause());
      } else {
        const activeSection = document.querySelector('.view.active');
        if (activeSection) activate(activeSection.id.replace('view-', ''));
      }
    });

    setupClapWakeEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
