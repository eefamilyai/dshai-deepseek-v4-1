
// cycle length (seconds) and the fraction spent animating; the rest holds the final frame
window.__PLATE_HOLD = {
  'hero-art':[9.0,1.00],
  'v1-art':  [6.0,0.55],
  'v2-art':  [4.6,0.70],
  'v3-art':  [6.6,0.55],
  'v4-art':  [6.0,1.00],
  'v5-art':  [5.5,0.70],
  'v6-art':  [7.0,0.72],
  'v7-art':  [5.4,0.70],
  'v8-art':  [6.0,0.60],
  'v9-art':  [5.0,0.60],
  'v10-art': [5.6,0.60],
  'v11-art': [6.0,0.62],
  'v12-art': [7.0,0.72]
};

// ---------- toolkit ----------
function A(id, draw){
  var cv=document.getElementById(id); if(!cv) return;
  var c=cv.getContext('2d'), W=1,H=1, D=Math.min(2,window.devicePixelRatio||1), on=false;
  function fit(){
    var r=cv.getBoundingClientRect();
    W=Math.max(300,r.width); H=Math.max(140,r.height);
    cv.width=Math.round(W*D); cv.height=Math.round(H*D);
    c.setTransform(D,0,0,D,0,0);
  }
  fit(); addEventListener('resize',fit);
  if('ResizeObserver' in window){ new ResizeObserver(fit).observe(cv); }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){ on=e[0].isIntersecting; },{threshold:0.01}).observe(cv);
  } else on=true;
  var R=matchMedia('(prefers-reduced-motion: reduce)').matches, t0=performance.now();
  var FZ=(function(){ var m=location.search.match(/freeze=([0-9.]+)/); return m?parseFloat(m[1]):null; })();
  var HOLD=window.__PLATE_HOLD && window.__PLATE_HOLD[id];
  function held(sec){
    if(!HOLD) return sec;
    var cyc=HOLD[0], rest=cyc*HOLD[1], k=sec%cyc;
    return k<rest ? k : rest;
  }
  (function lp(n){ if(on){ try{ draw(c,W,H, FZ!==null?FZ:held((n-t0)/1000), R); }catch(e){} } requestAnimationFrame(lp); })(t0);
}
function bx(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2);
  c.beginPath(); c.moveTo(x+r,y);
  c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r);
  c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function EO(x){ return 1-Math.pow(1-x,3); }
