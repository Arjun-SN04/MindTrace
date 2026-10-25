// All game audio is synthesized with the Web Audio API, so there are no
// third-party sound files to license. The context starts only after a user gesture.

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private rainGain!: GainNode;
  private rainFilter!: BiquadFilterNode;
  private musicGain!: GainNode;
  private noise!: AudioBuffer;
  private volume = 0.7;
  private indoors = false;

  /** Call from a click/keypress handler. Safe to call repeatedly. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(ctx.destination);

    // Shared noise buffer (2 s of pink-ish noise).
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.18;
    }

    this.startRain();
    this.startMusic();
  }

  private startRain() {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.value = 5200;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 400;
    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;
    src.connect(hp).connect(this.rainFilter).connect(this.rainGain).connect(this.master);
    src.start();
    this.rainGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2.5);

    // Low city rumble underneath.
    const rumble = ctx.createBufferSource();
    rumble.buffer = this.noise;
    rumble.loop = true;
    rumble.playbackRate.value = 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    const g = ctx.createGain();
    g.gain.value = 0.5;
    rumble.connect(lp).connect(g).connect(this.master);
    rumble.start();
  }

  private startMusic() {
    // A restrained, slowly shifting minor drone.
    const ctx = this.ctx!;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 2;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();
    for (const [freq, detune] of [[55, -6], [55, 7], [82.41, 0], [130.81, 4]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = ctx.createGain();
      g.gain.value = freq > 100 ? 0.05 : 0.09;
      osc.connect(g).connect(filter);
      osc.start();
    }
    filter.connect(this.musicGain).connect(this.master);
    this.musicGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 6);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
  }

  setIndoors(indoors: boolean) {
    if (!this.ctx || indoors === this.indoors) return;
    this.indoors = indoors;
    const t = this.ctx.currentTime;
    this.rainFilter.frequency.setTargetAtTime(indoors ? 700 : 5200, t, 0.4);
    this.rainGain.gain.setTargetAtTime(indoors ? 0.3 : 0.55, t, 0.4);
  }

  private burst(opts: { freq: number; q: number; gain: number; decay: number; type?: BiquadFilterType; rate?: number }) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = opts.rate ?? 1;
    const f = ctx.createBiquadFilter();
    f.type = opts.type ?? 'bandpass';
    f.frequency.value = opts.freq;
    f.Q.value = opts.q;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(opts.gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + opts.decay + 0.05);
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', delay = 0) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  footstep(running: boolean) {
    const wet = !this.indoors;
    this.burst({
      freq: wet ? 1400 + Math.random() * 500 : 260 + Math.random() * 80,
      q: wet ? 0.8 : 1.4,
      gain: (running ? 0.5 : 0.32) * (wet ? 0.8 : 1.2),
      decay: wet ? 0.12 : 0.09,
    });
  }

  land() {
    this.burst({ freq: 300, q: 1, gain: 0.6, decay: 0.18 });
  }

  ui() {
    this.tone(880, 0.08, 0.05, 'triangle');
  }

  evidence() {
    this.tone(523.25, 0.5, 0.07, 'triangle');
    this.tone(783.99, 0.7, 0.06, 'triangle', 0.09);
  }

  insight() {
    this.tone(392, 0.6, 0.06, 'sine');
    this.tone(587.33, 0.9, 0.05, 'sine', 0.12);
    this.tone(880, 1.1, 0.03, 'sine', 0.24);
  }

  error() {
    this.tone(160, 0.25, 0.08, 'square');
  }

  door() {
    this.burst({ freq: 500, q: 6, gain: 0.25, decay: 0.5, rate: 0.4 });
    this.burst({ freq: 120, q: 1, gain: 0.4, decay: 0.25, type: 'lowpass' });
  }
}

export const audio = new AudioEngine();
