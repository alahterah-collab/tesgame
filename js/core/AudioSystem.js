export class AudioSystem {
  constructor() { this.ctx=null;this.master=null;this.sfxGain=null;this.ambientGain=null;this.volume=.55;this.muted=false;this.ambientStarted=false;this.noiseBuffer=null; }
  ensure() {
    if (this.ctx) { if(this.ctx.state==='suspended') this.ctx.resume().catch(()=>{});return true; }
    try {
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.volume;this.master.connect(this.ctx.destination);
      this.sfxGain=this.ctx.createGain();this.sfxGain.gain.value=.8;this.sfxGain.connect(this.master);
      this.ambientGain=this.ctx.createGain();this.ambientGain.gain.value=.045;this.ambientGain.connect(this.master);
      const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*1.3,this.ctx.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(.7+.3*Math.sin(i*.006));
      this.noiseBuffer=buffer;return true;
    } catch { return false; }
  }
  startAmbient() {
    if(!this.ensure()||this.ambientStarted)return;this.ambientStarted=true;
    const c=this.ctx;
    const droneA=c.createOscillator(),droneB=c.createOscillator(),filter=c.createBiquadFilter(),mix=c.createGain();
    droneA.type='sine';droneA.frequency.value=55;droneB.type='triangle';droneB.frequency.value=82.4;filter.type='lowpass';filter.frequency.value=180;mix.gain.value=.16;
    droneA.connect(filter);droneB.connect(filter);filter.connect(mix);mix.connect(this.ambientGain);droneA.start();droneB.start();
    const lfo=c.createOscillator(),lfoGain=c.createGain();lfo.frequency.value=.08;lfoGain.gain.value=18;lfo.connect(lfoGain);lfoGain.connect(filter.frequency);lfo.start();
  }
  setVolume(value) { this.volume=Math.max(0,Math.min(1,Number(value)||0));if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.04); }
  setMuted(value) { this.muted=!!value;if(this.master)this.master.gain.setTargetAtTime(this.muted?0:this.volume,this.ctx.currentTime,.04); }
  tone({freq=440,endFreq=null,duration=.12,type='sine',gain=.15,pan=0,when=0}={}) {
    if(!this.ensure())return;const c=this.ctx,t=c.currentTime+when,osc=c.createOscillator(),amp=c.createGain(),panner=c.createStereoPanner();
    osc.type=type;osc.frequency.setValueAtTime(Math.max(20,freq),t);if(endFreq!==null)osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
    amp.gain.setValueAtTime(.0001,t);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.012);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);
    panner.pan.setValueAtTime(Math.max(-1,Math.min(1,pan)),t);osc.connect(amp);amp.connect(panner);panner.connect(this.sfxGain);osc.start(t);osc.stop(t+duration+.03);
  }
  noise({duration=.15,gain=.12,frequency=1100,pan=0}={}) {
    if(!this.ensure()||!this.noiseBuffer)return;const c=this.ctx,source=c.createBufferSource(),filter=c.createBiquadFilter(),amp=c.createGain(),panner=c.createStereoPanner(),t=c.currentTime;
    source.buffer=this.noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.65;amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(.0001,t+duration);panner.pan.value=pan;source.connect(filter);filter.connect(amp);amp.connect(panner);panner.connect(this.sfxGain);source.start(t,Math.random()*.4,duration);
  }
  play(name,variation=0) {
    if(!this.ensure())return;const r=(a,b)=>a+Math.random()*(b-a);
    switch(name){
      case 'sword': this.noise({duration:.22,gain:.15,frequency:1800});this.tone({freq:r(550,690),endFreq:180,duration:.18,type:'triangle',gain:.12});break;
      case 'hit': this.noise({duration:.11,gain:.19,frequency:280});this.tone({freq:150,endFreq:62,duration:.12,type:'square',gain:.08});break;
      case 'enemyHit': this.tone({freq:210,endFreq:96,duration:.13,type:'sawtooth',gain:.06});break;
      case 'slash': this.noise({duration:.35,gain:.22,frequency:1250});this.tone({freq:620,endFreq:170,duration:.3,type:'sawtooth',gain:.1});this.tone({freq:980,endFreq:440,duration:.23,type:'sine',gain:.08,when:.04});break;
      case 'fireball': this.noise({duration:.34,gain:.18,frequency:430});this.tone({freq:160,endFreq:700,duration:.25,type:'sawtooth',gain:.11});this.tone({freq:280,endFreq:55,duration:.46,type:'triangle',gain:.1,when:.12});break;
      case 'explosion': this.noise({duration:.6,gain:.25,frequency:210});this.tone({freq:95,endFreq:38,duration:.65,type:'sine',gain:.16});break;
      case 'step': this.noise({duration:.065,gain:.035,frequency:r(120,260)});break;
      case 'grass': this.noise({duration:.11,gain:.03,frequency:2100});break;
      case 'pickup': this.tone({freq:680,endFreq:1020,duration:.12,type:'sine',gain:.09});this.tone({freq:940,endFreq:1320,duration:.15,type:'sine',gain:.06,when:.08});break;
      case 'quest': this.tone({freq:523,endFreq:784,duration:.23,type:'sine',gain:.11});this.tone({freq:659,endFreq:988,duration:.25,type:'sine',gain:.09,when:.12});this.tone({freq:784,endFreq:1174,duration:.32,type:'sine',gain:.08,when:.25});break;
      case 'level': [523,659,784,1047].forEach((f,i)=>this.tone({freq:f,endFreq:f*1.04,duration:.25,type:'sine',gain:.1,when:i*.1}));break;
      case 'dash': this.noise({duration:.24,gain:.16,frequency:1800});this.tone({freq:340,endFreq:900,duration:.2,type:'triangle',gain:.1});break;
      case 'magic': this.tone({freq:720,endFreq:1120,duration:.16,type:'sine',gain:.09});this.tone({freq:420,endFreq:860,duration:.24,type:'triangle',gain:.07,when:.05});break;
      case 'open': this.tone({freq:320,endFreq:650,duration:.16,type:'sine',gain:.06});break;
      case 'buy': this.tone({freq:510,endFreq:810,duration:.16,type:'triangle',gain:.1});break;
      case 'error': this.tone({freq:180,endFreq:110,duration:.22,type:'square',gain:.08});break;
      case 'death': this.tone({freq:220,endFreq:38,duration:.75,type:'sine',gain:.15});break;
      default: this.tone({freq:440,endFreq:520,duration:.1,gain:.04});
    }
  }
}
