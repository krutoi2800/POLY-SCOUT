/* POLY PLAYGROUND — procedural original ambient music + weather (no audio downloads). */
(() => {
  'use strict';
  class PlaygroundAudio {
    constructor(mode = 'farm') {
      this.mode = mode;
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.rainBus = null;
      this.musicOn = false;
      this.rainOn = false;
      this.step = 0;
      this.nextBeat = 0;
      this.interval = 0;
      this.rainSource = null;
      this.rainGain = null;
    }
    async ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.56; this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.mode === 'farm' ? 0.26 : 0.17; this.musicBus.connect(this.master);
        this.rainBus = this.ctx.createGain(); this.rainBus.gain.value = 0; this.rainBus.connect(this.master);
      }
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return true;
    }
    note(freq, at, dur = 0.36, kind = 'triangle', vol = 0.35) {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = kind; o.frequency.setValueAtTime(freq, at);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), at + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o.connect(g); g.connect(this.musicBus); o.start(at); o.stop(at + dur + 0.04);
    }
    farmBeat(t) {
      // An original gently cycling pentatonic melody with warm bass intervals.
      const melody = [64,67,69,72,69,67,64,60,62,64,67,69,67,64,62,60,
        64,69,72,76,74,69,67,64,62,67,69,72,69,67,64,62];
      const bass = [48,48,53,53,45,45,43,43];
      const freq = m => 440 * 2 ** ((m - 69) / 12);
      const n = this.step % melody.length;
      if (n % 2 === 0 || n % 7 === 0) this.note(freq(melody[n]), t, n%4===0?.95:.57, 'sine', n%4===0?.31:.24);
      if (n % 4 === 0) {
        this.note(freq(bass[Math.floor(n/4)]), t, 1.7, 'triangle', .20);
        this.note(freq(bass[Math.floor(n/4)]+7), t+.085, 1.15, 'sine', .10);
      }
    }
    arcadeBeat(t) {
      // Playful original ragtime-ish melodic loop, not a copy of any game score.
      const melody = [72,76,79,76,74,77,81,77,76,79,83,79,72,76,79,76,74,77,81,77,71,74,77,74,72,76,79,76,71,74,77,71];
      const freq = m => 440*2**((m-69)/12), n=this.step%melody.length;
      this.note(freq(melody[n]),t,.19,n%2?'triangle':'square',.17);
      if(n%2===0) this.note(freq([48,55,53,55][Math.floor(n/8)]),t,.21,'triangle',.16);
      if(n%4===2) this.note(freq(melody[n]-12),t,.13,'sine',.11);
    }
    schedule() {
      if (!this.musicOn || !this.ctx) return;
      const beat = this.mode==='farm'?.39:.19;
      const now = this.ctx.currentTime;
      if (this.nextBeat < now) this.nextBeat = now + .025;
      while(this.nextBeat < now + .22) {
        if(this.mode==='farm') this.farmBeat(this.nextBeat); else this.arcadeBeat(this.nextBeat);
        this.nextBeat += beat; this.step++;
      }
    }
    async toggleMusic(force) {
      if(!await this.ensure()) return false;
      this.musicOn=typeof force==='boolean'?force:!this.musicOn;
      if(this.musicOn){this.nextBeat=this.ctx.currentTime+.04;clearInterval(this.interval);this.schedule();this.interval=window.setInterval(()=>this.schedule(),90);}
      else {clearInterval(this.interval);this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);this.musicBus.gain.setTargetAtTime(0,this.ctx.currentTime,.08);window.setTimeout(()=>{if(this.musicBus&&!this.musicOn)this.musicBus.gain.setValueAtTime(this.mode==='farm'?.26:.17,this.ctx.currentTime);},400);}
      return this.musicOn;
    }
    async setRain(active) {
      if(!await this.ensure()) return false;
      this.rainOn=!!active;
      if (!this.rainSource) {
        // Filtered stereo noise: continuous soft rain, without loops/files/network.
        const length = this.ctx.sampleRate * 4;
        const buffer = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        for(let channel=0;channel<2;channel++) {
          const data=buffer.getChannelData(channel); let last=0;
          for(let i=0;i<length;i++){last=(last*.965)+(Math.random()*2-1)*.035;data[i]=last*.9+(Math.random()*2-1)*.05;}
        }
        const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;
        const lowpass=this.ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=1550;
        const gain=this.ctx.createGain();gain.gain.value=1;
        source.connect(lowpass);lowpass.connect(gain);gain.connect(this.rainBus);
        source.start();this.rainSource=source;this.rainGain=gain;
      }
      this.rainBus.gain.setTargetAtTime(active?.92:0,this.ctx.currentTime,.45);
      return this.rainOn;
    }
    effect(type='pop') {
      if(!this.ctx) return;
      const base=this.ctx.currentTime+.01;
      if(type==='ult') {for(let i=0;i<8;i++)this._fxTone(230+i*100,base+i*.035,.28,.18,'triangle');return;}
      if(type==='hit') {this._fxTone(330,base,.13,.13,'triangle');return;}
      if(type==='lose'){this._fxTone(210,base,.45,.16,'sine');return;}
      if(type==='jump'){this._fxTone(480,base,.11,.11,'sine');return;}
      if(type==='shot'){this._fxTone(750,base,.075,.065,'triangle');return;}
      this._fxTone(660,base,.16,.1,'sine');
    }
    _fxTone(freq,at,dur,vol,type){const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(freq*.74,at+dur);g.gain.setValueAtTime(vol,at);g.gain.exponentialRampToValueAtTime(.0001,at+dur);osc.connect(g);g.connect(this.master);osc.start(at);osc.stop(at+dur+.03);}
    suspend() {if(this.ctx&&this.ctx.state==='running')this.ctx.suspend();}
    resume() {if(this.ctx&&this.ctx.state==='suspended'&&(this.musicOn||this.rainOn))this.ctx.resume();}
  }
  window.PlaygroundAudio=PlaygroundAudio;
})();
