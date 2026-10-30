/**
 * Divine's Eye 12th Tab & Parzi Assistant Integration
 * -------------------------------------------------------------------
 * Ultra-compact, non-intrusive floating HUD with inline typing,
 * live telemetry bridge, offline model adaptation, and present-day
 * Internet Search Sandbox.
 * -------------------------------------------------------------------
 */

class DivineEyeManager {
  constructor(app) {
    this.app = app;
    this.orb = null;
    this.iframe = null;
    this.isMinimized = false;
    this.telemetryPollTimer = null;
    this.active = false;
    this.lastResponseText = '';
    this.telemetry = {
      ok: false,
      camera: { lat: '0.00', lon: '0.00', altMeters: 0, altFt: 0, heading: '0.0', pitch: '0.0' },
      locality: 'Global Overview',
      target: null,
      activeLayers: [],
      style: 'NORMAL',
      timestamp: null
    };

    this._bindBridge();
  }

  init() {
    this.iframe = document.getElementById('divineEyeFrame');
    const canvas = document.getElementById('parziDivineOrbCanvas');

    if (canvas && typeof JarvisOrb !== 'undefined' && !this.orb) {
      this.orb = new JarvisOrb(canvas, 42, { palette: 'divine' });
      window.parziDivineOrb = this.orb;
      this.orb.pause();
    }

    // Ensure iframe is pointing to Divine's Eye
    if (this.iframe && (!this.iframe.src || this.iframe.src === 'about:blank')) {
      const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      this.iframe.src = isLocalHost ? 'http://localhost:4173' : './divines-eye/index.html';
    }
  }

  onTabOpen() {
    this.active = true;
    if (this.orb) this.orb.resume();

    // Start periodic telemetry poll
    this.requestTelemetry();
    clearInterval(this.telemetryPollTimer);
    this.telemetryPollTimer = setInterval(() => {
      if (this.active) this.requestTelemetry();
    }, 2500);
  }

  onTabClose() {
    this.active = false;
    clearInterval(this.telemetryPollTimer);
    if (this.orb) this.orb.pause();
    this.closeResponse();
  }