function EIO(x){ return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
function M(c,s,w){ c.font=(w||600)+' '+s+'px ui-monospace,SFMono-Regular,Menlo,monospace'; }
function S(c,s){ c.font='600 '+s+'px ui-sans-serif,system-ui,-apple-system,sans-serif'; }
function gd(c,W,H,st,al){
  c.strokeStyle='rgba(24,35,58,'+(al||.45)+')'; c.lineWidth=1;
  for(var x=0;x<W;x+=st){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); }
  for(var y=0;y<H;y+=st){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
}
function note(c,txt,W,H){
  // shrink to fit rather than run off the edge
  var maxW=W-48, size=10.5;
  M(c,size);
  while(c.measureText(txt).width>maxW && size>8){ size-=0.5; M(c,size); }
  c.textAlign='left'; c.fillStyle='rgba(85,97,128,1)';
  c.fillText(txt, 24, H-20);
}
var BLUE='rgba(77,107,254,1)', CYAN='rgba(34,211,238,1)',
    AMBER='rgba(251,191,36,1)', GREEN='rgba(52,211,153,1)',
    ROSE='rgba(251,113,133,1)', DIM='rgba(85,97,128,1)';

// ---------- no label may ever leave the canvas ----------
// Every fillText is fitted to the room on the side it is anchored to, shrinking
// the font only as far as it must and restoring it at once, so a caption tuned
// for a wide canvas still reads on a narrow one instead of running off the edge.
(function(){
  if(typeof CanvasRenderingContext2D==='undefined') return;
  var proto=CanvasRenderingContext2D.prototype, orig=proto.fillText, memo={};
  function cssW(ctx){
    var w=ctx.canvas?ctx.canvas.width:0;
    try{ var m=ctx.getTransform(); if(m&&m.a) w=w/m.a; }catch(e){}
    return w;
  }
  function widthOf(ctx,s,font){
    var k=font+'|'+s, v=memo[k];
    if(v===undefined){ v=ctx.measureText(s).width; if(Object.keys(memo).length>4000) memo={}; memo[k]=v; }
    return v;
  }
  proto.fillText=function(text,x,y,maxW){
    var s=(text==null?'':String(text));
    if(!s) return orig.call(this,text,x,y,maxW);
    var pad=10, W=cssW(this), limit;
    if(maxW!=null && maxW>0) limit=maxW;
    else if(this.textAlign==='right'||this.textAlign==='end') limit=x-pad;
    else if(this.textAlign==='center') limit=2*Math.min(x-pad, W-x-pad);
    else limit=W-x-pad;
    if(!(limit>8)) return orig.call(this,text,x,y,maxW);
    var font=this.font, w0=widthOf(this,s,font);
    if(w0<=limit) return orig.call(this,text,x,y,maxW);
    var fm=/^\s*(\d*\.?\d+)(px\s+.*)$/.exec(font);
    if(!fm) return orig.call(this,text,x,y,maxW);
    var size=parseFloat(fm[1]);
    if(!(size>0)||!(w0>0)) return orig.call(this,text,x,y,maxW);
    this.font=(size*limit/w0).toFixed(2)+fm[2];
    orig.call(this,text,x,y,maxW);
    this.font=font;
  };
})();

// ---------- HERO: two stacks, one output ----------
A('hero-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,54,.22);
  var L=11, cx=W/2;
  var bw=Math.min(120,W*.10), bh=Math.min(20,(H-160)/L);
  var ox1=cx-bw*2.4, ox2=cx+bw*1.4, oy=(H-L*(bh+3))/2+10;
  var wave=Math.floor((t*1.4)%(L+7));
  for(var i=0;i<L;i++){
    var y=oy+i*(bh+3);
    // LEFT: standard, every layer own KV
    var on1=i<=wave;
    bx(c,ox1,y,bw,bh,4);
    c.fillStyle= on1?'rgba(71,85,105,.92)':'rgba(11,17,32,.85)'; c.fill();
    if(on1){ c.strokeStyle='rgba(148,163,184,.85)'; c.lineWidth=1.4; c.stroke(); }
    // RIGHT: CED — encoder half then shared decoder
    var on2=i<=wave;
    var enc=i<L/2;
    bx(c,ox2,y,bw,bh,4);
    if(on2){
      c.fillStyle= enc?'rgba(77,107,254,.85)':'rgba(31,109,122,.85)';
    } else c.fillStyle='rgba(11,17,32,.85)';
    c.fill();
    if(on2){ c.strokeStyle= enc?'rgba(124,147,255,.9)':'rgba(34,211,238,.9)'; c.lineWidth=1.4; c.stroke(); }
  }
  // midpoint marker on the right
  var midY=oy+(L/2)*(bh+3);
  c.beginPath(); c.moveTo(ox2-26,midY); c.lineTo(ox2+bw+26,midY);
  c.strokeStyle='rgba(34,211,238,.55)'; c.lineWidth=1.5; c.setLineDash([6,5]); c.stroke();
  c.setLineDash([]);
  M(c,10); c.textAlign='right'; c.fillStyle='rgba(34,211,238,.9)';
  c.fillText('encoder midpoint', ox2-30, midY+4);
  // labels
  M(c,11); c.textAlign='center';
  c.fillStyle='rgba(148,163,184,.9)';
  c.fillText('standard', ox1+bw/2, oy-12);
  c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('V4.1', ox2+bw/2, oy-12);
  // shared KV arrow between decoder layers on the right
  if(wave>=L/2){
    for(var j=Math.floor(L/2)+1;j<L;j++){
      var y1=oy+j*(bh+3), y0=oy+Math.floor(L/2)*(bh+3);
      if(j===wave){
        c.beginPath(); c.moveTo(ox2+bw+8,y1+bh/2); c.quadraticCurveTo(ox2+bw+34,(y0+y1)/2,ox2+bw+8,y0+bh/2);
        c.strokeStyle='rgba(251,191,36,.75)'; c.lineWidth=2; c.setLineDash([5,4]); c.stroke();
        c.setLineDash([]);
      }
    }
  }
  c.textAlign='center';
  M(c,10.5); c.fillStyle='rgba(85,97,128,1)';
  c.fillText('same next-token output — different amount of state and depth', cx, H-22);
});

// ---------- 1 baseline ----------
A('v1-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.18);
  var L=6, bw=Math.min(230,W*.24), bh=Math.min(38,(H-140)/L);
  var ox=W*.30-bw/2, oy=(H-L*(bh+12))/2+8;
  var act=Math.floor((t*1.5)%L);
  for(var i=0;i<L;i++){
    var y=oy+i*(bh+12), on=i===act;
    bx(c,ox,y,bw,bh,7);
    c.fillStyle= on?'rgba(30,41,59,.96)':'rgba(11,17,32,.85)'; c.fill();
    c.strokeStyle= on?'rgba(148,163,184,.95)':'rgba(24,35,58,1)';
    c.lineWidth= on?2:1; c.stroke();
    M(c,11); c.textAlign='left';
    c.fillStyle= on?'rgba(226,232,240,1)':'rgba(85,97,128,1)';
    c.fillText('layer '+(i+1), ox+12, y+bh/2+4);
    M(c,10); c.textAlign='right';
    c.fillStyle= on?'rgba(148,163,184,.95)':'rgba(85,97,128,.7)';
    c.fillText('own K,V', ox+bw-12, y+bh/2+4);
    // per-layer cache chip
    bx(c,ox+bw+30,y+bh*0.18,bh*0.9,bh*0.64,3);
    c.fillStyle= on?'rgba(148,163,184,.85)':'rgba(30,41,59,.7)'; c.fill();
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('every layer computes and stores its own keys and values — nothing is shared', 24, H-20);
});

