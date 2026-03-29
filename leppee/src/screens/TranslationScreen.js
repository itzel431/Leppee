import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { detectarSena } from '../data/handposePatterns';
import { TODAS_LAS_SENAS } from '../data/senas';

// Componente web con MediaPipe
function TranslationWeb({ navigation }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [senaDetectada, setSenaDetectada] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);
  const ultimaSena = useRef(null);
  const contadorSena = useRef(0);

  const hablar = (texto) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-MX';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    let animFrame;
    const script1 = document.createElement('script');
    script1.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js';
    const script3 = document.createElement('script');
    script3.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';

    document.body.appendChild(script1);
    document.body.appendChild(script2);

    script3.onload = async () => {
      try {
        const hands = new window.Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7,
        });

        hands.onResults((results) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];

            // Dibuja puntos de la mano
            dibujarMano(ctx, landmarks, canvas.width, canvas.height);

            // Detecta seña
            const resultado = detectarSena(landmarks);
            if (resultado) {
              if (resultado.sena === ultimaSena.current) {
                contadorSena.current++;
                // Confirma después de 8 frames consecutivos (~0.5s)
                if (contadorSena.current === 8) {
                  setSenaDetectada(resultado);
                  // Busca nombre completo
                  const info = TODAS_LAS_SENAS.find(s => s.key === resultado.sena);
                  const nombre = info ? info.nombre : resultado.sena;
                  hablar(nombre);
                  setHistorial(h => [nombre, ...h.slice(0, 9)]);
                }
              } else {
                ultimaSena.current = resultado.sena;
                contadorSena.current = 1;
              }
            } else {
              ultimaSena.current = null;
              contadorSena.current = 0;
            }
          } else {
            setSenaDetectada(null);
          }
        });

        handsRef.current = hands;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCargando(false);
            procesarFrames();
          };
        }
      } catch (err) {
        setError('No se pudo acceder a la cámara: ' + err.message);
        setCargando(false);
      }
    };

    document.body.appendChild(script3);

    const procesarFrames = async () => {
      if (handsRef.current && videoRef.current && videoRef.current.readyState === 4) {
        await handsRef.current.send({ image: videoRef.current });
      }
      animFrame = requestAnimationFrame(procesarFrames);
    };

    return () => {
      cancelAnimationFrame(animFrame);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      [script1, script2, script3].forEach(s => {
        if (document.body.contains(s)) document.body.removeChild(s);
      });
    };
  }, []);

  const dibujarMano = (ctx, landmarks, w, h) => {
    // Conexiones de la mano
    const conexiones = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    conexiones.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
      ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
      ctx.stroke();
    });

    // Puntos
    landmarks.forEach((lm, i) => {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, i === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = i === 0 ? '#f9a8d4' : '#fce7f3';
      ctx.fill();
    });
  };

  const info = senaDetectada
    ? TODAS_LAS_SENAS.find(s => s.key === senaDetectada.sena)
    : null;

  return (
    <div style={webStyles.container}>
      {/* Header */}
      <div style={webStyles.header}>
        <button style={webStyles.backBtn} onClick={() => navigation.goBack()}>
          ← Volver
        </button>
        <span style={webStyles.headerTitle}>Traducción LSM en Tiempo Real</span>
        <div style={{ width: 80 }} />
      </div>

      <div style={webStyles.content}>
        {/* Cámara */}
        <div style={webStyles.cameraContainer}>
          {cargando && (
            <div style={webStyles.loading}>
              <div style={webStyles.spinner} />
              <p style={webStyles.loadingText}>Cargando MediaPipe...</p>
            </div>
          )}
          {error && (
            <div style={webStyles.errorBox}>
              <p style={{ color: '#fca5a5' }}>{error}</p>
            </div>
          )}
          <video
            ref={videoRef}
            style={{ ...webStyles.video, transform: 'scaleX(-1)' }}
            playsInline muted autoPlay
          />
          <canvas
            ref={canvasRef}
            width={640} height={480}
            style={{ ...webStyles.canvas, transform: 'scaleX(-1)' }}
          />

          {/* Marco guía */}
          <div style={webStyles.guideFrame}>
            <div style={{ ...webStyles.corner, top: 0, left: 0, borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ ...webStyles.corner, top: 0, right: 0, borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ ...webStyles.corner, bottom: 0, left: 0, borderRight: 'none', borderTop: 'none' }} />
            <div style={{ ...webStyles.corner, bottom: 0, right: 0, borderLeft: 'none', borderTop: 'none' }} />
            <p style={webStyles.guideText}>Coloca tu mano aquí</p>
          </div>
        </div>

        {/* Panel resultado */}
        <div style={webStyles.resultPanel}>
          {/* Seña actual */}
          <div style={webStyles.resultBox}>
            <p style={webStyles.resultLabel}>SEÑA DETECTADA</p>
            {senaDetectada ? (
              <>
                <p style={webStyles.resultSena}>{senaDetectada.sena}</p>
                <p style={webStyles.resultNombre}>{info?.nombre || ''}</p>
                <p style={webStyles.resultDesc}>{info?.descripcion || ''}</p>
                <div style={webStyles.confianzaBar}>
                  <div style={{
                    ...webStyles.confianzaFill,
                    width: `${(senaDetectada.confianza * 100).toFixed(0)}%`
                  }} />
                </div>
                <p style={webStyles.confianzaText}>
                  Confianza: {(senaDetectada.confianza * 100).toFixed(0)}%
                </p>
              </>
            ) : (
              <p style={webStyles.esperando}>
                👋 Muestra una seña a la cámara
              </p>
            )}
          </div>

          {/* Historial */}
          {historial.length > 0 && (
            <div style={webStyles.historialBox}>
              <p style={webStyles.resultLabel}>HISTORIAL</p>
              <div style={webStyles.historialChips}>
                {historial.map((s, i) => (
                  <span key={i} style={webStyles.chip}>{s}</span>
                ))}
              </div>
              <button
                style={webStyles.clearBtn}
                onClick={() => setHistorial([])}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.85; cursor: pointer; }
      `}</style>
    </div>
  );
}

const webStyles = {
  container: { minHeight: '100vh', background: 'linear-gradient(180deg, #0f0225 0%, #1a0535 50%, #0d0020 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(13,0,32,0.6)', borderBottom: '1px solid rgba(219,39,119,0.3)' },
  backBtn: { background: 'none', border: '1px solid rgba(249,168,212,0.4)', color: '#f9a8d4', padding: '8px 16px', borderRadius: 20, fontSize: 14, cursor: 'pointer' },
  headerTitle: { color: '#fce7f3', fontSize: 16, fontWeight: 600 },
  content: { display: 'flex', flex: 1, gap: 20, padding: 20, flexWrap: 'wrap', justifyContent: 'center' },
  cameraContainer: { position: 'relative', width: 480, height: 360, borderRadius: 16, overflow: 'hidden', background: '#000', border: '2px solid rgba(219,39,119,0.4)' },
  video: { position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' },
  canvas: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 },
  guideFrame: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#db2777', borderWidth: 3, borderStyle: 'solid' },
  guideText: { color: 'rgba(252,231,243,0.7)', fontSize: 12, position: 'absolute', bottom: -24, textAlign: 'center', width: 200 },
  loading: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,0,32,0.9)', zIndex: 10 },
  spinner: { width: 40, height: 40, border: '3px solid rgba(219,39,119,0.3)', borderTop: '3px solid #db2777', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  loadingText: { color: '#f9a8d4', marginTop: 12, fontSize: 14 },
  errorBox: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,0,32,0.9)', padding: 20, zIndex: 10 },
  resultPanel: { flex: 1, minWidth: 260, maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16 },
  resultBox: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(219,39,119,0.3)', borderRadius: 16, padding: 20 },
  resultLabel: { color: '#f9a8d4', fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 12, margin: '0 0 12px 0' },
  resultSena: { color: '#fce7f3', fontSize: 64, fontWeight: 700, textAlign: 'center', margin: '8px 0' },
  resultNombre: { color: '#f9a8d4', fontSize: 20, fontWeight: 600, textAlign: 'center', margin: '0 0 4px 0' },
  resultDesc: { color: 'rgba(249,168,212,0.7)', fontSize: 13, textAlign: 'center', margin: '0 0 16px 0' },
  confianzaBar: { background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 6, overflow: 'hidden' },
  confianzaFill: { height: '100%', background: 'linear-gradient(90deg, #db2777, #f43f8e)', borderRadius: 8, transition: 'width 0.3s' },
  confianzaText: { color: 'rgba(249,168,212,0.6)', fontSize: 12, textAlign: 'center', margin: '8px 0 0 0' },
  esperando: { color: 'rgba(249,168,212,0.6)', fontSize: 16, textAlign: 'center', padding: '24px 0', margin: 0 },
  historialBox: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(147,51,234,0.3)', borderRadius: 16, padding: 16 },
  historialChips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { background: 'rgba(219,39,119,0.25)', color: '#fce7f3', padding: '4px 12px', borderRadius: 20, fontSize: 13 },
  clearBtn: { background: 'none', border: '1px solid rgba(249,168,212,0.3)', color: '#f9a8d4', padding: '6px 16px', borderRadius: 12, fontSize: 12, cursor: 'pointer' },
};

// Wrapper para React Native vs Web
export default function TranslationScreen({ navigation }) {
  if (Platform.OS === 'web') {
    return <TranslationWeb navigation={navigation} />;
  }
  return (
    <LinearGradient colors={['#0f0225', '#1a0535', '#0d0020']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ color: '#fce7f3', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
        Traducción LSM
      </Text>
      <Text style={{ color: '#f9a8d4', fontSize: 15, textAlign: 'center' }}>
        Esta función está disponible en la versión web.{'\n'}Abre la app en tu navegador.
      </Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 32, padding: 12 }}>
        <Text style={{ color: '#f9a8d4' }}>← Volver</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}