  _bindBridge() {
    window.addEventListener('message', (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === 'PARZI_TELEMETRY_RESPONSE') {
        const d = ev.data.data;
        if (d && d.ok) {
          this.telemetry = d;
          this._updateTelemetryUI();
        }
      }
    });
  }

  requestTelemetry() {
    if (!this.iframe || !this.iframe.contentWindow) return;
    try {
      this.iframe.contentWindow.postMessage({ type: 'PARZI_GET_TELEMETRY' }, '*');
    } catch (e) {
      // Cross-origin iframe loading
    }
  }

  _updateTelemetryUI() {
    const t = this.telemetry;
    const targetText = document.getElementById('divineTargetText');
    const targetLabel = document.getElementById('divineTargetLabel');

    if (!targetText) return;

    if (t.target) {
      const targetName = t.target.name || t.target.id || 'Active Contact';
      const callsign = t.target.properties?.callsign || t.target.properties?.flight || '';
      const displayStr = callsign ? `${callsign}` : (targetName.length > 14 ? targetName.slice(0, 12) + '…' : targetName);
      targetText.textContent = displayStr.toUpperCase();
      if (targetLabel) targetLabel.title = `Locked Contact: ${targetName} (${callsign || 'No callsign'}) — Click to analyze`;
    } else {
      const loc = t.locality ? (t.locality.length > 16 ? t.locality.slice(0, 14) + '…' : t.locality) : 'GLOBAL VIEW';
      targetText.textContent = loc.toUpperCase();
      if (targetLabel) targetLabel.title = `Current View: ${t.locality || 'Earth'} — Click to analyze`;
    }
  }

  setOrbState(state, text) {
    if (this.orb) this.orb.setState(state);
    const dot = document.getElementById('divineStatusDot');
    const txt = document.getElementById('divineStatusText');

    if (dot) {
      dot.className = 'divine-status-dot';
      if (state !== 'idle') dot.classList.add(state);
    }
    if (txt) {
      txt.textContent = text || `PARZI · ${state.toUpperCase()}`;
    }
  }

  onOrbClick() {
    if (this.isMinimized) {
      this.toggleMinimize();
    } else {
      this.toggleVoice();
    }
  }

  toggleMinimize() {
    const bar = document.getElementById('divineHudBar');
    const minBtn = document.getElementById('divineMinBtn');
    if (!bar) return;

    this.isMinimized = !this.isMinimized;
    bar.classList.toggle('minimized', this.isMinimized);
    if (minBtn) minBtn.textContent = this.isMinimized ? '＋' : '—';
    if (minBtn) minBtn.title = this.isMinimized ? 'Expand HUD' : 'Minimize to Orb';
  }

  toggleVoice() {
    if (!this.app.parzi) return;

    if (this.app.parzi.active) {
      this.app.parzi.stop();
      this.setOrbState('idle', 'PARZI · READY');
      document.getElementById('divineVoiceToggle')?.classList.remove('active');
    } else {
      this.app.parzi.start();
      this.setOrbState('listening', 'PARZI · LISTENING…');
      document.getElementById('divineVoiceToggle')?.classList.add('active');
    }
  }

  /**
   * INLINE TYPING HANDLER:
   * Takes the typed input, analyzes telemetry, performs web search sandbox if needed,
   * queries the local offline model, and displays the response non-intrusively.
   */
  async sendInlineInput() {
    const input = document.getElementById('divineInlineInput');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;
    input.value = '';

    this.requestTelemetry();
    this.setOrbState('thinking', 'ANALYZING…');
    this._showResponse('Thinking… Analyzing Divine\'s Eye data…');

    // Check if web search sandbox is needed
    const needsSearch = /\b(who\s+owns|which\s+president|president|famous\s+guy|celebrity|vip|who\s+is\s+flying|tail\s+number|current\s+news|what\s+happened|latest\s+news|owner|who|flight\s+[a-z0-9]+)\b/i.test(query);
    let searchContext = '';
    let searchSources = [];

    if (needsSearch) {
      this.setOrbState('thinking', 'SEARCHING INTEL…');
      try {
        const searchTarget = this.telemetry.target?.name || this.telemetry.locality || '';
        const fullQ = searchTarget ? `${searchTarget} ${query}` : query;
        searchSources = await this.app.performWebSearch(fullQ);
        if (searchSources && searchSources.length > 0) {
          searchContext = `\n\n[VERIFIED PRESENT-DAY SEARCH RESULTS FOR: "${fullQ}"]\n` +
            searchSources.slice(0, 3).map(r => `• ${r.title}: ${r.snippet} (${r.link})`).join('\n') +
            `\n[END SEARCH RESULTS — Use these verified real-world facts to answer the user's question directly]`;
        }
      } catch (err) {
        console.warn('Sandbox search error:', err);
      }
    }

    const t = this.telemetry;
    const prompt = `You are Parzi, a concise, high-tech AI tactical advisor for Divine's Eye reconnaissance console.
Current Scene Telemetry:
- Location: ${t.locality || 'Coordinates'} (${t.camera?.lat || '0'}°N, ${t.camera?.lon || '0'}°E, Alt: ${t.camera?.altFt || '0'} ft)
- Active Target: ${t.target ? `${t.target.name} (ID: ${t.target.id}, Props: ${JSON.stringify(t.target.properties || {})})` : 'None locked'}
- Feeds: ${(t.activeLayers || []).join(', ') || 'Global Map'}
${searchContext}

User Query: "${query}"

Provide a direct, informative, tactical answer in 1-3 sentences.`;

    await this._callModelAndDisplay(prompt, searchSources);
  }

  /**
   * One-click tactical scene analysis.
   */
  async analyzeScene() {
    this.requestTelemetry();
    this.setOrbState('thinking', 'ANALYZING SCENE…');
    this._showResponse('Analyzing current coordinates and locked contacts…');

    await new Promise(r => setTimeout(r, 350));

    const t = this.telemetry;
    const targetDetails = t.target
      ? `Locked Contact: ${t.target.name || t.target.id}, Details: ${JSON.stringify(t.target.properties || {})}`
      : 'None (Broad panoramic observation view)';

    const prompt = `You are Parzi, tactical AI advisor for Divine's Eye.
Telemetry:
- Viewport: ${t.locality || 'Coordinates'} (${t.camera?.lat || '0'}°N, ${t.camera?.lon || '0'}°E, Alt: ${t.camera?.altFt || '0'} ft)
- Target: ${targetDetails}
- Estimated Route: ${t.route ? `${t.route.from} ➔ ${t.route.to}` : 'None'}
- Nearest Contacts: ${t.nearestContact || 'None'}
- Active Feeds: ${(t.activeLayers || []).join(', ') || 'Global Map'}

Give a sharp, punchy 2-sentence tactical intelligence briefing describing what this airspace/ground location is and what the active target is doing.`;

    await this._callModelAndDisplay(prompt);
  }

  async searchIntelPrompt() {
    const t = this.telemetry;
    const defaultQ = t.target
      ? `${t.target.name} ${t.target.properties?.callsign || ''} owner president`
      : `${t.locality || 'Air Force One'} president`;

    const input = document.getElementById('divineInlineInput');
    if (input) {
      input.value = defaultQ;
      input.focus();
    }
  }

  async _callModelAndDisplay(prompt, searchSources = []) {
    const model = this.app.parzi?.settings?.model || this.app.settings?.selectedModel;
    if (!model) {
      this._showResponse('⚠️ No offline model selected. Please pick a model in Settings or Parzi Assistant tab.');
      this.setOrbState('idle', 'PARZI · READY');
      return;
    }

    const { apiUrl, apiKey, backendType } = this.app.settings;
    const payload = {
      model,
      messages: [
        { role: 'system', content: 'You are Parzi, a concise local tactical voice and text AI. Keep answers clear, factual, and 1-3 sentences.' },
        { role: 'user', content: prompt }
      ],
      stream: false
    };

    const endpoint = backendType === 'openai' ? `${apiUrl}/v1/chat/completions` : `${apiUrl}/api/chat`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Model API HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.message?.content || data.choices?.[0]?.message?.content || 'No intel available.';

      this.lastResponseText = reply;
      this._showResponse(reply, searchSources);
      this.setOrbState('speaking', 'PARZI · INTEL');

      // Speak answer using VoiceManager
      if (this.app.voice && typeof this.app.voice.speak === 'function') {
        const cleanToSpeak = reply.replace(/[#*`_\[\]\(\)]/g, '').slice(0, 260);
        this.app.voice.speak(cleanToSpeak, () => {
          this.setOrbState('idle', 'PARZI · READY');
        });
      } else {
        setTimeout(() => this.setOrbState('idle', 'PARZI · READY'), 3000);
      }
    } catch (e) {
      this._showResponse(`⚠️ Model error: ${e.message}`);
      this.setOrbState('idle', 'PARZI · READY');
    }
  }

  _showResponse(text, sources = []) {
    const card = document.getElementById('divineHudResponse');
    const textEl = document.getElementById('divineResponseText');
    const sourcesEl = document.getElementById('divineResponseSources');
    if (!card || !textEl) return;

    textEl.innerHTML = this.app.renderMd ? this.app.renderMd(text) : text.replace(/\n/g, '<br>');

    if (sources && sources.length && sourcesEl) {
      sourcesEl.innerHTML = sources.slice(0, 2).map(s => `
        <span>🔗 <a href="${s.link}" target="_blank" rel="noopener noreferrer">${s.title}</a></span>
      `).join('');
    } else if (sourcesEl) {
      sourcesEl.innerHTML = '';
    }

    card.style.display = 'flex';
  }

  closeResponse() {
    const card = document.getElementById('divineHudResponse');
    if (card) card.style.display = 'none';
  }

  copyResponse() {
    if (this.lastResponseText) {
      navigator.clipboard.writeText(this.lastResponseText);
      toast('Intel copied to clipboard', 'success');
    }
  }
}

// Attach to global window
window.DivineEyeManager = DivineEyeManager;