// ---------- 2 CED ----------
A('v2-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.18);
  var L=10, bw=Math.min(190,W*.19), bh=Math.min(26,(H-150)/L);
  var ox=W*.26-bw/2, oy=52;
  // The projection diagram is sized from the height left over after the caption,
  // so its bottom row can never land on top of the caption line.
  var band=H-52-46;
  var phh=Math.max(22,Math.min(46,(band-30-36)/4));
  var pgap=Math.max(10,Math.min(18,(band-30-4*phh)/3));
  var pbox=Math.min(160,W*0.15);
  var prx=Math.min(W*0.62, W-pbox-W*0.10-26);
  var ry=52;
  var P=4.6, ph=(t%P)/P;
  for(var i=0;i<L;i++){
    var y=oy+i*(bh+5), enc=i<L/2;
    bx(c,ox,y,bw,bh,5);
    c.fillStyle= enc?'rgba(77,107,254,.85)':'rgba(31,109,122,.85)'; c.fill();
    M(c,10.5); c.textAlign='left'; c.fillStyle='rgba(238,243,255,.94)';
    c.fillText(enc?'encoder '+(i+1):'decoder '+(i-L/2+1), ox+10, y+bh/2+4);
  }
  var midY=oy+(L/2)*(bh+5);
  var lineEnd=Math.min(ox+bw+70, prx-24);
  c.beginPath(); c.moveTo(ox-30,midY); c.lineTo(lineEnd,midY);
  c.strokeStyle='rgba(251,191,36,.6)'; c.lineWidth=1.5; c.setLineDash([6,5]); c.stroke();
  c.setLineDash([]);
  // right-aligned on the dashed line, so it can never reach the diagram
  M(c,10); c.textAlign='right'; c.fillStyle='rgba(251,191,36,.95)';
  c.fillText('H(L/2) emitted', lineEnd, midY+4);

  // the projection diagram on the right
  var rx=prx;
  // H(L/2) source
  bx(c,rx,ry,pbox,phh,7);
  c.fillStyle='rgba(77,107,254,.28)'; c.fill();
  c.strokeStyle='rgba(124,147,255,.85)'; c.lineWidth=1.6; c.stroke();
  M(c,11); c.textAlign='center'; c.fillStyle='rgba(238,243,255,.95)';
  c.fillText('H(L/2)', rx+pbox/2, ry+phh/2+4);

  // three decoder targets
  var pulse=.5+.5*Math.sin(t*2);
  for(var j=0;j<3;j++){
    var ty=ry+phh+30+j*(phh+pgap);
    bx(c,rx+W*0.10,ty,pbox,phh,7);
    c.fillStyle='rgba(31,109,122,.8)'; c.fill();
    c.strokeStyle='rgba(34,211,238,.8)'; c.lineWidth=1.4; c.stroke();
    M(c,10.5); c.textAlign='center'; c.fillStyle='rgba(238,243,255,.9)';
    c.fillText('C'+(j+1)+' = H(L/2) · W', rx+W*0.10+pbox/2, ty+phh/2+4);
    // arrow
    c.beginPath();
    c.moveTo(rx+pbox, ry+phh/2);
    c.quadraticCurveTo(rx+(W*0.10)/2, ry+phh/2+pgap*2.6, rx+W*0.10, ty+phh/2);
    c.strokeStyle='rgba(34,211,238,'+(0.28+0.42*pulse)+')'; c.lineWidth=1.6; c.stroke();
  }
  M(c,10); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('one hidden state feeds every decoder layer — prefill runs half the depth', ox-30, H-20);
});

// ---------- 3 prefill race ----------
A('v3-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var L=12, bw=Math.min(46,(W-260)/L*0.8), bh=34;
  var yA=H*0.34, yB=H*0.62;
  var PER=4.2, ph=(t%PER)/PER;
  var stepA=Math.floor(ph*L*1.25), stepB=Math.floor(ph*L*1.25);
  var ox=Math.max(96,(W-bw*L-6*(L-1))/2);
  // left labels
  M(c,11); c.textAlign='right'; c.fillStyle='rgba(148,163,184,.9)';
  c.fillText('standard', ox-16, yA+bh/2+4);
  c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('V4.1', ox-16, yB+bh/2+4);

  var workA=0, workB=0;
  for(var i=0;i<L;i++){
    var x=ox+i*(bw+6);
    // A
    var onA=i<stepA;
    bx(c,x,yA,bw,bh,5);
    c.fillStyle= onA?'rgba(71,85,105,.92)':'rgba(11,17,32,.8)'; c.fill();
    if(onA){ c.strokeStyle='rgba(148,163,184,.8)'; c.lineWidth=1.3; c.stroke(); workA+=100; }
    // B
    var onB=i<stepB, enc=i<L/2;
    bx(c,x,yB,bw,bh,5);
    if(onB){ c.fillStyle= enc?'rgba(77,107,254,.88)':'rgba(31,109,122,.88)'; workB += enc?100:14; }
    else c.fillStyle='rgba(11,17,32,.8)';
    c.fill();
    if(onB){ c.strokeStyle= enc?'rgba(124,147,255,.85)':'rgba(34,211,238,.85)'; c.lineWidth=1.3; c.stroke(); }
  }
  // readouts
  M(c,11); c.textAlign='right';
  c.fillStyle='rgba(148,163,184,.95)';
  c.fillText('work '+workA, W-30, yA+bh/2+4);
  c.fillStyle='rgba(34,211,238,1)';
  c.fillText('work '+workB, W-30, yB+bh/2+4);
  if(ph>0.97 && workA>0){
    S(c,15); c.textAlign='center'; c.fillStyle='rgba(52,211,153,1)';
    c.fillText('~'+Math.round((1-workB/workA)*100)+'% less prefill work', W/2, H-30);
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('the encoder half runs at full cost; the decoder resolves its global KV by projection', 24, 26);
});

