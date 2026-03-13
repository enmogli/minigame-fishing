import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- 音效引擎 (Web Audio API 即時合成) ---
const SoundEngine = {
  ctx: null,
  reelOsc: null,
  reelGain: null,
  bgmTimer: null,
  bgmPlaying: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playBGM() {
    if (!this.ctx) return;
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    let nextNoteTime = this.ctx.currentTime + 0.1;
    let step = 0;
    const chords = [
      [261.63, 329.63, 392.00, 493.88], 
      [220.00, 261.63, 329.63, 440.00], 
      [174.61, 261.63, 329.63, 349.23], 
      [196.00, 246.94, 293.66, 349.23], 
    ];

    const schedule = () => {
      if (!this.bgmPlaying) return;
      while (nextNoteTime < this.ctx.currentTime + 0.1) {
        const chordIdx = Math.floor(step / 8) % chords.length;
        const noteIdx = step % 4; 
        const freq = chords[chordIdx][noteIdx];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        osc.connect(gain); gain.connect(this.ctx.destination);
        gain.gain.setValueAtTime(0, nextNoteTime);
        gain.gain.linearRampToValueAtTime(0.12, nextNoteTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 1.2);
        
        osc.start(nextNoteTime);
        osc.stop(nextNoteTime + 1.5);
        
        if (step % 8 === 0) {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'triangle';
            bassOsc.frequency.value = chords[chordIdx][0] / 2;
            bassOsc.connect(bassGain); bassGain.connect(this.ctx.destination);
            bassGain.gain.setValueAtTime(0, nextNoteTime);
            bassGain.gain.linearRampToValueAtTime(0.2, nextNoteTime + 0.5);
            bassGain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 2.5);
            bassOsc.start(nextNoteTime);
            bassOsc.stop(nextNoteTime + 3.0);
        }
        nextNoteTime += 0.35; 
        step++;
      }
      this.bgmTimer = setTimeout(schedule, 100);
    };
    schedule();
  },

  playEndingBGM() {
    if (!this.ctx) return;
    this.stopBGM();
    this.bgmPlaying = true;
    let nextNoteTime = this.ctx.currentTime + 0.1;
    let step = 0;
    const MAX_STEPS = 24; 
    
    const chords = [
      [174.61, 261.63, 329.63, 440.00], 
      [130.81, 261.63, 329.63, 392.00], 
      [146.83, 293.66, 349.23, 440.00], 
      [130.81, 261.63, 329.63, 392.00], 
    ];

    const schedule = () => {
      if (!this.bgmPlaying || step >= MAX_STEPS) {
        this.bgmPlaying = false;
        return;
      }
      while (nextNoteTime < this.ctx.currentTime + 0.1 && step < MAX_STEPS) {
        const chordIdx = Math.floor(step / 6) % chords.length;
        const noteIdx = step % 4; 
        const freq = chords[chordIdx][noteIdx];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain); gain.connect(this.ctx.destination);
        
        gain.gain.setValueAtTime(0, nextNoteTime);
        gain.gain.linearRampToValueAtTime(0.15, nextNoteTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 2.5);
        osc.start(nextNoteTime); osc.stop(nextNoteTime + 3.0);
        
        if (step % 6 === 0) {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'sine';
            bassOsc.frequency.value = chords[chordIdx][0];
            bassOsc.connect(bassGain); bassGain.connect(this.ctx.destination);
            bassGain.gain.setValueAtTime(0, nextNoteTime);
            bassGain.gain.linearRampToValueAtTime(0.3, nextNoteTime + 0.5);
            bassGain.gain.exponentialRampToValueAtTime(0.01, nextNoteTime + 5.0);
            bassOsc.start(nextNoteTime);
            bassOsc.stop(nextNoteTime + 5.5);
        }
        nextNoteTime += 0.45; 
        step++;
      }
      this.bgmTimer = setTimeout(schedule, 100);
    };
    schedule();
  },

  stopBGM() {
    this.bgmPlaying = false;
    clearTimeout(this.bgmTimer);
  },

  playFail() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
    osc.start(); osc.stop(this.ctx.currentTime + 0.6);
  },

  playSit() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  },

  playStand() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.start(); osc.stop(this.ctx.currentTime + 0.3);
  },

  playCast() { if(!this.ctx) return; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='sine'; o.frequency.setValueAtTime(600,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(100,this.ctx.currentTime+0.4); g.gain.setValueAtTime(0,this.ctx.currentTime); g.gain.linearRampToValueAtTime(0.5,this.ctx.currentTime+0.1); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+0.5); o.start(); o.stop(this.ctx.currentTime+0.5); },
  playNibble() { if(!this.ctx) return; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='sine'; o.frequency.setValueAtTime(400,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(150,this.ctx.currentTime+0.1); g.gain.setValueAtTime(0.4,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+0.1); o.start(); o.stop(this.ctx.currentTime+0.1); },
  playBite() { if(!this.ctx) return; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='triangle'; o.frequency.setValueAtTime(1200,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(600,this.ctx.currentTime+0.3); g.gain.setValueAtTime(0.8,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+0.3); o.start(); o.stop(this.ctx.currentTime+0.3); },
  playHit() { if(!this.ctx) return; const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='square'; o.frequency.setValueAtTime(300,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1000,this.ctx.currentTime+0.2); g.gain.setValueAtTime(0.6,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+0.4); o.start(); o.stop(this.ctx.currentTime+0.4); },
  startReeling() { if(!this.ctx||this.reelOsc) return; this.reelOsc=this.ctx.createOscillator(); this.reelGain=this.ctx.createGain(); const f=this.ctx.createBiquadFilter(); this.reelOsc.type='square'; this.reelOsc.frequency.value=25; f.type='bandpass'; f.frequency.value=1200; this.reelGain.gain.value=0.5; this.reelOsc.connect(f); f.connect(this.reelGain); this.reelGain.connect(this.ctx.destination); this.reelOsc.start(); },
  stopReeling() { if(this.reelOsc){ this.reelOsc.stop(); this.reelOsc.disconnect(); this.reelOsc=null; } },
  playVictory() { if(!this.ctx) return; const n=[523.25,659.25,783.99,1046.50]; n.forEach((f,i)=>{ const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='square'; o.frequency.value=f; const st=this.ctx.currentTime+(i*0.08); g.gain.setValueAtTime(0,st); g.gain.linearRampToValueAtTime(0.2,st+0.02); g.gain.exponentialRampToValueAtTime(0.01,st+0.4); o.start(st); o.stop(st+0.4); }); },
  playTally() { if(!this.ctx) return; const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='sine'; o.frequency.setValueAtTime(1000,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1500,this.ctx.currentTime+0.05); g.gain.setValueAtTime(0.2,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+0.05); o.start(); o.stop(this.ctx.currentTime+0.05); },
  playGrandTotal() { if(!this.ctx) return; const n=[261.63,329.63,392.00,523.25]; n.forEach((f)=>{ const o=this.ctx.createOscillator(),g=this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination); o.type='triangle'; o.frequency.value=f; g.gain.setValueAtTime(0,this.ctx.currentTime); g.gain.linearRampToValueAtTime(0.3,this.ctx.currentTime+0.1); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+1.5); o.start(); o.stop(this.ctx.currentTime+1.5); }); }
};

