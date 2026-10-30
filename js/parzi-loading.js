/**
 * Parzi UI — Cinematic opening splash controller
 * ------------------------------------------------------------
 * Plays assets/bg/opening.mp4 once. Progress bar tracks the video's own
 * currentTime/duration (the "scroll progress" of a splash screen), smoothed
 * with a lerp each animation frame for a buttery, non-jumpy fill — the same
 * smoothing idea as a scroll-scrubbed hero, just driven by playback time
 * instead of scrollY since there's nothing to scroll here.
 *
 * Content reveals in a staggered fade-up (translateY 10px -> 0, opacity
 * 0 -> 1) via the [data-reveal] elements' own transition-delay, triggered
 * by adding .reveal-in to the overlay shortly after paint.
 *
 * Dismisses automatically when the video ends, or via the ENTER SYSTEM
 * button / window.dismissParziIntro(). Seen-state persists per tab via
 * sessionStorage so it only plays once per session. window.replayParziIntro()
 * (wired to the sidebar logo) replays it on demand.
 * ------------------------------------------------------------
 */
(function () {
  function setup() {
    const overlay = document.getElementById('parziIntroOverlay');
    if (!overlay) return;

    const seen = sessionStorage.getItem('parzi_intro_seen');
    if (seen === 'true') {
      overlay.style.display = 'none';
      return;
    }

    const vid = document.getElementById('parziOpeningVideo');
    const bar = document.getElementById('parziIntroProgressBar');
    let raf = null;

    function revealIn() {
      overlay.classList.remove('reveal-in');
      // double rAF so the initial (hidden) state paints before transitioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add('reveal-in'));
      });
    }

    function startProgressLoop() {
      if (raf) cancelAnimationFrame(raf);
      let smoothed = 0;
      function frame() {
        if (vid && vid.duration) {
          const target = Math.min(1, vid.currentTime / vid.duration);
          smoothed += (target - smoothed) * 0.12;
          if (bar) bar.style.width = (smoothed * 100).toFixed(2) + '%';
        }
        if (vid && !vid.ended && !overlay.classList.contains('dismissed')) {
          raf = requestAnimationFrame(frame);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function playVideo() {
      if (!vid) return;
      vid.currentTime = 0;
      const p = vid.play();
      if (p && p.catch) p.catch(() => { });
    }

    overlay.style.display = 'flex';
    revealIn();
    playVideo();
    startProgressLoop();

    if (vid) {
      vid.addEventListener('ended', () => {
        window.dismissParziIntro && window.dismissParziIntro();
      });
    }

    // Safety net: if the video can't load/play, still let the bar fill and
    // the button remains clickable throughout, so no one gets stuck.
    setTimeout(() => {
      if (bar && !overlay.classList.contains('dismissed')) bar.style.width = '100%';
    }, 12000);

    window.dismissParziIntro = function () {
      overlay.classList.add('dismissed');
      sessionStorage.setItem('parzi_intro_seen', 'true');
      if (raf) cancelAnimationFrame(raf);
      if (vid) { try { vid.pause(); } catch (e) { } }
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 650);
    };

    window.replayParziIntro = function () {
      sessionStorage.removeItem('parzi_intro_seen');
      overlay.style.display = 'flex';
      overlay.classList.remove('dismissed');
      if (bar) bar.style.width = '0%';
      playVideo();
      revealIn();
      startProgressLoop();
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