// ---------- 4 CSA2 modes ----------
A('v4-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var L=9, bw=Math.min(178,W*.19), bh=Math.min(24,(H-150)/L);
  var ox=W*.13, oy=54;
  var MODES=['full','reindex','reuse'];
  var PER=6, ph=(t%PER)/PER, mi=Math.floor(ph*3)%3, mode=MODES[mi];
  var pulse=.5+.5*Math.sin(t*2);
  for(var i=0;i<L;i++){
    var y=oy+i*(bh+6);
    var enc=i<Math.floor(L/2);
    // mode assignment: first decoder layer Full, then alternating Reindex/Reuse
    var m;
    if(enc) m='enc';
    else if(i===Math.floor(L/2)) m='full';
    else m=((i-Math.floor(L/2))%2===0)?'reuse':'reindex';
    var on = (m===mode);
    bx(c,ox,y,bw,bh,5);
    var col;
    if(m==='enc') col='rgba(77,107,254,.75)';
    else if(m==='full') col='rgba(77,107,254,.9)';
    else if(m==='reindex') col='rgba(34,211,238,.85)';
    else col='rgba(251,191,36,.85)';
    c.globalAlpha= on?1:0.28; c.fillStyle=col; c.fill(); c.globalAlpha=1;
    if(on){ c.strokeStyle='rgba(238,243,255,.9)'; c.lineWidth=1.6; c.stroke(); }
    M(c,9.5); c.textAlign='left'; c.fillStyle= on?'rgba(4,6,12,.95)':'rgba(143,162,196,.75)';
    c.fillText(m==='enc'?'encoder':(m+' mode'), ox+9, y+bh/2+4);
  }
  // legend
  var lx=W*.44, ly=H*.24;
  var items=[['Full','builds KV + indexer K + top-K','rgba(77,107,254,1)'],
             ['Reindex','reuses KV, new top-K','rgba(34,211,238,1)'],
             ['Reuse','reuses KV and top-K','rgba(251,191,36,1)']];
  for(var k=0;k<3;k++){
    var iy=ly+k*70, on2=(items[k][0].toLowerCase()===mode);
    c.globalAlpha= on2?1:0.35;
    bx(c,lx,iy,14,14,3); c.fillStyle=items[k][2]; c.fill();
    M(c,12); c.textAlign='left'; c.fillStyle= on2?'rgba(238,243,255,1)':'rgba(143,162,196,.8)';
    c.fillText(items[k][0]+' mode', lx+24, iy+11);
    M(c,10.5); c.fillStyle= on2?'rgba(188,208,255,.95)':'rgba(85,97,128,.9)';
    c.fillText(items[k][1], lx+24, iy+30);
    c.globalAlpha=1;
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('sharing the cache and reusing the selection are separate decisions', 24, H-20);
});

// ---------- 5 hierarchical indexer ----------
A('v5-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var N=64, cols=16, rows=4;
  var panelW=Math.min(150,W*0.19);
  var cell=Math.min((W-100-panelW-40)/cols, (H-140)/rows);
  var ox=90, oy=52;
  var pool=[], i, r, cc;
  // build a deterministic candidate pool
  for(i=0;i<N;i++) pool.push((i*37)%100);
  var sorted=pool.slice().sort(function(a,b){return b-a;});
  var cutoff=sorted[Math.floor(N*0.22)];
  var PER=5.5, ph=(t%PER)/PER;
  var reveal=Math.min(1, ph*1.6);
  var idxPulse=0.5+0.5*Math.sin(t*2.2);
  for(i=0;i<N;i++){
    r=Math.floor(i/cols); cc=i%cols;
    var x=ox+cc*cell, y=oy+r*cell;
    var inPool=pool[i]>=cutoff;
    var scanned = i < N*reveal;
    c.beginPath(); c.rect(x+1,y+1,cell-2,cell-2);
    if(inPool && scanned){
      var t2=(pool[i]-cutoff)/(100-cutoff+1);
      c.fillStyle='hsla('+(190+t2*40)+',80%,'+(45+t2*18)+'%,'+(0.55+0.35*idxPulse)+')';
    } else if(scanned) c.fillStyle='rgba(20,28,46,.9)';
    else c.fillStyle='rgba(11,17,32,.75)';
    c.fill();
    c.strokeStyle='rgba(24,35,58,.7)'; c.lineWidth=.6; c.stroke();
  }
  // annotations
  M(c,11); c.textAlign='left'; c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('first Full-mode layer scans everything', ox, 34);
  M(c,10.5); c.fillStyle='rgba(143,162,196,.85)';
  c.fillText('blocks keep their best score -> top blocks form a candidate pool', ox, oy+rows*cell+26);
  // right panel
  var rx=W-24-panelW;
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('POOL', rx, oy+8);
  S(c,Math.min(22,W/30)); c.fillStyle='rgba(34,211,238,1)';
  c.fillText('16,384', rx, oy+40);
  M(c,10.5); c.fillStyle=DIM;
  c.fillText('candidate', rx, oy+56);
  c.fillText('positions', rx, oy+72);
  c.fillStyle='rgba(143,162,196,.9)';
  c.fillText('2,048 blocks', rx, oy+104);
  c.fillText('x 8 positions', rx, oy+120);
  c.fillStyle='rgba(251,191,36,.95)';
  c.fillText('top-512 per', rx, oy+152);
  c.fillText('reindex layer', rx, oy+168);
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('later indexers search the pool only - cost stops growing with context', ox, H-20);
});

