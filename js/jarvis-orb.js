/**
 * Parzi Jarvis Orb
 * ------------------------------------------------------------
 * Vanilla-JS canvas renderer, ported from the JarvisOrb React
 * component. Draws a HUD-style animated orb (rotating rings,
 * neural nodes, center glow) and reacts to 4 states:
 *   'idle' | 'listening' | 'thinking' | 'speaking'
 *
 * Usage:
 *   const orb = new JarvisOrb(document.getElementById('parziOrbCanvas'), 280);
 *   orb.setState('listening');
 * ------------------------------------------------------------
 */
class JarvisOrb {
  constructor(canvas, size = 280, options = {}) {
    this.canvas = canvas;
    this.size = size;
    this.options = options;
    this.state = 'idle';
    this._displaySpeed = 0.7; // eased speed multiplier, smoothly chases target
    this._paused = false;
    this._stateChangedAt = performance.now();
    this.ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    this.ctx.scale(dpr, dpr);

    this.cx = size / 2;
    this.cy = size / 2;

    this.nodes = Array.from({ length: 14 }, (_, i) => ({
      baseAngle: (i / 14) * Math.PI * 2,
      radius: 48 + ((i * 7) % 3) * 26,
      speed: 0.0018 + ((i * 3) % 5) * 0.0006,
      dir: i % 2 === 0 ? 1 : -1,
      size: 2.2 + ((i * 11) % 3),
      pulseOffset: (i / 14) * Math.PI * 2,
    }));

    // Vivid, multi-hue rings (teal / gold / violet)
    const isDivine = options.palette === 'divine';
    this.ringsDef = isDivine ? [
      { r: 38, speed: 0.013, width: 1.3, dash: [6, 4], color: 'rgba(0,240,255,0.9)' },
      { r: 62, speed: -0.008, width: 1.6, dash: [4, 6], color: 'rgba(45,224,200,0.7)' },
      { r: 88, speed: 0.006, width: 1.2, dash: [10, 6], color: 'rgba(50,255,160,0.65)' },
      { r: 110, speed: -0.004, width: 1.6, dash: [3, 10], color: 'rgba(0,210,255,0.5)' },
      { r: 128, speed: 0.003, width: 1.0, dash: [16, 4], color: 'rgba(45,224,200,0.45)' },
    ] : [
      { r: 38, speed: 0.012, width: 1.2, dash: [6, 4], color: 'rgba(120,225,255,0.85)' },
      { r: 62, speed: -0.007, width: 1.6, dash: [3, 8], color: 'rgba(255,196,110,0.5)' },
      { r: 88, speed: 0.005, width: 1.1, dash: [10, 6], color: 'rgba(45,224,200,0.55)' },
      { r: 110, speed: -0.004, width: 1.6, dash: [2, 12], color: 'rgba(178,140,255,0.4)' },
      { r: 128, speed: 0.003, width: 0.9, dash: [16, 4], color: 'rgba(91,141,246,0.3)' },
    ];
    this.ringAngles = this.ringsDef.map(() => Math.random() * Math.PI * 2);

    this._raf = requestAnimationFrame((ts) => this._draw(ts));

    // Pause rendering when the browser tab itself isn't visible — saves
    // CPU/battery and stops the "why does everything lag" background drain.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pause();
      else this.resume();
    });
  }

  setState(state) {
    if (state !== this.state) this._stateChangedAt = performance.now();
    this.state = state;
  }

  pause() {
    if (this._paused) return;
    this._paused = true;
    cancelAnimationFrame(this._raf);
  }

  resume() {
    if (!this._paused) return;
    this._paused = false;
    this._raf = requestAnimationFrame((ts) => this._draw(ts));
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }

  _draw(ts) {
    const { ctx, size } = this;
    const cx = 140, cy = 140; // reference dimensions for HUD
    const s = this.state;
    const targetSpeed = s === 'thinking' ? 2.8 : s === 'speaking' ? 1.6 : s === 'listening' ? 1.2 : 0.7;
    this._displaySpeed += (targetSpeed - this._displaySpeed) * 0.06;
    const speedMult = this._displaySpeed;

    const breathe = 1 + Math.sin(ts * 0.0009) * 0.012;
    const baseScale = (this.size / 280) * breathe;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(baseScale, baseScale);
    ctx.translate(-cx, -cy);

    const rings = this.ringsDef;
    rings.forEach((ring, i) => {
      this.ringAngles[i] += ring.speed * speedMult;
    });

    // Outer HUD ring with tick marks
    ctx.save();
    const outerR = 135;
    ctx.strokeStyle = 'rgba(91,141,246,0.25)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    const tickOffset = this.ringAngles[0] * 0.3;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2 + tickOffset;
      const major = i % 6 === 0;
      const r1 = outerR;
      const r2 = major ? outerR - 7 : outerR - 3.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.strokeStyle = major ? 'rgba(91,141,246,0.8)' : 'rgba(91,141,246,0.25)';
      ctx.lineWidth = major ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Arc segments (4 corner arcs — JARVIS HUD corners)
    const arcGap = 0.3;
    const arcR = outerR + 8;
    const arcAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    arcAngles.forEach((a) => {
      const rot = this.ringAngles[4];
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, a + rot + arcGap, a + rot + Math.PI / 2 - arcGap);
      ctx.strokeStyle = 'rgba(45,224,200,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();
    });
    ctx.restore();

    // Rotating dashed rings
    rings.forEach((ring, i) => {
      ctx.save();
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width;
      ctx.setLineDash(ring.dash);
      ctx.lineDashOffset = -this.ringAngles[i] * (ring.r * 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Neural nodes
    const t = ts * 0.001;
    const nodePositions = this.nodes.map((n) => {
      const angle = n.baseAngle + t * n.speed * speedMult * n.dir * 100;
      let r = n.radius;
      if (s === 'speaking') r += Math.sin(t * 6 + n.pulseOffset) * 6;
      else if (s === 'listening') r += Math.sin(t * 3 + n.pulseOffset) * 3;
      else r += Math.sin(t * 1.1 + n.pulseOffset) * 1.5;
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        size: n.size,
        brightness: s === 'speaking' ? 0.7 + Math.abs(Math.sin(t * 5 + n.pulseOffset)) * 0.3 : 1,
      };
    });

    // Synaptic connections
    ctx.save();
    ctx.setLineDash([]);
    for (let i = 0; i < nodePositions.length; i++) {
      for (let j = i + 1; j < nodePositions.length; j++) {
        const np = nodePositions[i];
        const nq = nodePositions[j];
        const dx = np.x - nq.x;
        const dy = np.y - nq.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = s === 'thinking' ? 90 : 75;
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * (s === 'thinking' ? 0.3 : 0.18);
          ctx.beginPath();
          ctx.moveTo(np.x, np.y);
          ctx.lineTo(nq.x, nq.y);
          ctx.strokeStyle = `rgba(91,141,246,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // Draw nodes
    nodePositions.forEach((np) => {
      ctx.save();
      const grd = ctx.createRadialGradient(np.x, np.y, 0, np.x, np.y, np.size * 3.4);
      grd.addColorStop(0, `rgba(160,240,255,${1.0 * np.brightness})`);
      grd.addColorStop(0.35, `rgba(80,220,190,${0.5 * np.brightness})`);
      grd.addColorStop(1, 'rgba(91,141,246,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(np.x, np.y, np.size * 3.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(220,250,255,${np.brightness})`;
      ctx.beginPath();
      ctx.arc(np.x, np.y, np.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Center brain glow
    ctx.save();
    const innerPulse = s === 'speaking' ? 0.4 + Math.abs(Math.sin(t * 4)) * 0.35 : s === 'listening' ? 0.3 + Math.abs(Math.sin(t * 2)) * 0.2 : 0.32 + Math.abs(Math.sin(t * 1.1)) * 0.08;
    const innerColor = s === 'speaking' ? `rgba(80,240,220,${innerPulse + 0.2})` : s === 'thinking' ? `rgba(255,190,90,${innerPulse + 0.1})` : `rgba(130,190,255,${innerPulse + 0.1})`;

    const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    cGrd.addColorStop(0, innerColor);
    cGrd.addColorStop(0.5, s === 'speaking' ? 'rgba(45,224,200,0.14)' : 'rgba(91,141,246,0.14)');
    cGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = cGrd;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fill();

    // Center icon (brain symbol using arcs)
    ctx.strokeStyle = s === 'speaking' ? 'rgba(45,224,200,0.7)' : s === 'thinking' ? 'rgba(240,167,50,0.7)' : 'rgba(138,180,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx - 5, cy, 9, -Math.PI * 0.8, Math.PI * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 5, cy, 9, Math.PI * 0.2, Math.PI * 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx, cy + 6);
    ctx.stroke();
    ctx.restore();

    // Speaking: outward wave arcs
    if (s === 'speaking') {
      const waveCount = 10;
      for (let i = 0; i < waveCount; i++) {
        const phase = t * 5 + (i / waveCount) * Math.PI * 2;
        const amplitude = 10 + Math.sin(phase) * 9;
        const waveR = 136 + amplitude;
        const arcSpan = (Math.PI * 2) / waveCount;
        const arcStart = (i / waveCount) * Math.PI * 2 + this.ringAngles[0] * 0.5;
        const arcEnd = arcStart + arcSpan * 0.55;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, waveR, arcStart, arcEnd);
        const alpha = 0.35 + Math.sin(phase) * 0.25;
        ctx.strokeStyle = `rgba(45,224,200,${Math.max(0.05, alpha)})`;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Listening: outward ripple rings
    if (s === 'listening') {
      const ripplePhase = (ts % 1600) / 1600;
      const rippleR = 130 + ripplePhase * 25;
      const rippleAlpha = (1 - ripplePhase) * 0.45;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(91,141,246,${rippleAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();

      const ripplePhase2 = ((ts + 800) % 1600) / 1600;
      const rippleR2 = 130 + ripplePhase2 * 25;
      const rippleAlpha2 = (1 - ripplePhase2) * 0.3;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, rippleR2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(91,141,246,${rippleAlpha2})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();
    }

    // Thinking: rapid scan wedge
    if (s === 'thinking') {
      const scanAngle = (ts * 0.004) % (Math.PI * 2);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR - 5, scanAngle, scanAngle + 0.5);
      ctx.closePath();
      const wedgeGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      wedgeGrd.addColorStop(0, 'rgba(91,141,246,0.0)');
      wedgeGrd.addColorStop(0.5, 'rgba(91,141,246,0.12)');
      wedgeGrd.addColorStop(1, 'rgba(91,141,246,0.0)');
      ctx.fillStyle = wedgeGrd;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // closes the breathe scale transform from the top of _draw

    if (!this._paused) this._raf = requestAnimationFrame((nts) => this._draw(nts));
  }
}

// Auto-init once the DOM is ready, so app.js doesn't need to manage this.
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('parziOrbCanvas');
  if (canvas) {
    window.parziJarvisOrb = new JarvisOrb(canvas, 280);
    const parziView = document.getElementById('view-parzi');
    if (!parziView || !parziView.classList.contains('active')) {
      window.parziJarvisOrb.pause();
    }
  }
});