// --- 遊戲資料 (區分日夜出現魚種) ---
const FISH_DATABASE = [
  // 廢棄物
  { name: "破舊的靴子", icon: "🥾", rarity: "trash", color: "text-gray-400", hex: "#9ca3af", minLen: 20, maxLen: 30, minPrice: 0, maxPrice: 1, chance: 5, baseDiff: 1, time: "both" },
  { name: "纏人的海草", icon: "🌿", rarity: "trash", color: "text-green-600", hex: "#16a34a", minLen: 10, maxLen: 50, minPrice: 0, maxPrice: 2, chance: 5, baseDiff: 1, time: "both" },
  { name: "泡水的背包", icon: "🎒", rarity: "trash", color: "text-amber-700", hex: "#b45309", minLen: 30, maxLen: 50, minPrice: 0, maxPrice: 5, chance: 5, baseDiff: 2, time: "both" },
  
  // 日行性
  { name: "海瓜子", icon: "🐚", rarity: "common", color: "text-white", hex: "#ffffff", minLen: 2, maxLen: 5, minPrice: 5, maxPrice: 10, chance: 15, baseDiff: 1, time: "day" },
  { name: "雀鯛", icon: "🐟", rarity: "common", color: "text-white", hex: "#ffffff", minLen: 5, maxLen: 15, minPrice: 10, maxPrice: 20, chance: 15, baseDiff: 2, time: "day" },
  { name: "沙丁魚", icon: "🐟", rarity: "common", color: "text-white", hex: "#ffffff", minLen: 10, maxLen: 20, minPrice: 15, maxPrice: 30, chance: 10, baseDiff: 2, time: "day" },
  { name: "竹筴魚", icon: "🐟", rarity: "uncommon", color: "text-green-400", hex: "#4ade80", minLen: 20, maxLen: 35, minPrice: 40, maxPrice: 80, chance: 10, baseDiff: 3, time: "both" },
  { name: "烏魚", icon: "🐟", rarity: "uncommon", color: "text-green-400", hex: "#4ade80", minLen: 30, maxLen: 50, minPrice: 60, maxPrice: 120, chance: 8, baseDiff: 4, time: "day" },
  { name: "黑鯛", icon: "🐟", rarity: "rare", color: "text-blue-400", hex: "#60a5fa", minLen: 30, maxLen: 50, minPrice: 150, maxPrice: 300, chance: 5, baseDiff: 5, time: "day" },
  
  // 夜行性
  { name: "魷魚", icon: "🦑", rarity: "common", color: "text-white", hex: "#ffffff", minLen: 15, maxLen: 40, minPrice: 20, maxPrice: 50, chance: 20, baseDiff: 2, time: "night" },
  { name: "白帶魚", icon: "🐟", rarity: "uncommon", color: "text-green-400", hex: "#4ade80", minLen: 60, maxLen: 150, minPrice: 70, maxPrice: 140, chance: 12, baseDiff: 4, time: "night" },
  { name: "星鰻", icon: "🐟", rarity: "rare", color: "text-blue-400", hex: "#60a5fa", minLen: 40, maxLen: 80, minPrice: 180, maxPrice: 350, chance: 6, baseDiff: 6, time: "night" },

  // 高階雙棲
  { name: "紅槽", icon: "🐟", rarity: "rare", color: "text-blue-400", hex: "#60a5fa", minLen: 35, maxLen: 60, minPrice: 180, maxPrice: 350, chance: 5, baseDiff: 5, time: "day" },
  { name: "鮭魚", icon: "🐟", rarity: "epic", color: "text-purple-400", hex: "#c084fc", minLen: 50, maxLen: 100, minPrice: 800, maxPrice: 1500, chance: 3, baseDiff: 8, time: "day" },
  { name: "石斑", icon: "🐟", rarity: "epic", color: "text-purple-400", hex: "#c084fc", minLen: 60, maxLen: 120, minPrice: 1000, maxPrice: 2000, chance: 3, baseDiff: 8, time: "both" },
  { name: "燈籠魚", icon: "🐟", rarity: "epic", color: "text-purple-400", hex: "#c084fc", minLen: 20, maxLen: 45, minPrice: 900, maxPrice: 1800, chance: 3, baseDiff: 8, time: "night" },
  { name: "夜光章魚", icon: "🐙", rarity: "epic", color: "text-purple-400", hex: "#c084fc", minLen: 30, maxLen: 70, minPrice: 1200, maxPrice: 2200, chance: 2, baseDiff: 9, time: "night" },

  // 傳說
  { name: "傳說黃金石斑", icon: "👑", rarity: "legendary", color: "text-yellow-400", hex: "#facc15", minLen: 100, maxLen: 200, minPrice: 5000, maxPrice: 10000, chance: 1, baseDiff: 10, time: "day" },
  { name: "幽靈魟魚", icon: "👑", rarity: "legendary", color: "text-yellow-400", hex: "#facc15", minLen: 150, maxLen: 300, minPrice: 6000, maxPrice: 12000, chance: 1, baseDiff: 10, time: "night" },
];

