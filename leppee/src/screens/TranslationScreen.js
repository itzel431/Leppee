import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ── Detección de dedos inline (sin imports externos) ──────────
function detectar(L) {
  if (!L || L.length < 21) return null;

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const W = dist(L[5], L[17]); // ancho de la mano

  // Estado de cada dedo (true = extendido)
  const I  = L[8].y  < L[6].y;   // índice
  const M  = L[12].y < L[10].y;  // medio
  const An = L[16].y < L[14].y;  // anular
  const Me = L[20].y < L[18].y;  // meñique
  const P  = dist(L[4], L[2]) > W * 0.45; // pulgar

  // Distancias entre puntas
  const dPI  = dist(L[4], L[8]);
  const dPM  = dist(L[4], L[12]);
  const dPA  = dist(L[4], L[16]);
  const dPMe = dist(L[4], L[20]);
  const dIM  = dist(L[8], L[12]);
  const dMA  = dist(L[12], L[16]);
  const dAMe = dist(L[16], L[20]);

  // ─── Señas estáticas del abecedario LSM ───────────────────

  // 5 / HOLA — mano completamente abierta
  if (I && M && An && Me && P)
    return { sena:'5', nombre:'Cinco / Hola 👋', desc:'Mano completamente abierta', conf:0.93 };

  // B — 4 dedos estirados juntos, pulgar doblado
  if (I && M && An && Me && !P && dIM < W*0.3 && dMA < W*0.3)
    return { sena:'B', nombre:'Letra B', desc:'Cuatro dedos juntos, pulgar doblado', conf:0.90 };

  // 4 — 4 dedos estirados separados, sin pulgar
  if (I && M && An && Me && !P && (dIM > W*0.3 || dMA > W*0.3))
    return { sena:'4', nombre:'Número 4', desc:'Cuatro dedos separados sin pulgar', conf:0.86 };

  // W / 3 dedos — índice, medio y anular
  if (I && M && An && !Me && !P)
    return { sena:'W', nombre:'Letra W / 3 dedos', desc:'Índice, medio y anular estirados', conf:0.85 };

  // V / 2 — índice y medio separados
  if (I && M && !An && !Me && !P && dIM >= W*0.22)
    return { sena:'V', nombre:'Letra V / Número 2 ✌️', desc:'Índice y medio separados', conf:0.87 };

  // U — índice y medio juntos
  if (I && M && !An && !Me && !P && dIM < W*0.22)
    return { sena:'U', nombre:'Letra U', desc:'Índice y medio juntos hacia arriba', conf:0.83 };

  // Y / TE AMO — meñique y pulgar estirados
  if (!I && !M && !An && Me && P)
    return { sena:'Y', nombre:'Letra Y / Te amo ❤️', desc:'Pulgar y meñique estirados', conf:0.88 };

  // I — solo meñique estirado
  if (!I && !M && !An && Me && !P)
    return { sena:'I', nombre:'Letra I', desc:'Solo meñique estirado', conf:0.88 };

  // L — índice y pulgar forman L
  if (I && !M && !An && !Me && P && (L[8].y - L[4].y) < -W*0.2)
    return { sena:'L', nombre:'Letra L', desc:'Índice arriba, pulgar al lado — forma L', conf:0.86 };

  // A — puño cerrado con pulgar al lado
  if (!I && !M && !An && !Me && P)
    return { sena:'A', nombre:'Letra A', desc:'Puño cerrado, pulgar estirado al lado', conf:0.88 };

  // 1 — solo índice estirado
  if (I && !M && !An && !Me && !P)
    return { sena:'1', nombre:'Número 1 / D', desc:'Solo el índice estirado', conf:0.90 };

  // 3 — pulgar + índice + medio
  if (I && M && !An && !Me && P && dIM < W*0.35)
    return { sena:'3', nombre:'Número 3', desc:'Pulgar, índice y medio estirados', conf:0.82 };

  // K / H — índice, medio y pulgar con pulgar entre ellos
  if (I && M && !An && !Me && P && dIM > W*0.35)
    return { sena:'K', nombre:'Letra K', desc:'Índice, medio y pulgar estirados', conf:0.78 };

  // F — índice toca pulgar, otros estirados
  if (!I && M && An && Me && !P && dPI < W*0.28)
    return { sena:'F', nombre:'Letra F', desc:'Índice toca pulgar, otros tres estirados', conf:0.80 };

  // 9 — índice toca pulgar, tres dedos estirados
  if (!I && M && An && Me && !P && dPI > W*0.28)
    return { sena:'9', nombre:'Número 9', desc:'Índice y pulgar en aro, tres dedos arriba', conf:0.80 };

  // BIEN/OK — índice y pulgar en aro, otros estirados
  if (!I && M && An && Me && P && dPI < W*0.28)
    return { sena:'OK', nombre:'Bien / OK 👌', desc:'Índice y pulgar forman aro', conf:0.82 };

  // 7 — anular toca pulgar
  if (I && M && !An && Me && !P && dPA < W*0.3)
    return { sena:'7', nombre:'Número 7', desc:'Anular toca pulgar', conf:0.78 };

  // 8 — medio toca pulgar
  if (I && !M && An && Me && !P && dPM < W*0.3)
    return { sena:'8', nombre:'Número 8', desc:'Medio toca pulgar', conf:0.78 };

  // O — todos los dedos forman O
  if (!I && !M && !An && !Me && !P && dPI < W*0.28 && dPMe < W*0.38)
    return { sena:'O', nombre:'Letra O / Número 0', desc:'Todos los dedos forman una O', conf:0.82 };

  // S — puño cerrado (pulgar encima)
  if (!I && !M && !An && !Me && !P && L[4].y < L[8].y)
    return { sena:'S', nombre:'Letra S', desc:'Puño cerrado, pulgar sobre los dedos', conf:0.76 };

  // E — puño cerrado (uñas al frente)
  if (!I && !M && !An && !Me && !P)
    return { sena:'E', nombre:'Letra E', desc:'Todos los dedos doblados, uñas al frente', conf:0.75 };

  return null;
}

