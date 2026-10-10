
// ---------- stacks ----------
(function(){
  const std=document.getElementById('stackStd');
  const mk=(c,n,t)=>{const d=document.createElement('div');d.className='lay '+c;
    d.innerHTML='<span class="nm">'+n+'</span><span class="tag">'+t+'</span>';return d};
  std.appendChild(mk('','Embedding','input'));
  for(let i=1;i<=4;i++) std.appendChild(mk('','Layer '+i+' — own KV','H'+i+' → K,V'));
  std.appendChild(mk('dim','… 40 more layers …','each with own KV'));
  std.appendChild(mk('','Layer 45 — own KV','H45 → K,V'));
  std.appendChild(mk('','Final norm + unembedding','logits'));

  const ds=document.getElementById('stackDs');
  ds.appendChild(mk('','Embedding + vision tokens','input'));
  ds.appendChild(mk('eng','Engram @ layer 1','196B memory, RDMA'));
  ds.appendChild(mk('enc','Encoder layer 1','full attention'));
  ds.appendChild(mk('enc','Encoder layer 2','full attention'));
  ds.appendChild(mk('enc','… encoder …','causal encoder'));
  ds.appendChild(mk('enc','Encoder layer L/2','← H(L/2) emitted'));
  ds.appendChild(mk('dec','Decoder layer 1 — Full mode','global KV ← H(L/2)'));
  ds.appendChild(mk('dec','Decoder layer 2 — Reindex','reuse KV, new top-K'));
  ds.appendChild(mk('dec','Decoder layer 3 — Reuse','reuse KV + top-K'));
  ds.appendChild(mk('dim','… decoder …','CSA2 modes repeat'));
  ds.appendChild(mk('eng','Engram @ layer 14','196B memory, RDMA'));
  ds.appendChild(mk('dec','Final norm + unembedding','logits'));
})();

// ---------- CED animation ----------
(function(){
  const flow=document.getElementById('cedFlow');
  const nodes=[
    {t:'Embedding',src:'input'},
    {t:'Encoder layer 1 … L/2',src:'global KV generated here',cls:'own'},
    {t:'→ H(L/2) emitted',src:'the midpoint hidden state',cls:'newidx'},
    {t:'Decoder layer — global KV projected',src:'from H(L/2), not own state',cls:'reuse'},
    {t:'Decoder layer — SWA computed per layer',src:'local, own hidden state',cls:'own'},
    {t:'… decoder layers …',src:'reuse the projection',cls:'reuse'},
    {t:'Final norm + unembedding',src:'logits'}
  ];
  const els=nodes.map(n=>{
    const d=document.createElement('div'); d.className='node '+(n.cls||'');
    d.innerHTML='<span class="dot"></span><span class="what">'+n.t+'</span><span class="src">'+n.src+'</span>';
    d.style.opacity=.25; flow.appendChild(d); return d;
  });
  let timers=[];
  function reset(){ timers.forEach(clearTimeout); timers=[]; els.forEach(e=>e.style.opacity=.25);
    document.getElementById('cedLayers').textContent='0';
    document.getElementById('cedWork').textContent='100%';
    document.getElementById('cedStep').textContent='Press Run to trace the pass.'; }
  document.getElementById('cedReset').onclick=reset;
  document.getElementById('cedPlay').onclick=()=>{
    reset();
    let i=0;
    const msgs=[
      'Embedding lookup — tokens become vectors.',
      'The encoder half runs full attention and produces the global KV.',
      'Its final hidden state H(L/2) is the hand-off point.',
      'Decoder layers no longer compute their own global KV — they project it from H(L/2). One matrix multiply replaces a full attention pass.',
      'Sliding-window attention still runs per layer, because it depends on each layer’s own hidden state. This is what bounded replay exists to make cheap.',
      'The pattern repeats for the rest of the decoder.',
      'Output head produces logits. Prefill ends — and roughly half the depth never ran on the full sequence.'
    ];
    els.forEach((e,idx)=>{
      timers.push(setTimeout(()=>{
        e.style.opacity=1;
        document.getElementById('cedStep').textContent=msgs[idx];
        // Illustrative trace on a 92-layer stack. Only the encoder half runs
        // over the full prompt; the decoder's global branch is projected, and its
        // local path is bounded to a window by SWA Bounded Replay.
        const TRACE=[
          {l:'0',  w:'100%'},
          {l:'46', w:'54%'},
          {l:'46', w:'54%'},
          {l:'46', w:'~52%'},
          {l:'46', w:'~52%'},
          {l:'46', w:'~51%'},
          {l:'46', w:'~50%'}
        ][idx];
        document.getElementById('cedLayers').textContent=TRACE.l;
        document.getElementById('cedWork').textContent=TRACE.w;
      }, idx*900));
    });
  };
})();