// ---------- 6 cache arithmetic ----------
A('v6-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var ST=[['V1',100,'rgba(148,163,184,1)'],
          ['V4-Flash',6.9,'rgba(148,163,184,1)'],
          ['+ cross-layer reuse',2.6,'rgba(77,107,254,1)'],
          ['+ sequence compression',1.3,'rgba(34,211,238,1)'],
          ['+ FP4  =  V4.1-Flash',1.0,'rgba(52,211,153,1)']];
  var padL=Math.max(168, Math.min(215, W*0.28)), padR=96;
  var gw=W-padL-padR, x0=padL;
  var bh=Math.min(30,(H-120)/ST.length-8);
  var oy=54;
  var PER=7, ph=(t%PER)/PER, reveal=Math.min(ST.length, 1+Math.floor(ph*ST.length));
  for(var i=0;i<ST.length;i++){
    var y=oy+i*(bh+10);
    var on=i<reveal, last=(i===ST.length-1);
    M(c,11); c.textAlign='right';
    c.fillStyle= on?'rgba(188,208,255,.95)':'rgba(85,97,128,.6)';
    c.fillText(ST[i][0], padL-16, y+bh/2+4);
    var w=Math.max(3, (ST[i][1]/100)*gw);
    bx(c,x0,y,w,bh,5);
    c.globalAlpha= on?1:0.18; c.fillStyle=ST[i][2]; c.fill(); c.globalAlpha=1;
    M(c,11); c.textAlign='left';
    c.fillStyle= on?'rgba(238,243,255,.95)':'rgba(85,97,128,.6)';
    c.fillText(ST[i][1]===100?'1x':('1/'+Math.round(100/ST[i][1]))+'x', x0+w+12, y+bh/2+4);
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('global KV per token, drawn to scale from the published comparison (V1 baseline = 100)', 24, H-22);
  if(reveal>=ST.length){
    S(c,15); c.textAlign='left'; c.fillStyle='rgba(52,211,153,1)';
    c.fillText('890 bytes / token', 24, oy+ST.length*(bh+10)+16);
  }
});

// ---------- 7 FP4 ----------
A('v7-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var N=22, cw=Math.min(20,(W-240)/N), ch=54;
  var ox=(W-N*cw)/2, oy=H*.34;
  var PER=5.4, ph=(t%PER)/PER;
  var q = ph<.45 ? ph/.45 : (ph<.75 ? 1 : 1-(ph-.75)/.25);
  // value bars
  for(var i=0;i<N;i++){
    var v=Math.sin(i*.7)*.5+Math.sin(i*.23)*.5;
    var h=Math.abs(v)*ch*1.5+6;
    var x=ox+i*cw;
    // original (tall, smooth)
    c.globalAlpha=1-Math.min(1,q*1.4);
    c.fillStyle='rgba(148,163,184,.75)';
    c.fillRect(x+cw*.12, oy-h/2, cw*.76, h);
    // quantized (stepped, short)
    c.globalAlpha=Math.min(1,q*1.4);
    var step=Math.round(v*3)/3;
    var h2=Math.abs(step)*ch*1.5+6;
    c.fillStyle= step>=0?'rgba(34,211,238,.9)':'rgba(167,139,250,.9)';
    c.fillRect(x+cw*.12, oy-h2/2, cw*.76, h2);
    c.globalAlpha=1;
  }
  // scale blocks under
  var sbY=oy+ch*1.5+26;
  for(var b=0;b<Math.ceil(N/16);b++){
    var bwid=16*cw, bx0=ox+b*bwid;
    bx(c,bx0,sbY,bwid-4,22,4);
    c.fillStyle='rgba(251,191,36,.28)'; c.fill();
    c.strokeStyle='rgba(251,191,36,.7)'; c.lineWidth=1; c.stroke();
    M(c,10); c.textAlign='center'; c.fillStyle='rgba(251,191,36,.95)';
    c.fillText('one E4M3 scale per 16 channels', bx0+(bwid-4)/2, sbY+15);
  }
  // labels
  M(c,11); c.textAlign='left';
  c.globalAlpha=1-Math.min(1,q*1.4); c.fillStyle='rgba(148,163,184,.95)';
  c.fillText('8-bit values', ox, oy-ch*1.5-16); c.globalAlpha=1;
  M(c,11); c.textAlign='right';
  c.globalAlpha=Math.min(1,q*1.4); c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('4-bit (E2M1)', ox+N*cw, oy-ch*1.5-16); c.globalAlpha=1;
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('quantized after RoPE, dequantized before attention - no special matmul support needed', 24, H-20);
});