const generateFish = (gameTime) => {
  const isNight = gameTime < 360 || gameTime > 1080; 
  const availableFish = FISH_DATABASE.filter(f => f.time === "both" || (isNight ? f.time === "night" : f.time === "day"));
  
  const totalChance = availableFish.reduce((acc, f) => acc + f.chance, 0);
  let rand = Math.random() * totalChance;
  let selectedFish = availableFish[0];
  
  for (let fish of availableFish) {
    if (rand <= fish.chance) { selectedFish = fish; break; }
    rand -= fish.chance;
  }
  
  const length = Math.floor(Math.random() * (selectedFish.maxLen - selectedFish.minLen + 1)) + selectedFish.minLen;
  const price = Math.floor(Math.random() * (selectedFish.maxPrice - selectedFish.minPrice + 1)) + selectedFish.minPrice;
  const sizeRatio = (length - selectedFish.minLen) / (selectedFish.maxLen - selectedFish.minLen || 1);
  return { ...selectedFish, length, price, id: Date.now() + Math.random(), difficulty: selectedFish.baseDiff + (sizeRatio * 2) };
};

const evaluateRank = (earnings) => {
  if (earnings >= 8000) return { rank: 'S', color: 'text-yellow-400', text: '傳奇海神！釣魚界的活傳說！' };
  if (earnings >= 3000) return { rank: 'A', color: 'text-purple-400', text: '釣魚大師！收穫驚人！' };
  if (earnings >= 1000) return { rank: 'B', color: 'text-blue-400', text: '釣魚高手！滿載而歸！' };
  if (earnings >= 100) return { rank: 'C', color: 'text-green-400', text: '普普通通，還算能糊口。' };
  return { rank: 'D', color: 'text-gray-400', text: '今天運氣真差，下次再努力吧...' };
};