// ---------- CSA2 modes ----------
(function(){
  const DATA={
    Full:{
      desc:'The complete CSA2 computation path. This layer computes its own main KV and its own indexer query, projects indexer keys from that main KV, and runs the indexer to produce fresh top-K indices. Component responsibilities match a complete CSA layer in DeepSeek-V4.',
      computes:'main KV · indexer Q · indexer K · fresh top-K indices · main Q · SWA KV',
      reuses:'nothing — this is the source layer',
      cost:'full indexing cost, but it is the layer that seeds the shared cache',
      flow:[['Computes own main KV','own'],['Projects indexer K','own'],['Runs indexer → top-K','newidx'],['Sparse attention over selected entries','own']]
    },
    Reindex:{
      desc:'This layer reuses the most recent available main KV and its corresponding indexer keys from a preceding layer. It computes its own indexer query, rescores the reused keys, and produces fresh top-K indices — so the sparse selection can change with depth even though the KV is shared.',
      computes:'main Q · SWA KV · own indexer Q · fresh top-K indices',
      reuses:'main KV and indexer K from the most recent Full layer',
      cost:'indexer evaluation only — no KV generation',
      flow:[['Reuses main KV + indexer K','reuse'],['Computes own indexer Q','own'],['Rescores reused keys → fresh top-K','newidx'],['Sparse attention over selected entries','own']]
    },
    Reuse:{
      desc:'The cheapest mode. This layer reuses both the main KV and the top-K indices already computed against that KV by a preceding Full or Reindex layer. It performs attention using that selection without computing an indexer query or evaluating any index scores.',
      computes:'main Q · SWA KV only',
      reuses:'main KV, indexer K, and top-K indices',
      cost:'no indexing at all — attention only',
      flow:[['Reuses main KV','reuse'],['Reuses top-K indices','reuse'],['Sparse attention over selected entries','own']]
    }
  };
  const modesEl=document.getElementById('csaModes');
  Object.keys(DATA).forEach((k,i)=>{
    const b=document.createElement('button'); b.className='mode'+(i===0?' on':''); b.textContent=k+' Mode';
    b.onclick=()=>{ [...modesEl.children].forEach(c=>c.classList.remove('on')); b.classList.add('on'); show(k); };
    modesEl.appendChild(b);
  });
  function show(k){
    const d=DATA[k];
    document.getElementById('csaTitle').textContent=k+' Mode';
    document.getElementById('csaDesc').textContent=d.desc;
    document.getElementById('csaComputes').textContent=d.computes;
    document.getElementById('csaReuses').textContent=d.reuses;
    document.getElementById('csaCost').textContent=d.cost;
    const f=document.getElementById('csaFlow'); f.innerHTML='';
    d.flow.forEach(([t,c])=>{
      const n=document.createElement('div'); n.className='node '+c;
      n.innerHTML='<span class="dot"></span><span class="what">'+t+'</span>';
      f.appendChild(n);
    });
    const all=document.createElement('div'); all.className='node skip';
    all.innerHTML='<span class="dot"></span><span class="what">Everything else — still computed in every mode</span><span class="src">main Q · SWA KV</span>';
    f.appendChild(all);
  }
  show('Full');
  window.__csaModes = [...modesEl.children];
})();

// ---------- indexer flow ----------
(function(){
  const f=document.getElementById('idxFlow');
  const items=[
    ['First Full-mode decoder layer scores all causally visible positions','newidx'],
    ['Blocks get the max index score of their positions','own'],
    ['Highest-scoring blocks are collected into a candidate pool','newidx'],
    ['Pool example: 2,048 blocks × 8 positions = 16,384 candidates','reuse'],
    ['Reindex layers score only within the pool','own'],
    ['Each selects its own top-512 from the pool','newidx']
  ];
  items.forEach(([t,c])=>{
    const n=document.createElement('div'); n.className='node '+c;
    n.innerHTML='<span class="dot"></span><span class="what">'+t+'</span>';
    f.appendChild(n);
  });
})();

// ---------- dspark flow ----------
(function(){
  const f=document.getElementById('dsparkFlow');
  const items=[
    ['3 Transformer blocks, 128-token sliding window','drafter'],
    ['One forward pass → base logits for 5 draft positions','draft'],
    ['Markov head models dependencies among the draft tokens','draft'],
    ['Confidence head → per-position acceptance probability','confidence'],
    ['Prefix survival probabilities estimated','confidence'],
    ['Scheduler combines with engine throughput curves','schedule'],
    ['Verification length chosen per request, under current load','verify'],
    ['Backbone verifies the accepted prefix in one pass','verify']
  ];
  const cls={drafter:'own',draft:'newidx',confidence:'newidx',schedule:'reuse',verify:'own'};
  items.forEach(([t,k])=>{
    const n=document.createElement('div'); n.className='node '+cls[k];
    n.innerHTML='<span class="dot"></span><span class="what">'+t+'</span><span class="src">'+k+'</span>';
    f.appendChild(n);
  });
})();

// ---------- scroll ----------
const prog=document.getElementById('progress');
const links=[...document.querySelectorAll('.toc a')];
const secs=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
function onScroll(){
  const h=document.documentElement.scrollHeight-window.innerHeight;
  prog.style.width=(h>0?(window.scrollY/h*100):0)+'%';
  let idx=0; secs.forEach((s,i)=>{ if(s.getBoundingClientRect().top<=140) idx=i; });
  links.forEach((a,i)=>a.classList.toggle('on',i===idx));
}
window.addEventListener('scroll',onScroll,{passive:true}); onScroll();