// ---------- 8 SWA bounded replay ----------
A('v8-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var L=10, nwin=8;
  var topY=H*.28, botY=H*.72;
  var cw=Math.min(34,(W-150-130)/(L*nwin));
  var ox=90;
  // EXACT: L x nwin replayed tokens
  M(c,11); c.textAlign='left'; c.fillStyle='rgba(148,163,184,.95)';
  c.fillText('exact reconstruction', ox, topY-22);
  M(c,10.5); c.fillStyle='rgba(85,97,128,1)';
  c.fillText('L x n_win  =  '+L+' x '+nwin+'  =  '+(L*nwin)+' tokens', ox, topY-6);
  var PER=6, ph=(t%PER)/PER;
  var filled=Math.floor(Math.min(1,ph*1.4)*L*nwin);
  for(var i=0;i<L*nwin;i++){
    var x=ox+i*cw, on=i<filled;
    c.beginPath(); c.rect(x+1,topY,cw-2,22);
    c.fillStyle= on?'rgba(148,163,184,.6)':'rgba(11,17,32,.8)'; c.fill();
    c.strokeStyle='rgba(24,35,58,.8)'; c.lineWidth=.6; c.stroke();
  }
  // BOUNDED: only nwin
  M(c,11); c.textAlign='left'; c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('SWA Bounded Replay', ox, botY-22);
  M(c,10.5); c.fillStyle='rgba(85,97,128,1)';
  c.fillText('n_win  =  '+nwin+' tokens — and the cache is never persisted', ox, botY-6);
  var f2=Math.floor(Math.min(1,ph*1.4)*nwin);
  for(var j=0;j<nwin;j++){
    var x2=ox+j*cw, on2=j<f2;
    c.beginPath(); c.rect(x2+1,botY,cw-2,22);
    c.fillStyle= on2?'rgba(34,211,238,.75)':'rgba(11,17,32,.8)'; c.fill();
    c.strokeStyle='rgba(24,35,58,.8)'; c.lineWidth=.6; c.stroke();
  }
  // saving callout, anchored to the right edge so it is always inside
  var rx=W-24;
  M(c,10.5); c.textAlign='right'; c.fillStyle=DIM;
  c.fillText('PERSISTENT', rx, botY-34);
  S(c,Math.min(22,W/30)); c.fillStyle='rgba(52,211,153,1)';
  c.fillText('1/8', rx, botY-6);
  M(c,10.5); c.fillStyle='rgba(143,162,196,.9)';
  c.fillText('of V4-Flash', rx, botY+12);
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('replaying a window instead of a stack — states are approximate, and the model trains for it', ox, H-20);
});

// ---------- 9 mHC ----------
A('v9-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var LANES=4;
  var ox=W*.12, bw=W*.30, bh=30;
  var cy=H*.46;
  var PER=5, ph=(t%PER)/PER;
  // standard: one lane
  M(c,11); c.textAlign='center'; c.fillStyle='rgba(148,163,184,.95)';
  c.fillText('single residual', ox+bw/2, cy-70);
  bx(c,ox,cy-14,bw,28,6);
  c.fillStyle='rgba(71,85,105,.85)'; c.fill();
  M(c,11); c.fillStyle='rgba(238,243,255,.95)';
  c.fillText('x  +  F(x)', ox+bw/2, cy+5);
  // arrow through
  c.beginPath(); c.moveTo(ox+bw+20,cy); c.lineTo(ox+bw+80,cy);
  c.strokeStyle='rgba(148,163,184,.8)'; c.lineWidth=2; c.stroke();

  // hyper-connections: several lanes
  var hx=W*.56;
  M(c,11); c.textAlign='center'; c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('hyper-connections', hx+bw/2, cy-70);
  var laneH=22, gap=8;
  var totalH=LANES*laneH+(LANES-1)*gap;
  for(var i=0;i<LANES;i++){
    var y=cy-totalH/2+i*(laneH+gap);
    var pulse=.45+.55*Math.abs(Math.sin(t*1.3+i*.7));
    bx(c,hx,y,bw,laneH,5);
    c.fillStyle='rgba(31,109,122,'+(0.5+0.35*pulse)+')'; c.fill();
    c.strokeStyle='rgba(34,211,238,'+(0.5+0.4*pulse)+')'; c.lineWidth=1.3; c.stroke();
  }
  // mixing lines
  for(var a=0;a<LANES;a++) for(var b=0;b<LANES;b++){
    if(a===b) continue;
    var y1=cy-totalH/2+a*(laneH+gap)+laneH/2;
    var y2=cy-totalH/2+b*(laneH+gap)+laneH/2;
    c.beginPath();
    c.moveTo(hx-16,y1);
    c.quadraticCurveTo(hx-44,(y1+y2)/2,hx-16,y2);
    c.strokeStyle='rgba(77,107,254,.28)'; c.lineWidth=1; c.stroke();
  }
  // the learned mixing block sits above the lanes and feeds every one of them
  var mixW=bw*0.62, mixX=hx+(bw-mixW)/2, mixY=cy-totalH/2-40;
  bx(c,mixX,mixY,mixW,24,5);
  c.fillStyle='rgba(77,107,254,.85)'; c.fill();
  c.strokeStyle='rgba(124,147,255,.9)'; c.lineWidth=1.2; c.stroke();
  M(c,10.5); c.textAlign='center'; c.fillStyle='rgba(238,243,255,.95)';
  c.fillText('learned mixing', mixX+mixW/2, mixY+16);
  // fan the mixer output into each lane
  for(var q=0;q<LANES;q++){
    var yq=cy-totalH/2+q*(laneH+gap)+laneH/2;
    c.beginPath();
    c.moveTo(mixX+mixW/2, mixY+24);
    c.lineTo(hx+bw/2, yq);
    c.strokeStyle='rgba(77,107,254,.30)'; c.lineWidth=1; c.stroke();
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('V4.1 fuses the four-kernel update into Single-Pass mHC, halving activation memory traffic', 24, H-20);
});

