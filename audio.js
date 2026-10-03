// Original, synthesized terminal audio. No remote files; browser autoplay policy is respected.
window.TerminalAudio=(()=>{
 let context,master,ambient,enabled=false,startupPlayed=false,choir=null;
 function init(){if(context)return;context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=0;master.connect(context.destination);ambient=context.createGain();ambient.gain.value=.022;ambient.connect(master);
  // A quiet, unresolved electronic chord beneath a low carrier hum.
  [55,110,164.81,220.5].forEach((frequency,i)=>{const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=i===0?.3:.14;oscillator.connect(gain);gain.connect(ambient);oscillator.start();const lfo=context.createOscillator(),depth=context.createGain();lfo.frequency.value=.07+i*.023;depth.gain.value=.035;lfo.connect(depth);depth.connect(gain.gain);lfo.start();});
 }
 function tone(frequency,duration=.13,volume=.06,type='sine',delay=0){if(!enabled||document.hidden||context?.state!=='running')return;const start=context.currentTime+delay,oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(volume,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain);gain.connect(master);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 function unlock(){if(!enabled||!context)return;context.resume().then(()=>{if(enabled&&!startupPlayed&&context.state==='running'){startupPlayed=true;if(!document.getElementById('boot')?.hidden)startup();}}).catch(()=>{});}
 function setEnabled(value){try{init();enabled=value;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(value&&!document.hidden?.65:0,context.currentTime,.09);if(value)unlock();else stopChoir();return enabled;}catch{enabled=false;return false;}}
 // Autoplay may be blocked until a user gesture. Muting always takes precedence.
 for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(!e.target.closest?.('#sound,#boot-sound'))unlock();},true);

 // Layered vowel formants, gentle vibrato and stereo reverberation create a wordless choir.
 function startChoir(){
  if(choir||!enabled||document.hidden||context?.state!=='running'||document.getElementById('boot')?.hidden)return;
  const now=context.currentTime,bus=context.createGain(),dry=context.createGain(),wet=context.createGain(),reverb=context.createConvolver();
  bus.gain.setValueAtTime(0,now);bus.gain.linearRampToValueAtTime(.85,now+.7);bus.connect(master);
  dry.gain.value=.55;wet.gain.value=.65;dry.connect(bus);reverb.connect(wet);wet.connect(bus);
  const impulse=context.createBuffer(2,Math.ceil(context.sampleRate*2.8),context.sampleRate);let seed=731;
  for(let channel=0;channel<2;channel++){const samples=impulse.getChannelData(channel);for(let i=0;i<samples.length;i++){seed=(seed*1664525+1013904223)>>>0;const t=i/context.sampleRate;samples[i]=(seed/4294967296*2-1)*Math.exp(-t*2.5)*Math.min(1,t/.035);}}
  reverb.buffer=impulse;
  const sources=[],nodes=[bus,dry,wet,reverb];
  [261.63,329.63,392,523.25,659.25].forEach((frequency,voice)=>{
   [-5,5].forEach((detune,layer)=>{
    const oscillator=context.createOscillator(),gain=context.createGain(),pan=context.createStereoPanner(),vibrato=context.createOscillator(),depth=context.createGain();
    const real=new Float32Array(40),imag=new Float32Array(40);
    for(let harmonic=1;harmonic<40;harmonic++){const hz=frequency*harmonic;const vowel=.12+1.8*Math.exp(-Math.pow((hz-800)/240,2))+1.1*Math.exp(-Math.pow((hz-1200)/300,2))+.3*Math.exp(-Math.pow((hz-2800)/500,2));imag[harmonic]=vowel/harmonic;}
    oscillator.setPeriodicWave(context.createPeriodicWave(real,imag));oscillator.frequency.value=frequency;oscillator.detune.value=detune;
    vibrato.frequency.value=4.3+voice*.19+layer*.11;depth.gain.value=3.5;vibrato.connect(depth);depth.connect(oscillator.detune);
    gain.gain.value=.055;pan.pan.value=(layer?1:-1)*(.25+voice*.12);oscillator.connect(gain);gain.connect(pan);pan.connect(dry);pan.connect(reverb);
    oscillator.start(now+voice*.025);vibrato.start(now);sources.push(oscillator,vibrato);nodes.push(oscillator,vibrato,gain,pan,depth);
   });
  });
  choir={bus,sources,nodes};
 }
 function stopChoir(){
  if(!choir)return;const previous=choir;choir=null;const now=context.currentTime;
  if(typeof previous.bus.gain.cancelAndHoldAtTime==='function')previous.bus.gain.cancelAndHoldAtTime(now);
  else{const level=previous.bus.gain.value;previous.bus.gain.cancelScheduledValues(now);previous.bus.gain.setValueAtTime(level,now);}
  previous.bus.gain.linearRampToValueAtTime(0,now+.7);
  previous.sources.forEach(source=>source.stop(now+.75));
  previous.sources[0].onended=()=>previous.nodes.forEach(node=>node.disconnect());
 }
 function startup(){startChoir();}

 function tick(){tone(740,.09,.008);}
 function ready(){stopChoir();tone(440,.22,.04);tone(554.37,.25,.04,'sine',.1);tone(659.25,.42,.045,'sine',.2);}
 function click(bad=false){tone(bad?180:640,bad?.2:.09,bad?.04:.035);}
 document.addEventListener('visibilitychange',()=>{if(!context)return;master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(enabled&&!document.hidden?.65:0,context.currentTime,.08);});
 return {setEnabled,startup,tick,ready,click,unlock,needsGesture:()=>enabled&&context?.state!=='running'};
})();