// ─────────────────────────────────────────────────────────────
function TranslationWeb({ navigation }) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const handsRef     = useRef(null);
  const rafRef       = useRef(null);
  const lastSena     = useRef(null);
  const contador     = useRef(0);
  const procesando   = useRef(false);

  const [estado,        setEstado]        = useState('cargando'); // cargando | listo | error
  const [senaDetectada, setSenaDetectada] = useState(null);
  const [historial,     setHistorial]     = useState([]);
  const [errorMsg,      setErrorMsg]      = useState('');

  // ── Voz ──────────────────────────────────────────────────
  const hablar = (texto) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'es-MX';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  // ── Esqueleto de la mano ─────────────────────────────────
  const dibujarMano = (ctx, L, w, h) => {
    const CONEXIONES = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];
    ctx.strokeStyle = '#f43f8e';
    ctx.lineWidth   = 3;
    CONEXIONES.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(L[a].x * w, L[a].y * h);
      ctx.lineTo(L[b].x * w, L[b].y * h);
      ctx.stroke();
    });
    L.forEach((lm, i) => {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, i === 0 ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = [0,4,8,12,16,20].includes(i) ? '#fbbf24' : '#ffffff';
      ctx.fill();
    });
  };

  // ── Procesa resultado de MediaPipe ───────────────────────
  const onResults = (results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks?.length > 0) {
      const L = results.multiHandLandmarks[0];
      dibujarMano(ctx, L, canvas.width, canvas.height);

      const res = detectar(L);
      if (res) {
        if (res.sena === lastSena.current) {
          contador.current++;
          if (contador.current === 8) { // ~0.5 segundos
            setSenaDetectada(res);
            hablar(res.nombre.replace(/[^\w\s]/gi, '')); // sin emojis en voz
            setHistorial(prev =>
              [res.nombre, ...prev.filter(x => x !== res.nombre)].slice(0, 10)
            );
          }
        } else {
          lastSena.current = res.sena;
          contador.current = 1;
        }
      } else {
        lastSena.current = null;
        contador.current = 0;
        setSenaDetectada(null);
      }
    } else {
      setSenaDetectada(null);
      lastSena.current = null;
      contador.current = 0;
    }
    procesando.current = false;
  };

  // ── Loop de frames ───────────────────────────────────────
  const loop = () => {
    if (
      handsRef.current &&
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      !procesando.current
    ) {
      procesando.current = true;
      handsRef.current.send({ image: videoRef.current }).catch(() => {
        procesando.current = false;
      });
    }
    rafRef.current = requestAnimationFrame(loop);
  };

  // ── Inicialización ───────────────────────────────────────
  useEffect(() => {
    let stopped = false;

    const loadScript = (src) => new Promise((ok, fail) => {
      if (document.querySelector(`script[src="${src}"]`)) return ok();
      const s = document.createElement('script');
      s.src = src; s.crossOrigin = 'anonymous';
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });

    (async () => {
      try {
        // 1. Carga scripts
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');

        if (stopped) return;

        // 2. Cámara
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        // 3. MediaPipe
        const hands = new window.Hands({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`
        });
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });
        hands.onResults(onResults);

        // 4. Espera que el modelo cargue enviando un frame vacío
        await hands.send({ image: video });
        handsRef.current = hands;

        if (stopped) return;
        setEstado('listo');
        loop();

      } catch (err) {
        setErrorMsg(err.message);
        setEstado('error');
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(rafRef.current);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      handsRef.current?.close();
    };
  }, []);

  // ── UI ───────────────────────────────────────────────────
  const confidenciaColor = (c) => {
    if (c >= 0.88) return '#4ade80';
    if (c >= 0.80) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <button style={S.backBtn} onClick={() => navigation.goBack()}>← Volver</button>
        <span style={S.title}>🖐️ Traducción LSM · Tiempo Real</span>
        <div style={{ width: 90 }} />
      </div>

      <div style={S.body}>
        {/* Cámara */}
        <div style={S.camWrap}>
          <video ref={videoRef} style={S.video} playsInline muted autoPlay />
          <canvas ref={canvasRef} width={640} height={480} style={S.canvas} />

          {/* Marco guía */}
          <div style={S.frame}>
            {['tl','tr','bl','br'].map(c => (
              <div key={c} style={{ ...S.corner, ...CP[c] }} />
            ))}
            <span style={S.guideLabel}>Coloca tu mano aquí</span>
          </div>

          {/* Overlay cargando */}
          {estado === 'cargando' && (
            <div style={S.overlay}>
              <div style={S.spinner} />
              <p style={{ color:'#f9a8d4', margin:'12px 0 4px', fontSize:15 }}>
                Cargando modelo de IA…
              </p>
              <p style={{ color:'rgba(249,168,212,0.6)', margin:0, fontSize:12 }}>
                Primera vez puede tardar ~15 segundos
              </p>
            </div>
          )}

          {/* Error */}
          {estado === 'error' && (
            <div style={S.overlay}>
              <p style={{ fontSize:32 }}>😕</p>
              <p style={{ color:'#fca5a5', textAlign:'center', padding:'0 20px' }}>
                {errorMsg || 'No se pudo acceder a la cámara'}
              </p>
            </div>
          )}

          {/* Badge listo */}
          {estado === 'listo' && (
            <div style={S.badge}>
              <div style={S.dot} />
              MediaPipe activo
            </div>
          )}
        </div>

        {/* Panel derecho */}
        <div style={S.panel}>

          {/* Resultado */}
          <div style={S.resultBox}>
            <p style={S.label}>SEÑA DETECTADA</p>

            {senaDetectada ? (
              <div style={{ textAlign:'center' }}>
                <div style={{
                  fontSize: 80, fontWeight: 800, color: '#fce7f3',
                  lineHeight: 1, margin: '0 0 10px',
                  textShadow: '0 0 40px rgba(219,39,119,0.6)'
                }}>
                  {senaDetectada.sena}
                </div>
                <p style={{ color:'#fce7f3', fontSize:20, fontWeight:700, margin:'0 0 6px' }}>
                  {senaDetectada.nombre}
                </p>
                <p style={{ color:'rgba(249,168,212,0.7)', fontSize:13, margin:'0 0 16px' }}>
                  {senaDetectada.desc}
                </p>
                {/* Barra de confianza */}
                <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:8, height:8, overflow:'hidden', margin:'0 0 6px' }}>
                  <div style={{
                    height:'100%', borderRadius:8,
                    width:`${Math.round(senaDetectada.conf*100)}%`,
                    background:`linear-gradient(90deg, ${confidenciaColor(senaDetectada.conf)}, ${confidenciaColor(senaDetectada.conf)}88)`,
                    transition:'width .4s ease'
                  }} />
                </div>
                <p style={{ color:'rgba(249,168,212,0.5)', fontSize:12, margin:0 }}>
                  Confianza: {Math.round(senaDetectada.conf * 100)}%
                </p>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'30px 0' }}>
                <p style={{ fontSize:48, margin:'0 0 12px' }}>🖐️</p>
                <p style={{ color:'rgba(249,168,212,0.55)', fontSize:14, margin:0 }}>
                  {estado === 'listo'
                    ? 'Muestra tu mano dentro del encuadre rosa'
                    : 'Esperando cámara…'}
                </p>
              </div>
            )}
          </div>

          {/* Historial */}
          <div style={S.histBox}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <p style={S.label}>HISTORIAL</p>
              {historial.length > 0 && (
                <button style={S.clearBtn} onClick={() => setHistorial([])}>
                  Limpiar
                </button>
              )}
            </div>
            {historial.length === 0
              ? <p style={{ color:'rgba(249,168,212,0.45)', fontSize:13, margin:0, textAlign:'center' }}>
                  Las señas detectadas aparecerán aquí
                </p>
              : <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {historial.map((s, i) => (
                    <span key={i} style={S.chip}>{s}</span>
                  ))}
                </div>
            }
          </div>

          {/* Señas disponibles */}
          <div style={S.senasBox}>
            <p style={S.label}>SEÑAS QUE DETECTA</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['A','B','D','E','F','I','K','L','M','N','O','R','S','T','U','V','W','X','Y',
                '1','2','3','4','5','7','8','9','OK','TE AMO'].map(s => (
                <span key={s} style={S.tagSena}>{s}</span>
              ))}
            </div>
          </div>

          {/* Instrucciones */}
          <div style={S.instrBox}>
            <p style={S.label}>INSTRUCCIONES</p>
            {['1. Espera que cargue el modelo (~15s)',
              '2. Coloca tu mano dentro del encuadre',
              '3. Mantén la seña quieta ~0.5 segundos',
              '4. Escucharás el nombre por voz',
              '5. Buena iluminación = mejor detección'
            ].map((t,i) => (
              <p key={i} style={{ color:'rgba(249,168,212,0.7)', fontSize:12, margin:'0 0 5px' }}>{t}</p>
            ))}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        button:hover { opacity:.8; cursor:pointer; }
      `}</style>
    </div>
  );
}

// Posición de esquinas
const CP = {
  tl: { top:0, left:0,  borderRight:'none', borderBottom:'none' },
  tr: { top:0, right:0, borderLeft:'none',  borderBottom:'none' },
  bl: { bottom:0, left:0,  borderRight:'none', borderTop:'none' },
  br: { bottom:0, right:0, borderLeft:'none',  borderTop:'none' },
};

const S = {
  root:     { minHeight:'100vh', background:'linear-gradient(160deg,#0f0225 0%,#1a0535 45%,#0d0020 100%)', display:'flex', flexDirection:'column', fontFamily:'system-ui,sans-serif' },
  header:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 24px', background:'rgba(13,0,32,0.75)', borderBottom:'1px solid rgba(219,39,119,0.2)' },
  backBtn:  { background:'none', border:'1px solid rgba(249,168,212,0.4)', color:'#f9a8d4', padding:'8px 18px', borderRadius:20, fontSize:14 },
  title:    { color:'#fce7f3', fontSize:17, fontWeight:600 },
  body:     { display:'flex', flex:1, gap:24, padding:24, flexWrap:'wrap', justifyContent:'center', alignItems:'flex-start' },
  camWrap:  { position:'relative', width:520, height:390, borderRadius:20, overflow:'hidden', background:'#000', border:'2px solid rgba(219,39,119,0.5)', flexShrink:0 },
  video:    { position:'absolute', width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)' },
  canvas:   { position:'absolute', top:0, left:0, width:'100%', height:'100%', transform:'scaleX(-1)' },
  frame:    { position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-58%)', width:220, height:220, display:'flex', alignItems:'center', justifyContent:'center' },
  corner:   { position:'absolute', width:30, height:30, border:'3px solid #db2777' },
  guideLabel: { position:'absolute', bottom:-26, color:'rgba(252,231,243,0.6)', fontSize:12, whiteSpace:'nowrap' },
  overlay:  { position:'absolute', inset:0, background:'rgba(13,0,32,0.9)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, zIndex:10 },
  spinner:  { width:48, height:48, border:'3px solid rgba(219,39,119,0.2)', borderTop:'3px solid #db2777', borderRadius:'50%', animation:'spin 1s linear infinite' },
  badge:    { position:'absolute', top:12, right:12, display:'flex', alignItems:'center', gap:6, background:'rgba(13,0,32,0.8)', border:'1px solid rgba(219,39,119,0.4)', borderRadius:20, padding:'5px 12px', color:'#f9a8d4', fontSize:12 },
  dot:      { width:8, height:8, borderRadius:'50%', background:'#4ade80', animation:'pulse 1.5s ease-in-out infinite' },
  panel:    { flex:1, minWidth:260, maxWidth:340, display:'flex', flexDirection:'column', gap:14 },
  resultBox:{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(219,39,119,0.35)', borderRadius:18, padding:'20px 22px', minHeight:220 },
  label:    { color:'#f9a8d4', fontSize:11, fontWeight:700, letterSpacing:1.2, margin:'0 0 12px 0' },
  histBox:  { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(147,51,234,0.3)', borderRadius:18, padding:'16px 20px' },
  chip:     { background:'rgba(219,39,119,0.2)', border:'1px solid rgba(219,39,119,0.3)', color:'#fce7f3', padding:'4px 12px', borderRadius:20, fontSize:12 },
  clearBtn: { background:'none', border:'1px solid rgba(249,168,212,0.3)', color:'#f9a8d4', padding:'3px 10px', borderRadius:12, fontSize:11 },
  senasBox: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'14px 18px' },
  tagSena:  { background:'rgba(147,51,234,0.2)', border:'1px solid rgba(147,51,234,0.35)', color:'#e9d5ff', padding:'3px 10px', borderRadius:12, fontSize:12 },
  instrBox: { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'14px 18px' },
};

// ─── Export ───────────────────────────────────────────────────
export default function TranslationScreen({ navigation }) {
  if (Platform.OS === 'web') return <TranslationWeb navigation={navigation} />;
  return (
    <LinearGradient colors={['#0f0225','#1a0535','#0d0020']} style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
      <Text style={{ color:'#fce7f3', fontSize:20, fontWeight:'700', textAlign:'center', marginBottom:10 }}>
        Disponible en versión web
      </Text>
      <Text style={{ color:'#f9a8d4', fontSize:14, textAlign:'center' }}>
        Abre localhost:8081 en tu navegador
      </Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop:28, padding:12, borderWidth:1, borderColor:'rgba(249,168,212,0.4)', borderRadius:24 }}>
        <Text style={{ color:'#f9a8d4' }}>← Volver</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}