// ---------- 10 Engram ----------
A('v10-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var TOK=['the','capital','of','France','is'];
  var tx=W*.16, ty=H*.30;
  var PER=5.6, ph=(t%PER)/PER;
  // token n-grams
  M(c,11); c.textAlign='left'; c.fillStyle='rgba(143,162,196,.95)';
  c.fillText('n-gram contexts', tx-60, ty-40);
  for(var i=0;i<TOK.length;i++){
    var y=ty+i*34;
    var on = Math.floor(ph*TOK.length)===i;
    bx(c,tx-60,y,110,26,5);
    c.fillStyle= on?'rgba(77,107,254,.85)':'rgba(11,17,32,.85)'; c.fill();
    c.strokeStyle= on?'rgba(124,147,255,.9)':'rgba(24,35,58,1)'; c.lineWidth=1.3; c.stroke();
    M(c,11); c.textAlign='center'; c.fillStyle= on?'rgba(238,243,255,1)':'rgba(143,162,196,.8)';
    c.fillText(TOK[i], tx-5, y+18);
  }
  // hash arrow
  var hx=tx+90;
  c.beginPath(); c.moveTo(hx,ty+40); c.lineTo(hx+70,ty+40);
  c.strokeStyle='rgba(34,211,238,.7)'; c.lineWidth=2; c.stroke();
  M(c,10.5); c.textAlign='center'; c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('hash', hx+35, ty+30);

  // embedding tables
  var tx2=hx+90, cols=6, rows=4, cell=Math.min(30,(W-tx2-170)/cols);
  var oy2=ty-20;
  var actRow=Math.floor(ph*rows);
  for(var r=0;r<rows;r++) for(var cc=0;cc<cols;cc++){
    var x=tx2+cc*cell, y=oy2+r*cell;
    var on2=(r===actRow);
    c.beginPath(); c.rect(x+1.5,y+1.5,cell-3,cell-3);
    c.fillStyle= on2?'hsla('+(190+cc*8)+',80%,'+(50+cc*3)+'%,.85)':'rgba(11,17,32,.85)';
    c.fill();
    c.strokeStyle='rgba(24,35,58,.8)'; c.lineWidth=.7; c.stroke();
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle='rgba(143,162,196,.9)';
  c.fillText('hash-indexed tables  ·  8 heads  ·  ~16M entries each  ·  FP8', tx2, oy2-12, sx-tx2-18);
  // stats
  var sx=W-130;
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('ENGRAM', sx, ty+6);
  S(c,Math.min(24,W/28)); c.fillStyle='rgba(251,191,36,1)';
  c.fillText('196B', sx, ty+38);
  M(c,10.5); c.fillStyle=DIM;
  c.fillText('parameters', sx, ty+54);
  c.fillStyle='rgba(143,162,196,.9)';
  c.fillText('orders {2,3,4}', sx, ty+84);
  c.fillText('layers 1 & 14', sx, ty+102);
  c.fillStyle='rgba(34,211,238,.95)';
  c.fillText('RDMA prefetch', sx, ty+132);
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('knowledge addressed by hash instead of recalled through a matrix multiply', 24, H-20);
});

