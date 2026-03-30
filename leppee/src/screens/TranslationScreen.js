import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Detección de señas LSM ─────────────────────────────────
function detectar(L) {
  if (!L || L.length < 21) return null;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const W  = dist(L[5], L[17]);
  const I  = L[8].y  < L[6].y;
  const M  = L[12].y < L[10].y;
  const An = L[16].y < L[14].y;
  const Me = L[20].y < L[18].y;
  const P  = dist(L[4], L[2]) > W * 0.45;
  const dPI = dist(L[4], L[8]);
  const dPM = dist(L[4], L[12]);
  const dPA = dist(L[4], L[16]);
  const dIM = dist(L[8], L[12]);
  const dMA = dist(L[12], L[16]);

  if (I&&M&&An&&Me&&P)                                  return {sena:'5',   nombre:'Cinco / Hola',  emoji:'👋', conf:0.93};
  if (I&&M&&An&&Me&&!P&&dIM<W*.28&&dMA<W*.28)           return {sena:'B',   nombre:'Letra B',       emoji:'🤚', conf:0.90};
  if (I&&M&&An&&Me&&!P)                                 return {sena:'4',   nombre:'Número 4',      emoji:'4️⃣', conf:0.86};
  if (I&&M&&An&&!Me&&!P)                                return {sena:'W',   nombre:'Letra W',       emoji:'✋', conf:0.85};
  if (I&&M&&!An&&!Me&&!P&&dIM>=W*.22)                   return {sena:'V',   nombre:'Letra V / 2',   emoji:'✌️', conf:0.87};
  if (I&&M&&!An&&!Me&&!P&&dIM<W*.22)                    return {sena:'U',   nombre:'Letra U',       emoji:'🤞', conf:0.83};
  if (!I&&!M&&!An&&Me&&P)                               return {sena:'Y',   nombre:'Te Amo / Y',    emoji:'🤟', conf:0.88};
  if (!I&&!M&&!An&&Me&&!P)                              return {sena:'I',   nombre:'Letra I',       emoji:'🤙', conf:0.88};
  if (I&&!M&&!An&&!Me&&P&&(L[8].y-L[4].y)<-W*.2)       return {sena:'L',   nombre:'Letra L',       emoji:'👆', conf:0.86};
  if (!I&&!M&&!An&&!Me&&P)                              return {sena:'A',   nombre:'Letra A',       emoji:'✊', conf:0.88};
  if (I&&!M&&!An&&!Me&&!P)                              return {sena:'1',   nombre:'Número 1',      emoji:'☝️', conf:0.90};
  if (I&&M&&!An&&!Me&&P&&dIM<W*.35)                     return {sena:'3',   nombre:'Número 3',      emoji:'3️⃣', conf:0.82};
  if (I&&M&&!An&&!Me&&P&&dIM>=W*.35)                    return {sena:'K',   nombre:'Letra K',       emoji:'✋', conf:0.78};
  if (!I&&M&&An&&Me&&!P&&dPI<W*.28)                     return {sena:'F',   nombre:'Letra F',       emoji:'🤌', conf:0.80};
  if (!I&&M&&An&&Me&&P&&dPI<W*.28)                      return {sena:'OK',  nombre:'OK / Bien',     emoji:'👌', conf:0.82};
  if (!I&&!M&&!An&&!Me&&!P&&dPI<W*.28)                  return {sena:'O',   nombre:'Letra O / 0',   emoji:'⭕', conf:0.82};
  if (!I&&!M&&!An&&!Me&&!P)                             return {sena:'S',   nombre:'Letra S',       emoji:'✊', conf:0.76};
  return null;
}

const SENAS = ['A','B','F','I','K','L','O','S','U','V','W','Y','1','3','4','5','OK'];

