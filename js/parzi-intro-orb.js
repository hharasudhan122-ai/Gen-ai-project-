/* ════════════════════════════════════════════════════════════════════
   PARZI INTRO — Orbit-style flower hero + GSAP scrollytelling
   - Page 1 is a literal recreation of the Orbit poster template:
     brand mark, nav, pill, split-color wordmark, and a mouse
     morph-reveal flower (two stacked images + an organic blob-trail
     mask, exactly per the spec's MorphTrailLayer architecture).
     Colors/fonts are kept as specified even though they don't match
     Parzi's usual palette — that was an explicit ask.
   - Pages 2–3 (about Parzi / the 11 tabs) are unchanged from before.
   - GSAP + ScrollTrigger drive the 3-page scrollytelling sequence
     inside its own isolated scroller, modeled on the Cicada-style
     crossfade pattern.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  const TRAIL_MAX_POINTS = 60;
  const TRAIL_HEAD_R = 140;
  const TRAIL_NOISE_AMP = 44;
  const TRAIL_BLOB_PTS = 24;
  const TRAIL_FADE_SPEED = 0.92;
  const TRAIL_SAMPLE_DIST = 8;

  function drawMorphBlob(ctx, cx, cy, r, t, seed) {
    if (r < 2) return;
    const pts = [];
    for (let i = 0; i < TRAIL_BLOB_PTS; i++) {
      const angle = (i / TRAIL_BLOB_PTS) * Math.PI * 2;
      const n1 = Math.sin(angle * 3 + t * 1.4 + seed) * 0.45;
      const n2 = Math.sin(angle * 5 - t * 0.9 + seed * 2.3) * 0.3;
      const n3 = Math.cos(angle * 2 + t * 1.8 + seed * 0.7) * 0.25;
      const noise = (n1 + n2 + n3) * TRAIL_NOISE_AMP * (r / TRAIL_HEAD_R);
      const rad = r + noise;
      pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad]);
    }
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % pts.length];
      const mx = (p0[0] + p1[0]) / 2;
      const my = (p0[1] + p1[1]) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(p0[0], p0[1], mx, my);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* MorphTrailLayer — hidden offscreen canvas whose toDataURL() drives
     the CSS mask-image of a visible, cover-fit <img> layer. Two of
     these share one trail: the FRONT/BG layer punches holes
     (destination-out), the REVEAL/TOP layer paints the same shape in
     white so it only shows through the trail. Exactly the spec's
     architecture, just implemented against real images now. */
  function makeMorphTrailLayer(container, invert) {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'none';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    return {
      canvas,
      ctx,
      resize(w, h, dpr) {
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      },
      render(w, h, points, t) {
        ctx.clearRect(0, 0, w, h);
        if (invert) {
          // REVEAL/TOP: clear canvas, paint white blobs — only the
          // trail shape is opaque, everything else stays masked out.
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#fff';
          points.forEach((p) => {
            ctx.globalAlpha = p.alpha;
            drawMorphBlob(ctx, p.x, p.y, p.r, t, p.seed);
          });
          ctx.globalAlpha = 1;
        } else {
          // FRONT/BG: white fill, then punch holes where the trail is.
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'destination-out';
          points.forEach((p) => {
            ctx.fillStyle = `rgba(0,0,0,${p.alpha})`;
            drawMorphBlob(ctx, p.x, p.y, p.r, t, p.seed);
          });
          ctx.globalCompositeOperation = 'source-over';
        }
      },
    };
  }

  function setupFlowerHero() {
    const flower = document.getElementById('ohFlower');
    const stage = document.getElementById('orbitHero');
    if (!flower || !stage) return null;

    const bgLayer = flower.querySelector('.oh-flower__layer--bg');
    const topLayer = flower.querySelector('.oh-flower__layer--top');
    if (!bgLayer || !topLayer) return null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bgTrail = makeMorphTrailLayer(flower, false);
    const topTrail = makeMorphTrailLayer(flower, true);

    let w = 0, h = 0;
    let hovering = false;
    let mx = 0, my = 0;
    let headRadius = 0;
    const points = [];
    let lastSampleX = null, lastSampleY = null;
    let time = 0;
    let rafId = null;

    function resize() {
      const rect = flower.getBoundingClientRect();
      w = rect.width; h = rect.height;
      bgTrail.resize(w, h, dpr);
      topTrail.resize(w, h, dpr);
    }

    function toLocal(clientX, clientY) {
      const rect = flower.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onMove(e) {
      const p = toLocal(e.clientX, e.clientY);
      mx = p.x; my = p.y;
      hovering = p.x >= 0 && p.y >= 0 && p.x <= w && p.y <= h;
    }
    function onLeave() { hovering = false; }

    stage.addEventListener('mousemove', onMove, { passive: true });
    stage.addEventListener('mouseenter', onMove, { passive: true });
    stage.addEventListener('mouseleave', onLeave, { passive: true });

    function tick() {
      time += 0.016;

      const targetR = hovering ? TRAIL_HEAD_R : 0;
      headRadius += (targetR - headRadius) * (hovering ? 0.14 : 0.04);

      if (hovering && headRadius > 5) {
        if (lastSampleX === null || Math.hypot(mx - lastSampleX, my - lastSampleY) > TRAIL_SAMPLE_DIST) {
          points.push({ x: mx, y: my, r: headRadius, alpha: 1, seed: Math.random() * 100 });
          if (points.length > TRAIL_MAX_POINTS) points.shift();
          lastSampleX = mx; lastSampleY = my;
        }
      }

      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        p.alpha *= TRAIL_FADE_SPEED;
        p.r *= 0.995;
        if (p.alpha < 0.01) points.splice(i, 1);
      }

      bgTrail.render(w, h, points, time);
      topTrail.render(w, h, points, time);

      const bgUrl = `url(${bgTrail.canvas.toDataURL()})`;
      const topUrl = `url(${topTrail.canvas.toDataURL()})`;
      bgLayer.style.maskImage = bgUrl;
      bgLayer.style.webkitMaskImage = bgUrl;
      bgLayer.style.maskSize = '100% 100%';
      bgLayer.style.webkitMaskSize = '100% 100%';
      bgLayer.style.maskRepeat = 'no-repeat';
      bgLayer.style.webkitMaskRepeat = 'no-repeat';

      topLayer.style.maskImage = topUrl;
      topLayer.style.webkitMaskImage = topUrl;
      topLayer.style.maskSize = '100% 100%';
      topLayer.style.webkitMaskSize = '100% 100%';
      topLayer.style.maskRepeat = 'no-repeat';
      topLayer.style.webkitMaskRepeat = 'no-repeat';

      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);

    // Entrance choreography — pure-CSS keyframes fire while
    // .oh-pending is present; drop it once everything has settled
    // (base rules already match the animated end-state, so this is
    // a clean no-op visually, not a reset).
    stage.classList.add('oh-pending');
    const introTimer = setTimeout(() => {
      stage.classList.remove('oh-pending');
    }, 2400);

    return {
      destroy() {
        if (rafId) cancelAnimationFrame(rafId);
        clearTimeout(introTimer);
        stage.removeEventListener('mousemove', onMove);
        stage.removeEventListener('mouseenter', onMove);
        stage.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('resize', resize);
      },
    };
  }

  /* ── Scroll-to-Enter (single page) ──────────────────────────── */
  function setupScrolly() {
    const overlay  = document.getElementById('parziIntroOverlay');
    const stage    = document.getElementById('pioStage');
    const page     = document.querySelector('.pio-page');
    const scroller = document.getElementById('pioScroller');
    const track    = document.getElementById('pioTrack');
    const hint     = document.getElementById('ohScrollHint');
    if (!overlay || !stage || !page || !scroller || !track) return;

    // Give the track just enough height so the user can scroll — 200vh
    // means one full viewport of scroll travel before trigger fires.
    track.style.height = '200vh';
    scroller.scrollTop = 0;

    let triggered = false;

    // Mirror scroll progress onto the page as pure vertical drift + fade —
    // NO horizontal scale so the flower never drifts away from the R-Z gap.
    function render(progress) {
      const opacity = 1 - progress * 0.45;           // 1.0 → 0.55, fades as user scrolls
      const ty      = progress * 32;                 // subtle upward drift in px
      // Only translateY — keeping transform-origin irrelevant to horizontal position
      page.style.transform = `translateY(-${ty.toFixed(1)}px)`;
      page.style.opacity   = opacity.toFixed(3);
      if (hint) hint.style.opacity = Math.max(0, 1 - progress * 6).toFixed(3);

      // Fire dismissal once user has scrolled > 40% of the track
      if (!triggered && progress >= 0.4) {
        triggered = true;
        setTimeout(() => {
          window.dismissParziIntro && window.dismissParziIntro();
        }, 120);
      }
    }

    render(0);

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      window.__pioScrollTrigger = ScrollTrigger.create({
        trigger: track,
        scroller: scroller,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.45,
        onUpdate: (self) => render(self.progress),
      });
    } else {
      scroller.addEventListener('scroll', () => {
        const max = scroller.scrollHeight - scroller.clientHeight;
        render(max > 0 ? scroller.scrollTop / max : 0);
      }, { passive: true });
    }

    return scroller;
  }

  window.setupParziIntro = function () {
    const overlay = document.getElementById('parziIntroOverlay');
    if (!overlay) return;

    const seen = sessionStorage.getItem('parzi_intro_seen');
    if (seen === 'true') {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'block';
    overlay.classList.remove('pio-dismissed');

    const flowerHero = setupFlowerHero();
    const scroller = setupScrolly();

    window.dismissParziIntro = function () {
      overlay.classList.add('pio-dismissed');
      sessionStorage.setItem('parzi_intro_seen', 'true');
      setTimeout(() => {
        overlay.style.display = 'none';
        if (flowerHero) flowerHero.destroy();
      }, 650);
    };

    window.replayParziIntro = function () {
      sessionStorage.removeItem('parzi_intro_seen');
      overlay.style.display = 'block';
      overlay.classList.remove('pio-dismissed');
      const scroller = document.getElementById('pioScroller');
      if (scroller) scroller.scrollTop = 0;
      if (flowerHero) flowerHero.destroy();
      window.setupParziIntro();
    };
  };

  // Invoked by js/bg-videos.js's init() via the setupIntro() shim —
  // not self-triggered here, to avoid double-initializing.
})();