// ---------- 11 DSpark ----------
A('v11-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var PER=6, ph=(t%PER)/PER;
  var N=5;
  var bw=Math.min(96,(W-220)/N-14), bh=46;
  var ox=(W-bw*N-14*(N-1))/2, oy=H*.28;
  // draft positions
  var accepted = ph<0.55 ? 0 : (ph<0.75? 3 : 4);
  for(var i=0;i<N;i++){
    var x=ox+i*(bw+14);
    var isAcc = i<accepted;
    bx(c,x,oy,bw,bh,7);
    c.fillStyle= isAcc?'rgba(52,211,153,.78)':'rgba(11,17,32,.85)'; c.fill();
    c.strokeStyle= isAcc?'rgba(52,211,153,1)':'rgba(24,35,58,1)'; c.lineWidth=1.5; c.stroke();
    M(c,11); c.textAlign='center';
    c.fillStyle= isAcc?'rgba(4,6,12,.95)':'rgba(85,97,128,1)';
    c.fillText('draft '+(i+1), x+bw/2, oy+bh/2+4);
  }
  // confidence bars under each
  for(var j=0;j<N;j++){
    var x2=ox+j*(bw+14);
    var conf=[0.94,0.88,0.79,0.55,0.31][j];
    var y2=oy+bh+18, hh=40;
    bx(c,x2+bw*0.2, y2, bw*0.6, hh, 4);
    c.fillStyle='rgba(11,17,32,.85)'; c.fill();
    bx(c,x2+bw*0.2, y2+hh*(1-conf), bw*0.6, hh*conf, 4);
    c.fillStyle= conf>0.6?'rgba(34,211,238,.8)':'rgba(251,113,133,.75)'; c.fill();
    M(c,9.5); c.textAlign='center'; c.fillStyle='rgba(143,162,196,.9)';
    c.fillText((conf*100).toFixed(0)+'%', x2+bw/2, y2+hh+14);
  }
  M(c,10.5); c.textAlign='left'; c.fillStyle='rgba(143,162,196,.9)';
  c.fillText('confidence head predicts per-position acceptance', ox, oy-14);

  // verification bar
  var vy=H*.78;
  bx(c,ox,vy,W-ox*2,30,6);
  c.fillStyle='rgba(11,17,32,.9)'; c.fill();
  c.strokeStyle='rgba(24,35,58,1)'; c.lineWidth=1; c.stroke();
  var vw=(W-ox*2)*(accepted/N);
  bx(c,ox,vy,vw,30,6);
  c.fillStyle='rgba(77,107,254,.85)'; c.fill();
  M(c,11); c.textAlign='left'; c.fillStyle='rgba(238,243,255,.95)';
  c.fillText('verification length: '+accepted+' of '+N+' — scheduler-chosen per request', ox+12, vy+20);
  M(c,10.5); c.textAlign='left'; c.fillStyle=DIM;
  c.fillText('accepted tokens are forward passes you never had to run', 24, H-20);
});

// ---------- 12 payoff ----------
A('v12-art', function(c,W,H,t){
  c.clearRect(0,0,W,H); gd(c,W,H,48,.14);
  var gx=90, gy=48, gw=W-220, gh=H-130;
  c.beginPath(); c.moveTo(gx,gy); c.lineTo(gx,gy+gh); c.lineTo(gx+gw,gy+gh);
  c.strokeStyle='rgba(38,52,79,1)'; c.stroke();
  var prog=Math.min(1,(t%7)/5), i;
  // V4-Flash: grows clearly
  c.beginPath();
  for(i=0;i<=100*prog;i++){
    var x=gx+(i/100)*gw;
    var v=0.12+0.72*Math.pow(i/100,0.62);
    var y=gy+gh-v*gh;
    if(i===0) c.moveTo(x,y); else c.lineTo(x,y);
  }
  c.strokeStyle='rgba(148,163,184,1)'; c.lineWidth=2.6; c.stroke();
  // V4.1: nearly flat
  c.beginPath();
  for(i=0;i<=100*prog;i++){
    var x2=gx+(i/100)*gw;
    var v2=0.30+0.075*(i/100);
    var y2=gy+gh-v2*gh;
    if(i===0) c.moveTo(x2,y2); else c.lineTo(x2,y2);
  }
  c.strokeStyle='rgba(34,211,238,1)'; c.lineWidth=3; c.stroke();
  // endpoint marker
  if(prog>=1){
    c.beginPath(); c.arc(gx+gw, gy+gh-(0.30+0.075)*gh, 5, 0, Math.PI*2);
    c.fillStyle='rgba(34,211,238,1)'; c.fill();
  }
  // labels
  M(c,11.5); c.textAlign='left';
  c.fillStyle='rgba(148,163,184,.95)'; c.fillText('V4-Flash', gx+gw*0.42, gy+30);
  c.fillStyle='rgba(34,211,238,1)';    c.fillText('V4.1-Flash  (+25% over 256x)', gx+gw*0.42, gy+gh*0.60);
  M(c,10.5); c.fillStyle=DIM;
  c.fillText('4K', gx, gy+gh+22);
  c.fillText('1M', gx+gw-16, gy+gh+22);
  c.fillText('context length ->', gx+gw*0.44, gy+gh+22);
  c.fillText('single-token decode FLOPs, schematic of the reported trend', gx, H-20);
});

// ---------- scroll bar ----------
var bar=document.getElementById('bar');
addEventListener('scroll',function(){
  var h=document.documentElement.scrollHeight-innerHeight;
  bar.style.width=(h>0?(scrollY/h*100):0)+'%';
},{passive:true});