// ─── Web Component ──────────────────────────────────────────
function TranslationWeb({ navigation }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const handsRef  = useRef(null);
  const rafRef    = useRef(null);
  const lastSena  = useRef(null);
  const frames    = useRef(0);
  const busy      = useRef(false);

  const [fase,     setFase]     = useState('cargando');
  const [detected, setDetected] = useState(null);
  const [hist,     setHist]     = useState([]);
  const [mano,     setMano]     = useState(false);
  const [errMsg,   setErrMsg]   = useState('');

  const speak = (t) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t.replace(/[^\w\sáéíóúüñ]/gi,''));
    u.lang = 'es-MX'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const drawHand = (ctx, L, w, h) => {
    const C = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    ctx.strokeStyle='#f43f8e'; ctx.lineWidth=3; ctx.shadowBlur=6; ctx.shadowColor='#db2777';
    C.forEach(([a,b])=>{
      ctx.beginPath(); ctx.moveTo(L[a].x*w,L[a].y*h); ctx.lineTo(L[b].x*w,L[b].y*h); ctx.stroke();
    });
    ctx.shadowBlur=0;
    L.forEach((p,i)=>{
      ctx.beginPath(); ctx.arc(p.x*w,p.y*h,[0,4,8,12,16,20].includes(i)?8:5,0,Math.PI*2);
      ctx.fillStyle=[0,4,8,12,16,20].includes(i)?'#fbbf24':'#fff'; ctx.fill();
    });
  };

  const onResults = (r) => {
    const cv = canvasRef.current; if (!cv){busy.current=false;return;}
    const ctx = cv.getContext('2d');
    ctx.clearRect(0,0,cv.width,cv.height);
    if (r.multiHandLandmarks?.length>0) {
      const L = r.multiHandLandmarks[0];
      setMano(true);
      drawHand(ctx,L,cv.width,cv.height);
      const res = detectar(L);
      if (res) {
        if (res.sena===lastSena.current) {
          frames.current++;
          if (frames.current===8) {
            setDetected(res);
            speak(res.nombre);
            setHist(p=>[res,...p.filter(x=>x.sena!==res.sena)].slice(0,6));
          }
        } else { lastSena.current=res.sena; frames.current=1; }
      } else { lastSena.current=null; frames.current=0; setDetected(null); }
    } else { setMano(false); setDetected(null); lastSena.current=null; frames.current=0; }
    busy.current=false;
  };

  const loop = () => {
    if (handsRef.current && videoRef.current?.readyState>=2 && !busy.current) {
      busy.current=true;
      handsRef.current.send({image:videoRef.current}).catch(()=>{busy.current=false;});
    }
    rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{
    let dead=false;
    const addScript = src => new Promise((ok,no)=>{
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s=document.createElement('script');
      s.src=src; s.crossOrigin='anonymous'; s.onload=ok; s.onerror=no;
      document.head.appendChild(s);
    });

    (async()=>{
      try {
        // 1 — cargar librería
        await addScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');
        if(dead)return;

        // 2 — cámara
        const stream = await navigator.mediaDevices.getUserMedia({
          video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}
        });
        if(dead){stream.getTracks().forEach(t=>t.stop());return;}

        const vid = videoRef.current;
        vid.srcObject = stream;

        // Esperar que el video tenga datos reales
        await new Promise(res=>{
          vid.onloadeddata = res;
          vid.play().catch(()=>{});
          // fallback si onloadeddata no dispara
          setTimeout(res, 4000);
        });
        if(dead)return;

        // Asegurar que readyState sea suficiente
        await new Promise(res=>{
          const t=setInterval(()=>{ if(vid.readyState>=2){clearInterval(t);res();} },100);
          setTimeout(()=>{clearInterval(t);res();},5000);
        });
        if(dead)return;

        // 3 — MediaPipe
        const hands = new window.Hands({
          locateFile: f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
        });
        hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
        hands.onResults(onResults);

        // Warm-up: enviar primer frame para forzar descarga WASM
        try { await hands.send({image:vid}); } catch(_){}
        handsRef.current=hands;
        if(dead)return;

        setFase('listo');
        loop();

      } catch(e){
        setErrMsg(e.message||'Error');
        setFase('error');
      }
    })();

    return ()=>{
      dead=true;
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop());
      handsRef.current?.close();
    };
  },[]);

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0225 0%,#1e0840 40%,#0d0020 100%)',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',color:'#fce7f3'}}>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 22px',background:'rgba(13,0,32,0.85)',borderBottom:'1px solid rgba(219,39,119,0.2)',backdropFilter:'blur(12px)'}}>
        <button onClick={()=>navigation.goBack()} style={{background:'none',border:'1px solid rgba(249,168,212,0.35)',color:'#f9a8d4',padding:'6px 16px',borderRadius:20,fontSize:13,cursor:'pointer'}}>
          ← Volver
        </button>
        <div style={{textAlign:'center'}}>
          <div style={{color:'#fce7f3',fontSize:16,fontWeight:700,letterSpacing:0.4}}>Traducción LSM</div>
          <div style={{color:'rgba(249,168,212,0.45)',fontSize:11}}>Tiempo Real · Lengua de Señas Mexicana</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,background:fase==='listo'?'rgba(74,222,128,0.12)':'rgba(219,39,119,0.12)',border:`1px solid ${fase==='listo'?'rgba(74,222,128,0.4)':'rgba(219,39,119,0.35)'}`,borderRadius:20,padding:'5px 12px'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:fase==='listo'?'#4ade80':'#db2777'}}/>
          <span style={{color:fase==='listo'?'#4ade80':'#f9a8d4',fontSize:12}}>{fase==='listo'?'En vivo':fase==='error'?'Error':'Cargando…'}</span>
        </div>
      </div>

      {/* BODY */}
      <div style={{display:'flex',flex:1,gap:16,padding:16}}>

        {/* ── COLUMNA IZQUIERDA: Cámara ── */}
        <div style={{flex:1,display:'flex',flexDirection:'column',gap:12,minWidth:0}}>

          {/* Tarjeta cámara */}
          <div style={{background:'rgba(0,0,0,0.5)',border:'1px solid rgba(219,39,119,0.3)',borderRadius:18,overflow:'hidden',position:'relative'}}>

            {/* VIDEO real — no absolute, tiene altura fija */}
            <div style={{position:'relative',width:'100%',height:480,background:'#000',overflow:'hidden'}}>
              <video
                ref={videoRef}
                style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',display:'block'}}
                playsInline muted autoPlay
              />
              <canvas
                ref={canvasRef}
                width={1280} height={720}
                style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',transform:'scaleX(-1)'}}
              />

              {/* Marco guía */}
              {fase==='listo' && (
                <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:200,height:200,pointerEvents:'none'}}>
                  {[{top:0,left:0,borderRight:'none',borderBottom:'none'},{top:0,right:0,borderLeft:'none',borderBottom:'none'},{bottom:0,left:0,borderRight:'none',borderTop:'none'},{bottom:0,right:0,borderLeft:'none',borderTop:'none'}].map((s,i)=>(
                    <div key={i} style={{position:'absolute',width:26,height:26,border:'2.5px solid rgba(219,39,119,0.8)',...s}}/>
                  ))}
                  <span style={{position:'absolute',bottom:-24,left:'50%',transform:'translateX(-50%)',color:'rgba(252,231,243,0.45)',fontSize:11,whiteSpace:'nowrap'}}>Coloca tu mano aquí</span>
                </div>
              )}

              {/* Badge mano */}
              {fase==='listo' && (
                <div style={{position:'absolute',top:10,left:10,display:'flex',alignItems:'center',gap:5,background:mano?'rgba(74,222,128,0.18)':'rgba(13,0,32,0.7)',border:`1px solid ${mano?'rgba(74,222,128,0.5)':'rgba(219,39,119,0.3)'}`,borderRadius:16,padding:'4px 10px'}}>
                  <div style={{width:7,height:7,borderRadius:'50%',background:mano?'#4ade80':'#f43f8e'}}/>
                  <span style={{color:mano?'#4ade80':'#f9a8d4',fontSize:11}}>{mano?'✋ Mano detectada':'Sin mano'}</span>
                </div>
              )}

              {/* Overlay cargando */}
              {fase==='cargando' && (
                <div style={{position:'absolute',inset:0,background:'rgba(10,0,22,0.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,zIndex:10}}>
                  <div style={{width:52,height:52,border:'3px solid rgba(219,39,119,0.15)',borderTop:'3px solid #db2777',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
                  <p style={{color:'#fce7f3',fontSize:15,fontWeight:600,margin:0}}>🧠 Cargando modelo IA…</p>
                  <p style={{color:'rgba(249,168,212,0.5)',fontSize:12,margin:0}}>Primera vez ~15 segundos</p>
                </div>
              )}

              {/* Overlay error */}
              {fase==='error' && (
                <div style={{position:'absolute',inset:0,background:'rgba(10,0,22,0.92)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,zIndex:10}}>
                  <p style={{fontSize:40,margin:0}}>😕</p>
                  <p style={{color:'#fca5a5',fontSize:13,textAlign:'center',margin:'0 20px'}}>{errMsg}</p>
                  <button onClick={()=>window.location.reload()} style={{background:'none',border:'1px solid rgba(249,168,212,0.4)',color:'#f9a8d4',padding:'7px 18px',borderRadius:16,fontSize:13,cursor:'pointer'}}>Reintentar</button>
                </div>
              )}
            </div>

            {/* Chips señas disponibles */}
            <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color:'rgba(249,168,212,0.4)',fontSize:10,fontWeight:700,letterSpacing:0.8,flexShrink:0}}>DETECTA:</span>
              {SENAS.map(s=>(
                <span key={s} style={{padding:'2px 9px',borderRadius:10,fontSize:11,fontWeight:600,border:'1px solid',transition:'all .2s',
                  background:detected?.sena===s?'rgba(219,39,119,0.4)':'rgba(147,51,234,0.12)',
                  borderColor:detected?.sena===s?'#db2777':'rgba(147,51,234,0.3)',
                  color:detected?.sena===s?'#fce7f3':'#c4b5fd',
                  transform:detected?.sena===s?'scale(1.12)':'scale(1)',
                }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── COLUMNA DERECHA: Resultado ── */}
        <div style={{width:280,flexShrink:0,display:'flex',flexDirection:'column',gap:12}}>

          {/* Resultado principal */}
          <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(219,39,119,0.3)',borderRadius:18,padding:'18px 16px',minHeight:210,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            {detected ? (
              <div style={{textAlign:'center',width:'100%'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:8}}>
                  <span style={{fontSize:44}}>{detected.emoji}</span>
                  <span style={{fontSize:64,fontWeight:800,color:'#fce7f3',lineHeight:1,textShadow:'0 0 28px rgba(219,39,119,0.5)'}}>{detected.sena}</span>
                </div>
                <p style={{color:'#f9a8d4',fontSize:16,fontWeight:600,margin:'0 0 12px'}}>{detected.nombre}</p>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <div style={{flex:1,height:5,background:'rgba(255,255,255,0.08)',borderRadius:5,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:5,width:`${Math.round(detected.conf*100)}%`,background:detected.conf>=0.88?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,#fbbf24,#f59e0b)',transition:'width .4s'}}/>
                  </div>
                  <span style={{color:'rgba(249,168,212,0.5)',fontSize:11,minWidth:28}}>{Math.round(detected.conf*100)}%</span>
                </div>
                <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'3px 10px'}}>
                  <span style={{fontSize:13}}>🔊</span>
                  <span style={{color:'rgba(249,168,212,0.55)',fontSize:11}}>Traducido por voz</span>
                </div>
              </div>
            ) : (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:50,marginBottom:10}}>{fase==='listo'?(mano?'👁️':'🖐️'):'⏳'}</div>
                <p style={{color:'rgba(249,168,212,0.55)',fontSize:14,margin:'0 0 6px'}}>
                  {fase!=='listo'?'Cargando modelo…':mano?'Analizando seña…':'Muestra tu mano'}
                </p>
                <p style={{color:'rgba(249,168,212,0.3)',fontSize:12,margin:0}}>Quieta ~0.5 segundos</p>
              </div>
            )}
          </div>

          {/* Historial */}
          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(147,51,234,0.22)',borderRadius:16,padding:'14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{color:'#f9a8d4',fontSize:10,fontWeight:700,letterSpacing:1.1}}>HISTORIAL</span>
              {hist.length>0&&<button onClick={()=>setHist([])} style={{background:'none',border:'1px solid rgba(249,168,212,0.22)',color:'#f9a8d4',padding:'2px 8px',borderRadius:8,fontSize:10,cursor:'pointer'}}>Limpiar</button>}
            </div>
            {hist.length===0
              ?<p style={{color:'rgba(249,168,212,0.3)',fontSize:12,textAlign:'center',margin:0}}>Sin señas aún</p>
              :<div style={{display:'flex',flexDirection:'column',gap:6}}>
                {hist.map((s,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'7px 10px',opacity:1-i*0.12}}>
                    <span style={{fontSize:18}}>{s.emoji}</span>
                    <div>
                      <p style={{color:'#fce7f3',fontSize:13,fontWeight:600,margin:0}}>{s.sena}</p>
                      <p style={{color:'rgba(249,168,212,0.55)',fontSize:11,margin:0}}>{s.nombre}</p>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Cómo usar */}
          <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:16,padding:'14px'}}>
            <span style={{color:'#f9a8d4',fontSize:10,fontWeight:700,letterSpacing:1.1}}>CÓMO USAR</span>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
              {[['💡','Buena luz'],['🖐️','Mano al frente'],['⏱️','Quieta 0.5s'],['🔊','Escucha la voz']].map(([e,t])=>(
                <div key={t} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'8px 6px'}}>
                  <span style={{fontSize:20}}>{e}</span>
                  <span style={{color:'rgba(249,168,212,0.65)',fontSize:10,textAlign:'center'}}>{t}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}

// ─── Export ─────────────────────────────────────────────────
export default function TranslationScreen({ navigation }) {
  if (Platform.OS === 'web') return <TranslationWeb navigation={navigation} />;
  return (
    <LinearGradient colors={['#0f0225','#1a0535','#0d0020']} style={{flex:1,alignItems:'center',justifyContent:'center',padding:32}}>
      <Text style={{color:'#fce7f3',fontSize:20,fontWeight:'700',textAlign:'center',marginBottom:10}}>
        Disponible en versión web
      </Text>
      <Text style={{color:'#f9a8d4',fontSize:14,textAlign:'center'}}>
        Abre localhost:8081 en tu navegador
      </Text>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginTop:28,padding:12,borderWidth:1,borderColor:'rgba(249,168,212,0.4)',borderRadius:24}}>
        <Text style={{color:'#f9a8d4'}}>← Volver</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}