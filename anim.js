
// ============ prefill race ============
(function(){
  const A=document.getElementById('raceA'), B=document.getElementById('raceB');
  if(!A) return;
  const L=12;
  const boxesA=[], boxesB=[];
  for(let i=0;i<L;i++){
    const a=document.createElement('i'); A.appendChild(a); boxesA.push(a);
    const b=document.createElement('i'); B.appendChild(b); boxesB.push(b);
  }
  let timer=null;

  function reset(){
    if(timer){clearInterval(timer); timer=null;}
    boxesA.forEach(b=>{b.className=''});
    boxesB.forEach(b=>{b.className=''});
    document.getElementById('workA').textContent='0';
    document.getElementById('workB').textContent='0';
    document.getElementById('layA').textContent='0';
    document.getElementById('layB').textContent='0';
    document.getElementById('save').textContent='—';
  }

  function run(){
    reset();
    let i=0, wa=0, wb=0;
    timer=setInterval(()=>{
      // standard: every layer, full cost
      if(i<L){
        boxesA[i].className='on';
        wa += 100;                       // 100 work units per layer over full prompt
        document.getElementById('workA').textContent=wa;
        document.getElementById('layA').textContent=String(i+1);
      }
      // CED: encoder half at full cost, then decoder resolves cheaply
      if(i<L/2){
        boxesB[i].className='enc';
        wb += 100;
      } else if(i<L){
        boxesB[i].className='dec';
        wb += 14;                        // projection, not a full attention pass
      }
      document.getElementById('workB').textContent=wb;
      document.getElementById('layB').textContent=String(Math.min(i+1, L/2));
      i++;
      if(i>L){
        clearInterval(timer); timer=null;
        document.getElementById('save').textContent=Math.round((1-wb/wa)*100)+'%';
      }
    }, 190);
  }
  document.getElementById('raceGo').onclick=run;
  document.getElementById('raceReset').onclick=reset;
  reset();
})();

// ============ cache shrink ============
(function(){
  const host=document.getElementById('shrinkBars'); if(!host) return;
  const STAGES=[
    {nm:'Standard (per-layer KV)', pct:100, cls:'std',
     note:'A baseline transformer: every layer keeps its own keys and values, at full precision. This is the 1× reference.'},
    {nm:'+ cross-layer KV reuse',  pct:38,  cls:'ds',
     note:'Step 1 — layers share one copy of the main KV and indexer keys. Only Full-mode layers produce them.'},
    {nm:'+ sequence compression',  pct:19,  cls:'ds',
     note:'Step 2 — every m positions collapse into a single compressed entry, so there are fewer entries to store at all.'},
    {nm:'+ FP4 precision',         pct:9,   cls:'ds',
     note:'Step 3 — roughly four bits per value instead of eight. The published figure is 890 bytes per token of global KV, about ¼ of V4-Flash.'}
  ];
  function build(n){
    host.innerHTML='';
    for(let k=0;k<=n && k<STAGES.length;k++){
      const s=STAGES[k];
      const r=document.createElement('div');
      r.className='brow '+s.cls+(k===n?' win':'');
      r.innerHTML='<span class="nm">'+s.nm+'</span>'+
        '<span class="track"><span class="bar2" style="width:'+s.pct+'%"></span></span>'+
        '<span class="pc">'+s.pct+'%</span>';
      host.appendChild(r);
    }
    document.getElementById('shrinkNote').textContent = STAGES[Math.min(n,STAGES.length-1)].note;
  }
  let n=0, timer=null;
  document.getElementById('shrinkGo').onclick=()=>{
    if(timer) return;
    n=0; build(0);
    timer=setInterval(()=>{
      n++;
      build(n);
      if(n>=STAGES.length-1){ clearInterval(timer); timer=null; }
    }, 900);
  };
  document.getElementById('shrinkReset').onclick=()=>{
    if(timer){clearInterval(timer); timer=null;}
    n=0; build(0);
    document.getElementById('shrinkNote').textContent='Press the button to compress step by step. Bar widths are illustrative of the three mechanisms, not a measured byte count.';
  };
  build(0);
})();

// ============ auto-cycle the CSA2 modes ============
(function(){
  const modes=document.querySelectorAll('#csaModes .mode');
  if(!modes.length) return;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  let k=0, paused=false;
  modes.forEach(m=>{
    m.addEventListener('mouseenter',()=>{paused=true});
    m.addEventListener('mouseleave',()=>{paused=false});
    m.addEventListener('click',()=>{ paused=true; setTimeout(()=>{paused=false}, 14000); });
  });
  setInterval(()=>{ if(paused) return; k=(k+1)%modes.length; modes[k].click(); }, 4200);
})();