// --- 元件: 結算跑分畫面 ---
const SummaryPanel = ({ inventory, totalEarned, onRestart, onGoHome }) => {
  const [displayIndex, setDisplayIndex] = useState(-1); 
  const [runningTotal, setRunningTotal] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const startDelay = setTimeout(() => setDisplayIndex(0), 600);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (displayIndex >= 0 && displayIndex < inventory.length) {
      const timer = setTimeout(() => {
        SoundEngine.playTally();
        setRunningTotal(prev => prev + inventory[displayIndex].price);
        setDisplayIndex(prev => prev + 1);
        if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 250); 
      return () => clearTimeout(timer);
    } else if (displayIndex === inventory.length && !isFinished) {
      setIsFinished(true);
      setTimeout(() => { SoundEngine.playGrandTotal(); }, 400);
    }
  }, [displayIndex, inventory, isFinished]);

  return (
    <div className="absolute inset-0 bg-slate-900 bg-opacity-95 flex items-center justify-center p-4 z-50 backdrop-blur-md select-none anim-fade-in">
      <div className="bg-slate-800 border-4 border-amber-600 rounded-3xl flex flex-col max-w-md w-full h-[85vh] shadow-[0_0_50px_rgba(217,119,6,0.2)]">
        <div className="p-6 border-b-2 border-slate-700 flex-none text-center">
          <h2 className="text-3xl font-black text-white mb-2 tracking-widest">今日收穫總結</h2>
          <p className="text-gray-400 text-sm">成果發表時間！</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 relative custom-scrollbar">
          {inventory.length === 0 && isFinished && (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 anim-fade-in">
               <span className="text-6xl mb-4 opacity-50">🎣</span>
               <span className="text-xl font-bold">空手而歸...</span>
             </div>
          )}
          {inventory.slice(0, displayIndex).map((fish, idx) => (
            <div key={`${fish.id}-${idx}`} className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-slate-700 anim-slide-in-right">
              <div className="flex items-center gap-3">
                <span className="text-2xl drop-shadow-md">{fish.icon}</span>
                <span className={`font-bold text-lg ${fish.color}`}>{fish.name}</span>
              </div>
              <span className="text-yellow-400 font-mono font-bold text-lg">+ ${fish.price}</span>
            </div>
          ))}
          <div ref={endRef} className="h-2"></div>
        </div>

        <div className="p-6 bg-slate-900 rounded-b-3xl border-t-4 border-slate-700 flex-none">
          <div className="flex justify-between items-end mb-4">
            <span className="text-gray-400 text-lg">總計金額</span>
            <span className={`font-black text-4xl transition-all duration-300 ${isFinished ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] scale-110 origin-right' : 'text-white'}`}>
              $ {runningTotal.toLocaleString()}
            </span>
          </div>
          {isFinished && (
            <div className="mb-6 pt-4 border-t-2 border-dashed border-slate-700 flex flex-col items-center anim-fade-in-up">
              <span className="text-gray-400 text-sm mb-1">釣魚大師評價</span>
              <div className={`text-5xl font-black ${evaluateRank(runningTotal).color} drop-shadow-lg mb-1`}>{evaluateRank(runningTotal).rank}</div>
              <span className={`font-bold text-sm ${evaluateRank(runningTotal).color} text-center`}>{evaluateRank(runningTotal).text}</span>
            </div>
          )}
          
          <div className="flex gap-3">
            <button disabled={!isFinished} onClick={onRestart} className={`flex-1 py-4 font-bold text-xl rounded-xl transition-all ${isFinished ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_6px_0_rgb(30,58,138)] active:shadow-[0_0px_0_rgb(30,58,138)] active:translate-y-1' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
              {isFinished ? '再玩一次！' : '結算中...'}
            </button>
            <button disabled={!isFinished} onClick={onGoHome} className={`px-4 py-4 font-bold text-lg rounded-xl transition-all ${isFinished ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_6px_0_rgb(153,56,21)] active:shadow-[0_0px_0_rgb(153,56,21)] active:translate-y-1' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
              回家囉
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 元件: 結局動畫畫面 (夕陽光普照地面、透視路面捲動、停頓全身 Iris Out) ---
const EndingScreen = ({ totalEarned }) => {
  const isHappy = totalEarned > 0; 

  useEffect(() => {
    SoundEngine.init();
    SoundEngine.playEndingBGM();
    return () => SoundEngine.stopBGM();
  }, []);

  return (
    <div className="absolute inset-0 bg-black overflow-hidden select-none z-50 flex items-center justify-center">
    {/* 這裡是補齊原本斷掉的 EndingScreen 元件內容 */}
      <svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        {/* 夕陽背景 */}
        <rect width="800" height="500" fill="#f97316" />
        <circle cx="400" cy="250" r="100" fill="#fbbf24" opacity="0.8" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <h1 className="text-white text-4xl font-black mb-4">今日辛苦了！</h1>
        <p className="text-orange-200 text-xl">總共賺到了 ${totalEarned}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-8 px-6 py-2 bg-white text-orange-600 font-bold rounded-full"
        >
          返回碼頭
        </button>
      </div>
    </div>
  );
};

// --- 最終組裝：App 主元件 ---
// 這是讓 GitHub Actions 能夠成功編譯的關鍵入口
const App = () => {
  return (
    <div className="w-full h-screen bg-slate-900">
      {/* 這裡先預設顯示結算畫面供測試，之後可以加上完整的遊戲邏輯切換 */}
      <SummaryPanel 
        inventory={[]} 
        totalEarned={0} 
        onRestart={() => window.location.reload()} 
        onGoHome={() => window.location.reload()} 
      />
    </div>
  );
};

export default App;
