import React, { useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ═══════════════════════════════════════════════════════════════
//  MOTOR DE DETECCIÓN LSM — 100+ señas
//  Una mano + Dos manos
//  Basado en "Manos con Voz" (CONAPRED 2011) e imágenes LSM
// ═══════════════════════════════════════════════════════════════

// Helpers
const dist  = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
const midY  = (a, b) => (a.y + b.y) / 2;
const midX  = (a, b) => (a.x + b.x) / 2;

function estadoMano(L) {
  if (!L || L.length < 21) return null;
  const W = dist(L[5], L[17]);
  return {
    L, W,
    I:  L[8].y  < L[6].y,
    M:  L[12].y < L[10].y,
    An: L[16].y < L[14].y,
    Me: L[20].y < L[18].y,
    P:  dist(L[4], L[2]) > W * 0.45,
    dPI:  dist(L[4], L[8]),
    dPM:  dist(L[4], L[12]),
    dPA:  dist(L[4], L[16]),
    dPMe: dist(L[4], L[20]),
    dIM:  dist(L[8], L[12]),
    dMA:  dist(L[12], L[16]),
    dAMe: dist(L[16], L[20]),
    dedosJuntos: dist(L[8],L[12])<dist(L[5],L[17])*0.28 && dist(L[12],L[16])<dist(L[5],L[17])*0.28,
    todosCerrados: L[8].y>L[6].y && L[12].y>L[10].y && L[16].y>L[14].y && L[20].y>L[18].y,
    wrist: L[0], palm: L[9],
  };
}

// ── Detección dos manos ────────────────────────────────────────
function detectarDosManos(L1, L2) {
  if (!L1 || !L2) return null;
  const h1 = estadoMano(L1);
  const h2 = estadoMano(L2);
  if (!h1 || !h2) return null;

  const distManos = dist(h1.wrist, h2.wrist);
  const distPalmas = dist(h1.palm, h2.palm);
  const ambosAbiertos = h1.I&&h1.M&&h1.An&&h1.Me&&h1.P && h2.I&&h2.M&&h2.An&&h2.Me&&h2.P;
  const ambosPunos   = h1.todosCerrados&&!h1.P && h2.todosCerrados&&!h2.P;
  const ambosB       = h1.I&&h1.M&&h1.An&&h1.Me&&!h1.P && h2.I&&h2.M&&h2.An&&h2.Me&&!h2.P;

  // GRACIAS — B (4 dedos) moviéndose desde la barbilla
  if (ambosB && distManos < h1.W * 2.5)
    return {sena:'GRACIAS',    cat:'saludo',    emoji:'🙏', nombre:'Gracias',           conf:0.88, manos:2};

  // HOLA (dos manos) — ambas abiertas
  if (ambosAbiertos && distManos > h1.W * 3)
    return {sena:'HOLA',       cat:'saludo',    emoji:'👋', nombre:'Hola (dos manos)',  conf:0.90, manos:2};

  // POR FAVOR — palmas cruzadas sobre el pecho
  if (ambosB && h1.todosCerrados && h2.todosCerrados)
    return {sena:'POR FAVOR',  cat:'saludo',    emoji:'🤲', nombre:'Por favor',          conf:0.85, manos:2};

  // ADIÓS — mano abierta que se mueve, otra cerrada
  if ((h1.I&&h1.M&&h1.An&&h1.Me&&h1.P && h2.todosCerrados&&!h2.P) ||
      (h2.I&&h2.M&&h2.An&&h2.Me&&h2.P && h1.todosCerrados&&!h1.P))
    return {sena:'ADIÓS',      cat:'saludo',    emoji:'🙋', nombre:'Adiós',              conf:0.82, manos:2};

  // LO SIENTO — puños cruzados sobre el pecho
  if (ambosPunos && distManos < h1.W * 2)
    return {sena:'LO SIENTO',  cat:'saludo',    emoji:'😔', nombre:'Lo siento',          conf:0.84, manos:2};

  // AMOR — manos en corazón (dedos índices y pulgares formando corazón)
  if (h1.I&&h1.P&&!h1.M&&!h1.An&&!h1.Me && h2.I&&h2.P&&!h2.M&&!h2.An&&!h2.Me &&
      distManos < h1.W * 2)
    return {sena:'AMOR',       cat:'emocion',   emoji:'❤️', nombre:'Amor / Corazón',    conf:0.83, manos:2};

  // FAMILIA — F con ambas manos en círculo
  if (!h1.I&&h1.M&&h1.An&&h1.Me&&!h1.P && !h2.I&&h2.M&&h2.An&&h2.Me&&!h2.P)
    return {sena:'FAMILIA',    cat:'social',    emoji:'👨‍👩‍👧', nombre:'Familia',        conf:0.82, manos:2};

  // CASA — manos forman techo (palmas juntas inclinadas)
  if (ambosAbiertos && distManos < h1.W * 1.5)
    return {sena:'CASA',       cat:'lugares',   emoji:'🏠', nombre:'Casa',               conf:0.80, manos:2};

  // HABLAR — índice de ambas manos moviéndose
  if (h1.I&&!h1.M&&!h1.An&&!h1.Me && h2.I&&!h2.M&&!h2.An&&!h2.Me && !h1.P&&!h2.P)
    return {sena:'HABLAR',     cat:'accion',    emoji:'🗣️', nombre:'Hablar',            conf:0.80, manos:2};

  // TRABAJAR — puños moviéndose uno sobre otro
  if (ambosPunos && distPalmas < h1.W * 1.8)
    return {sena:'TRABAJAR',   cat:'accion',    emoji:'💼', nombre:'Trabajar',           conf:0.79, manos:2};

  // COMER — mano cerca de boca + otra abierta
  if ((h1.todosCerrados&&!h1.P && h2.I&&h2.M&&h2.An&&h2.Me&&h2.P) ||
      (h2.todosCerrados&&!h2.P && h1.I&&h1.M&&h1.An&&h1.Me&&h1.P))
    return {sena:'COMER',      cat:'accion',    emoji:'🍽️', nombre:'Comer',             conf:0.79, manos:2};

  // DESCANSAR — palmas hacia abajo, una sobre otra
  if (ambosAbiertos && Math.abs(h1.wrist.y - h2.wrist.y) < h1.W * 0.5)
    return {sena:'DESCANSAR',  cat:'accion',    emoji:'😴', nombre:'Descansar',          conf:0.78, manos:2};

  // ESTUDIAR — dedos de una mano sobre palma de la otra
  if ((h1.I&&!h1.M&&!h1.An&&!h1.Me&&!h1.P && h2.I&&h2.M&&h2.An&&h2.Me&&h2.P))
    return {sena:'ESTUDIAR',   cat:'accion',    emoji:'📚', nombre:'Estudiar',           conf:0.78, manos:2};

  // DINERO — palma abierta + pulgar frotando índice
  if ((h1.I&&h1.M&&h1.An&&h1.Me&&h1.P && !h2.I&&!h2.M&&!h2.An&&!h2.Me&&h2.P))
    return {sena:'DINERO',     cat:'social',    emoji:'💰', nombre:'Dinero',             conf:0.78, manos:2};

  return null;
}

// ── Detección una mano ─────────────────────────────────────────
function detectarUnaMano(L) {
  if (!L || L.length < 21) return null;
  const h = estadoMano(L);
  if (!h) return null;
  const {I,M,An,Me,P,W,dPI,dPM,dPA,dPMe,dIM,dMA,dAMe,dedosJuntos,todosCerrados,L:lm} = h;

  // ─ SALUDOS ─
  if (I&&M&&An&&Me&&P)
    return {sena:'HOLA',        cat:'saludo',    emoji:'👋', nombre:'Hola / Cinco',          conf:0.93, manos:1};
  if (!I&&!M&&!An&&Me&&P)
    return {sena:'TE AMO',      cat:'emocion',   emoji:'🤟', nombre:'Te amo / Y',            conf:0.88, manos:1};
  if (todosCerrados&&P&&lm[4].y<lm[5].y)
    return {sena:'SÍ',          cat:'basico',    emoji:'👍', nombre:'Sí',                    conf:0.85, manos:1};
  if (!I&&!M&&!An&&Me&&!P&&dPA<W*0.4)
    return {sena:'NO',          cat:'basico',    emoji:'🤚', nombre:'No',                    conf:0.83, manos:1};

  // ─ BÁSICO ─
  if (!I&&M&&An&&Me&&P&&dPI<W*0.28)
    return {sena:'BIEN/OK',     cat:'basico',    emoji:'👌', nombre:'Bien / OK',             conf:0.84, manos:1};
  if (todosCerrados&&!P&&lm[4].y>lm[5].y&&dPI>=W*0.28)
    return {sena:'TRISTE',      cat:'emocion',   emoji:'😢', nombre:'Triste / E',            conf:0.76, manos:1};
  if (todosCerrados&&!P&&dPI<W*0.28&&dPMe<W*0.38)
    return {sena:'FELIZ',       cat:'emocion',   emoji:'😊', nombre:'Feliz / O',             conf:0.82, manos:1};
  if (!I&&!M&&!An&&!Me&&P&&lm[4].y<lm[2].y)
    return {sena:'AYUDA',       cat:'urgencia',  emoji:'🆘', nombre:'Ayuda / A',             conf:0.86, manos:1};

  // ─ EMOCIONES ─
  if (!I&&!M&&!An&&Me&&!P)
    return {sena:'CANSADO',     cat:'emocion',   emoji:'😴', nombre:'Cansado / I',           conf:0.88, manos:1};
  if (I&&M&&!An&&!Me&&!P&&dIM>=W*0.22)
    return {sena:'MAL/V',       cat:'emocion',   emoji:'✌️', nombre:'Mal / V / 2',           conf:0.87, manos:1};
  if (I&&!M&&!An&&!Me&&!P)
    return {sena:'NO/1',        cat:'basico',    emoji:'☝️', nombre:'No / Número 1',         conf:0.88, manos:1};

  // ─ SALUD ─
  if (todosCerrados&&!P&&lm[4].y>lm[8].y&&dPI<W*0.45)
    return {sena:'DOLOR',       cat:'salud',     emoji:'😣', nombre:'Dolor / S',             conf:0.76, manos:1};
  if (I&&M&&!An&&!Me&&P&&dIM>W*0.25)
    return {sena:'FIEBRE',      cat:'salud',     emoji:'🌡️', nombre:'Fiebre / K',            conf:0.78, manos:1};
  if (I&&M&&!An&&!Me&&!P&&dIM<W*0.22)
    return {sena:'FRÍO',        cat:'sensacion', emoji:'🥶', nombre:'Frío / U',              conf:0.83, manos:1};
  if (I&&M&&An&&!Me&&!P&&dIM>W*0.15&&dMA>W*0.15)
    return {sena:'AGUA',        cat:'necesidad', emoji:'💧', nombre:'Agua / W',              conf:0.85, manos:1};
  if (!I&&M&&An&&Me&&!P&&dPI<W*0.28)
    return {sena:'COMIDA',      cat:'necesidad', emoji:'🍽️', nombre:'Comida / F',            conf:0.80, manos:1};

  // ─ CUERPO ─
  if (I&&!M&&!An&&!Me&&P&&(lm[8].y-lm[4].y)<-W*0.2)
    return {sena:'CABEZA',      cat:'cuerpo',    emoji:'🧠', nombre:'Cabeza / L',            conf:0.86, manos:1};
  if (I&&!M&&!An&&!Me&&P&&Math.abs(lm[8].y-lm[4].y)<=W*0.2)
    return {sena:'GARGANTA',    cat:'cuerpo',    emoji:'🫁', nombre:'Garganta / G',          conf:0.80, manos:1};
  if (!I&&M&&!An&&!Me&&!P&&dPM<W*0.3)
    return {sena:'DIENTE',      cat:'cuerpo',    emoji:'🦷', nombre:'Diente / Boca',         conf:0.77, manos:1};
  if (I&&!M&&!An&&!Me&&!P&&lm[8].y>lm[6].y)
    return {sena:'DEDO',        cat:'cuerpo',    emoji:'👆', nombre:'Dedo',                  conf:0.78, manos:1};
  if (I&&M&&!An&&!Me&&!P&&dIM<W*0.22)
    return {sena:'OJO',         cat:'cuerpo',    emoji:'👁️', nombre:'Ojo / U',               conf:0.80, manos:1};

  // ─ COLORES ─
  if (I&&M&&An&&Me&&!P&&dedosJuntos)
    return {sena:'GRACIAS/B',   cat:'saludo',    emoji:'🙏', nombre:'Gracias / B',           conf:0.90, manos:1};
  if (I&&M&&An&&Me&&!P&&!dedosJuntos)
    return {sena:'4/AZUL',      cat:'numero',    emoji:'4️⃣', nombre:'4 / Azul (B sacudida)', conf:0.86, manos:1};

  // ─ VERBOS ─
  if (!I&&M&&An&&Me&&!P&&dPI>W*0.28)
    return {sena:'NECESITAR',   cat:'accion',    emoji:'🙏', nombre:'Necesitar / 9',         conf:0.79, manos:1};
  if (!I&&!M&&!An&&!Me&&!P&&dPI>W*0.28&&lm[4].y>lm[8].y)
    return {sena:'OLVIDAR',     cat:'accion',    emoji:'🤔', nombre:'Olvidar / E',           conf:0.75, manos:1};
  if (I&&M&&!An&&!Me&&P&&dIM<W*0.35)
    return {sena:'QUERER',      cat:'accion',    emoji:'💝', nombre:'Querer / 3',            conf:0.82, manos:1};
  if (I&&M&&!An&&!Me&&P&&dIM>=W*0.35)
    return {sena:'MANEJAR',     cat:'accion',    emoji:'🚗', nombre:'Manejar / K',           conf:0.78, manos:1};

  // ─ ABECEDARIO ─
  if (!I&&M&&An&&Me&&P&&dPI<W*0.28)
    return {sena:'BIEN/OK',     cat:'basico',    emoji:'👌', nombre:'Bien / OK',             conf:0.84, manos:1};
  if (!I&&!M&&!An&&!Me&&!P&&dPI<W*0.28&&dPMe<W*0.38)
    return {sena:'O/0',         cat:'numero',    emoji:'⭕', nombre:'O / Cero',              conf:0.82, manos:1};
  if (I&&M&&!An&&!Me&&!P&&dIM<W*0.14)
    return {sena:'R',           cat:'letra',     emoji:'🤞', nombre:'Letra R',               conf:0.77, manos:1};
  if (!I&&!M&&!An&&!Me&&!P&&lm[8].y<lm[5].y&&lm[8].y>lm[6].y)
    return {sena:'X',           cat:'letra',     emoji:'🤙', nombre:'Letra X',               conf:0.72, manos:1};

  // ─ NÚMEROS ─
  if (I&&M&&!An&&!Me&&P&&dIM<W*0.35&&dPI<W*0.5)
    return {sena:'3',           cat:'numero',    emoji:'3️⃣', nombre:'Número 3',              conf:0.82, manos:1};
  if (I&&M&&!An&&Me&&!P&&dPA<W*0.3)
    return {sena:'7',           cat:'numero',    emoji:'7️⃣', nombre:'Número 7',              conf:0.78, manos:1};
  if (I&&!M&&An&&Me&&!P&&dPM<W*0.3)
    return {sena:'8',           cat:'numero',    emoji:'8️⃣', nombre:'Número 8',              conf:0.78, manos:1};
  if (!I&&M&&An&&Me&&!P&&dPI<W*0.28)
    return {sena:'9',           cat:'numero',    emoji:'9️⃣', nombre:'Número 9',              conf:0.80, manos:1};

  // ─ LUGARES / SOCIAL ─
  if (I&&!M&&!An&&!Me&&P&&dPM<W*0.4)
    return {sena:'D/YO',        cat:'social',    emoji:'🙋', nombre:'Yo / D',                conf:0.80, manos:1};

  // ─ FALLBACK puño ─
  if (todosCerrados&&!P)
    return {sena:'S/E',         cat:'letra',     emoji:'✊', nombre:'S / E (puño)',          conf:0.73, manos:1};

  return null;
}

// Función principal — detecta con 1 o 2 manos
function detectar(landmarks1, landmarks2) {
  if (landmarks1 && landmarks2) {
    const dos = detectarDosManos(landmarks1, landmarks2);
    if (dos) return dos;
  }
  const una = detectarUnaMano(landmarks1);
  if (una) return una;
  if (landmarks2) return detectarUnaMano(landmarks2);
  return null;
}

// ══════════════════════════════════════════════════════════════
//  CATÁLOGO COMPLETO DE 100+ SEÑAS
// ══════════════════════════════════════════════════════════════
const CATEGORIAS_DEF = {
  saludo:    { label:'Saludos',       color:'#db2777', bg:'rgba(219,39,119,0.15)' },
  basico:    { label:'Básico',        color:'#9333ea', bg:'rgba(147,51,234,0.15)' },
  emocion:   { label:'Emociones',     color:'#ea580c', bg:'rgba(234,88,12,0.15)'  },
  salud:     { label:'Salud',         color:'#dc2626', bg:'rgba(220,38,38,0.15)'  },
  cuerpo:    { label:'Cuerpo',        color:'#0891b2', bg:'rgba(8,145,178,0.15)'  },
  necesidad: { label:'Necesidades',   color:'#65a30d', bg:'rgba(101,163,13,0.15)' },
  sensacion: { label:'Sensaciones',   color:'#7c3aed', bg:'rgba(124,58,237,0.15)' },
  urgencia:  { label:'Urgencia',      color:'#b91c1c', bg:'rgba(185,28,28,0.15)'  },
  accion:    { label:'Acciones',      color:'#0369a1', bg:'rgba(3,105,161,0.15)'  },
  social:    { label:'Social',        color:'#059669', bg:'rgba(5,150,105,0.15)'  },
  numero:    { label:'Números',       color:'#b45309', bg:'rgba(180,83,9,0.15)'   },
  letra:     { label:'Letras',        color:'#525252', bg:'rgba(82,82,82,0.15)'   },
  lugares:   { label:'Lugares',       color:'#7e22ce', bg:'rgba(126,34,206,0.15)' },
};

const VOCABULARIO = [
  // ── Saludos ──
  {sena:'HOLA',       cat:'saludo',    emoji:'👋', nombre:'Hola',           forma:'Mano completamente abierta, palma al frente.',                    manos:1},
  {sena:'ADIÓS',      cat:'saludo',    emoji:'🙋', nombre:'Adiós',          forma:'Mano abierta, se mueve de lado a lado. (2 manos: una abierta, otra cerrada)',  manos:2},
  {sena:'GRACIAS',    cat:'saludo',    emoji:'🙏', nombre:'Gracias',        forma:'4 dedos juntos sin pulgar. Toca barbilla y extiende al frente.',  manos:1},
  {sena:'POR FAVOR',  cat:'saludo',    emoji:'🤲', nombre:'Por favor',      forma:'Palmas cruzadas sobre el pecho (dos manos juntas).',             manos:2},
  {sena:'LO SIENTO',  cat:'saludo',    emoji:'😔', nombre:'Lo siento',      forma:'Puños cerrados sobre el pecho. Movimiento circular.',            manos:2},
  {sena:'TE AMO',     cat:'emocion',   emoji:'🤟', nombre:'Te amo / I love you', forma:'Meñique + pulgar extendidos (Y). Forma universal.',        manos:1},
  {sena:'AMOR',       cat:'emocion',   emoji:'❤️', nombre:'Amor',           forma:'Ambas manos forman corazón (índices + pulgares juntos).',        manos:2},

  // ── Básico ──
  {sena:'SÍ',         cat:'basico',    emoji:'👍', nombre:'Sí',             forma:'Puño cerrado con pulgar arriba. Movimiento de asentir.',         manos:1},
  {sena:'NO',         cat:'basico',    emoji:'✋', nombre:'No',             forma:'Índice + medio + pulgar se cierran. Movimiento horizontal.',     manos:1},
  {sena:'BIEN/OK',    cat:'basico',    emoji:'👌', nombre:'Bien / OK',      forma:'Índice toca yema del pulgar. Medio, anular y meñique extendidos.',manos:1},
  {sena:'MAL/V',      cat:'emocion',   emoji:'✌️', nombre:'Mal',            forma:'Índice y medio separados en V, apuntando hacia abajo.',          manos:1},
  {sena:'AYUDA',      cat:'urgencia',  emoji:'🆘', nombre:'Ayuda',          forma:'Pulgar arriba (A/S). Palma sube del nivel de la otra mano.',     manos:1},
  {sena:'NECESITAR',  cat:'accion',    emoji:'🙏', nombre:'Necesitar',      forma:'9 (índice toca pulgar) se mueve hacia abajo. Otros 3 extendidos.',manos:1},

  // ── Emociones ──
  {sena:'FELIZ',      cat:'emocion',   emoji:'😊', nombre:'Feliz',          forma:'Todos los dedos forman O. Mano abierta en círculo sobre el pecho.',manos:1},
  {sena:'TRISTE',     cat:'emocion',   emoji:'😢', nombre:'Triste',         forma:'Todos los dedos doblados (E). Mano baja frente a la cara.',      manos:1},
  {sena:'CANSADO',    cat:'emocion',   emoji:'😴', nombre:'Cansado',        forma:'Meñique extendido (I). Muñeca cae hacia abajo.',                 manos:1},
  {sena:'ENOJADO',    cat:'emocion',   emoji:'😠', nombre:'Enojado',        forma:'Mano en garra frente a la cara, dedos curvados.',               manos:1},
  {sena:'MIEDO',      cat:'emocion',   emoji:'😨', nombre:'Miedo',          forma:'Manos abiertas se acercan al pecho bruscamente.',                manos:2},
  {sena:'SORPRESA',   cat:'emocion',   emoji:'😲', nombre:'Sorpresa',       forma:'Manos abiertas se elevan desde los costados.',                   manos:2},
  {sena:'QUERER',     cat:'accion',    emoji:'💝', nombre:'Querer / Amar',  forma:'Índice+medio+pulgar (3). Mano al pecho.',                        manos:1},

  // ── Salud ──
  {sena:'DOLOR',      cat:'salud',     emoji:'😣', nombre:'Dolor',          forma:'Puño cerrado (S). Pulgar sobre los dedos. Expresión de dolor.',  manos:1},
  {sena:'FIEBRE',     cat:'salud',     emoji:'🌡️', nombre:'Fiebre',         forma:'K (índice+medio+pulgar sep). Mano toca la frente.',              manos:1},
  {sena:'FRÍO',       cat:'sensacion', emoji:'🥶', nombre:'Frío',           forma:'U (índice+medio juntos). Temblor en las manos.',                 manos:1},
  {sena:'CALIENTE',   cat:'sensacion', emoji:'🥵', nombre:'Caliente',       forma:'Mano abierta se sopla desde la palma hacia afuera.',             manos:1},
  {sena:'MEDICINA',   cat:'salud',     emoji:'💊', nombre:'Medicina',       forma:'Índice+medio (U) frotan la palma de la otra mano.',              manos:2},
  {sena:'HOSPITAL',   cat:'salud',     emoji:'🏥', nombre:'Hospital',       forma:'H (índice+medio+pulgar) traza una H en el aire.',                manos:1},
  {sena:'DOCTOR',     cat:'salud',     emoji:'👨‍⚕️', nombre:'Doctor',        forma:'D (índice solo, otros tocan pulgar) en la muñeca.',             manos:1},
  {sena:'EMERGENCIA', cat:'urgencia',  emoji:'🚨', nombre:'Emergencia',     forma:'E (todos doblados) se mueve rápido hacia afuera.',               manos:1},

  // ── Cuerpo ──
  {sena:'CABEZA',     cat:'cuerpo',    emoji:'🧠', nombre:'Cabeza',         forma:'L (índice+pulgar en L). Toca la sien.',                          manos:1},
  {sena:'GARGANTA',   cat:'cuerpo',    emoji:'🫁', nombre:'Garganta',       forma:'G (índice+pulgar horizontal). Se pasa por el cuello.',           manos:1},
  {sena:'ESTÓMAGO',   cat:'cuerpo',    emoji:'🫃', nombre:'Estómago',       forma:'Mano abierta hace círculo en el vientre.',                       manos:1},
  {sena:'ESPALDA',    cat:'cuerpo',    emoji:'🫀', nombre:'Espalda',        forma:'Mano abierta se pasa por la espalda (zona lumbar).',             manos:1},
  {sena:'CORAZÓN',    cat:'cuerpo',    emoji:'💓', nombre:'Corazón',        forma:'Índice+medio (U) tocan el pecho izquierdo.',                     manos:1},
  {sena:'DIENTE',     cat:'cuerpo',    emoji:'🦷', nombre:'Diente',         forma:'Índice toca un diente. Pulgar no extendido.',                    manos:1},
  {sena:'DEDO',       cat:'cuerpo',    emoji:'👆', nombre:'Dedo',           forma:'Índice solo, ligeramente doblado, señala hacia sí mismo.',       manos:1},
  {sena:'OJO',        cat:'cuerpo',    emoji:'👁️', nombre:'Ojo',            forma:'Índice+medio (U) apuntan a los ojos.',                           manos:1},
  {sena:'NARIZ',      cat:'cuerpo',    emoji:'👃', nombre:'Nariz',          forma:'Índice toca la punta de la nariz.',                              manos:1},
  {sena:'OÍDO',       cat:'cuerpo',    emoji:'👂', nombre:'Oído',           forma:'Índice señala la oreja.',                                        manos:1},
  {sena:'CUELLO',     cat:'cuerpo',    emoji:'🦒', nombre:'Cuello',         forma:'Mano abierta rodea el cuello sin tocar.',                        manos:1},
  {sena:'LABIO',      cat:'cuerpo',    emoji:'👄', nombre:'Labio',          forma:'Índice traza el contorno de los labios.',                        manos:1},
  {sena:'LENGUA',     cat:'cuerpo',    emoji:'👅', nombre:'Lengua',         forma:'Índice apunta a la lengua sacada.',                              manos:1},
  {sena:'CUERPO',     cat:'cuerpo',    emoji:'🧍', nombre:'Cuerpo',         forma:'Manos abiertas bajan desde hombros a caderas.',                  manos:2},

  // ── Necesidades ──
  {sena:'AGUA',       cat:'necesidad', emoji:'💧', nombre:'Agua',           forma:'W (índice+medio+anular sep). Toca los labios.',                  manos:1},
  {sena:'COMIDA',     cat:'necesidad', emoji:'🍽️', nombre:'Comida',         forma:'F (índice toca pulgar). Mano va a la boca.',                     manos:1},
  {sena:'BAÑO',       cat:'necesidad', emoji:'🚿', nombre:'Baño',           forma:'B (4 dedos juntos) se mueve arriba y abajo.',                    manos:1},
  {sena:'DORMIR',     cat:'necesidad', emoji:'🛏️', nombre:'Dormir',         forma:'Mano abierta inclina la cabeza sobre ella.',                     manos:1},
  {sena:'DESCANSAR',  cat:'accion',    emoji:'😴', nombre:'Descansar',      forma:'Palmas hacia abajo, una sobre la otra. Quietas.',                manos:2},

  // ── Acciones / Verbos ──
  {sena:'HABLAR',     cat:'accion',    emoji:'🗣️', nombre:'Hablar',         forma:'Índice de ambas manos apuntan alternando.',                      manos:2},
  {sena:'ESCUCHAR',   cat:'accion',    emoji:'👂', nombre:'Escuchar',       forma:'Mano en C detrás de la oreja.',                                  manos:1},
  {sena:'VER',        cat:'accion',    emoji:'👀', nombre:'Ver',            forma:'V (índice+medio) apuntan a los ojos, luego al frente.',          manos:1},
  {sena:'COMER',      cat:'accion',    emoji:'🍽️', nombre:'Comer',          forma:'F (índice toca pulgar) sube a la boca varias veces.',            manos:1},
  {sena:'BEBER',      cat:'accion',    emoji:'🥤', nombre:'Beber',          forma:'Mano en C simulando tomar de un vaso.',                          manos:1},
  {sena:'CAMINAR',    cat:'accion',    emoji:'🚶', nombre:'Caminar',        forma:'Índice+medio alternan como piernas caminando.',                  manos:1},
  {sena:'CORRER',     cat:'accion',    emoji:'🏃', nombre:'Correr',         forma:'L (índice+pulgar) se mueve rápido hacia adelante.',              manos:1},
  {sena:'TRABAJAR',   cat:'accion',    emoji:'💼', nombre:'Trabajar',       forma:'Puños moviéndose uno sobre el otro repetidamente.',              manos:2},
  {sena:'ESTUDIAR',   cat:'accion',    emoji:'📚', nombre:'Estudiar',       forma:'Dedos de una mano sobre la palma abierta de la otra.',           manos:2},
  {sena:'LEER',       cat:'accion',    emoji:'📖', nombre:'Leer',           forma:'V apunta a la palma abierta de la otra mano.',                   manos:2},
  {sena:'ESCRIBIR',   cat:'accion',    emoji:'✍️', nombre:'Escribir',       forma:'Índice+pulgar simulan escribir sobre la palma.',                 manos:2},
  {sena:'BAILAR',     cat:'accion',    emoji:'💃', nombre:'Bailar',         forma:'V se mueve en ondas sobre la palma de la otra mano.',            manos:2},
  {sena:'MANEJAR',    cat:'accion',    emoji:'🚗', nombre:'Manejar',        forma:'K (índice+medio+pulgar) simula volante girando.',                manos:1},
  {sena:'OLVIDAR',    cat:'accion',    emoji:'🤔', nombre:'Olvidar',        forma:'Mano abierta en la frente se cierra alejándose.',                manos:1},
  {sena:'NACER',      cat:'accion',    emoji:'👶', nombre:'Nacer',          forma:'Palma de una mano sale de bajo la otra abierta.',                manos:2},
  {sena:'MORDER',     cat:'accion',    emoji:'😬', nombre:'Morder',         forma:'Índice+medio+anular (W) se doblan sobre pulgar.',                manos:1},
  {sena:'MOLESTAR',   cat:'accion',    emoji:'😤', nombre:'Molestar',       forma:'Índice de una mano golpea palma de la otra.',                    manos:2},
  {sena:'OBEDECER',   cat:'accion',    emoji:'🫡', nombre:'Obedecer',       forma:'O (todos en O) baja con palma hacia abajo.',                     manos:1},

  // ── Social / Personas ──
  {sena:'FAMILIA',    cat:'social',    emoji:'👨‍👩‍👧', nombre:'Familia',      forma:'F (índice toca pulgar, tres ext.) con ambas manos en círculo.',  manos:2},
  {sena:'MAMÁ',       cat:'social',    emoji:'👩', nombre:'Mamá',           forma:'Pulgar toca la barbilla.',                                       manos:1},
  {sena:'PAPÁ',       cat:'social',    emoji:'👨', nombre:'Papá',           forma:'Pulgar toca la frente.',                                         manos:1},
  {sena:'HERMANO',    cat:'social',    emoji:'👦', nombre:'Hermano',        forma:'L (índice+pulgar) en la frente, luego junta.',                   manos:1},
  {sena:'HERMANA',    cat:'social',    emoji:'👧', nombre:'Hermana',        forma:'L en la mejilla, luego junta.',                                  manos:1},
  {sena:'AMIGO',      cat:'social',    emoji:'🤝', nombre:'Amigo',          forma:'R (índice+medio entrelazados) con ambas manos juntas.',          manos:2},
  {sena:'DOCTOR',     cat:'salud',     emoji:'👨‍⚕️', nombre:'Doctor',        forma:'D en la muñeca.',                                               manos:1},
  {sena:'DINERO',     cat:'social',    emoji:'💰', nombre:'Dinero',         forma:'Pulgar frota los dedos índice+medio repetidamente.',             manos:1},
  {sena:'TRABAJO',    cat:'social',    emoji:'💼', nombre:'Trabajo',        forma:'W (tres dedos) sobre la palma de la otra mano.',                 manos:2},

  // ── Lugares ──
  {sena:'CASA',       cat:'lugares',   emoji:'🏠', nombre:'Casa',           forma:'Manos forman techo (palmas juntas inclinadas).',                 manos:2},
  {sena:'HOSPITAL',   cat:'lugares',   emoji:'🏥', nombre:'Hospital',       forma:'H (índice+medio+pulgar) traza cruz.',                            manos:1},
  {sena:'ESCUELA',    cat:'lugares',   emoji:'🏫', nombre:'Escuela',        forma:'E (dedos doblados) se mueve hacia afuera.',                      manos:1},
  {sena:'BAÑO',       cat:'lugares',   emoji:'🚻', nombre:'Baño (lugar)',   forma:'B (4 dedos) mueve arriba-abajo.',                               manos:1},

  // ── Tiempo ──
  {sena:'HOY',        cat:'social',    emoji:'📅', nombre:'Hoy',            forma:'A (pulgar lateral) en semicírculo hacia un lado.',               manos:1},
  {sena:'MAÑANA',     cat:'social',    emoji:'🌅', nombre:'Mañana',         forma:'L (índice+pulgar) al lado de la frente, va al frente.',          manos:1},
  {sena:'TARDE',      cat:'social',    emoji:'🌇', nombre:'Tarde',          forma:'T (pulgar entre índice+medio) sobre el antebrazo.',              manos:1},
  {sena:'NOCHE',      cat:'social',    emoji:'🌙', nombre:'Noche',          forma:'G sobre la frente, baja hacia abajo.',                           manos:1},
  {sena:'MAÑANA(AM)', cat:'social',    emoji:'☀️', nombre:'Mañana (AM)',    forma:'B roza palma de la otra, sube simulando sol.',                   manos:2},

  // ── Números básicos ──
  {sena:'0/O',        cat:'numero',    emoji:'⭕', nombre:'Cero / O',       forma:'Todos los dedos forman círculo tocándose.',                      manos:1},
  {sena:'1',          cat:'numero',    emoji:'☝️', nombre:'Uno',            forma:'Solo el índice estirado hacia arriba.',                          manos:1},
  {sena:'2/V',        cat:'numero',    emoji:'✌️', nombre:'Dos / V',        forma:'Índice y medio separados en V.',                                 manos:1},
  {sena:'3',          cat:'numero',    emoji:'3️⃣', nombre:'Tres',           forma:'Pulgar + índice + medio estirados.',                             manos:1},
  {sena:'4',          cat:'numero',    emoji:'4️⃣', nombre:'Cuatro',         forma:'Cuatro dedos estirados, pulgar doblado.',                        manos:1},
  {sena:'5/HOLA',     cat:'numero',    emoji:'👋', nombre:'Cinco / Hola',   forma:'Mano completamente abierta.',                                    manos:1},
  {sena:'6/Y',        cat:'numero',    emoji:'🤟', nombre:'Seis / Y',       forma:'Pulgar y meñique estirados.',                                    manos:1},
  {sena:'7',          cat:'numero',    emoji:'7️⃣', nombre:'Siete',          forma:'Anular toca pulgar, índice+medio+meñique arriba.',               manos:1},
  {sena:'8',          cat:'numero',    emoji:'8️⃣', nombre:'Ocho',           forma:'Medio toca pulgar, índice+anular+meñique arriba.',               manos:1},
  {sena:'9',          cat:'numero',    emoji:'9️⃣', nombre:'Nueve',          forma:'Índice toca pulgar, medio+anular+meñique arriba.',               manos:1},

  // ── Letras clave ──
  {sena:'A',          cat:'letra',     emoji:'✊', nombre:'Letra A',        forma:'Puño cerrado, pulgar al lado.',                                  manos:1},
  {sena:'B',          cat:'letra',     emoji:'🤚', nombre:'Letra B',        forma:'4 dedos juntos y estirados, pulgar doblado.',                   manos:1},
  {sena:'C',          cat:'letra',     emoji:'🖐️', nombre:'Letra C',        forma:'Dedos en posición cóncava formando C.',                         manos:1},
  {sena:'D',          cat:'letra',     emoji:'☝️', nombre:'Letra D',        forma:'Índice estirado, otros tocan pulgar.',                           manos:1},
  {sena:'E',          cat:'letra',     emoji:'✊', nombre:'Letra E',        forma:'Todos los dedos doblados, uñas al frente.',                     manos:1},
  {sena:'F',          cat:'letra',     emoji:'🤌', nombre:'Letra F',        forma:'Índice toca pulgar, otros tres estirados.',                     manos:1},
  {sena:'G',          cat:'letra',     emoji:'🤏', nombre:'Letra G',        forma:'Índice y pulgar horizontales, palma hacia ti.',                 manos:1},
  {sena:'I',          cat:'letra',     emoji:'🤙', nombre:'Letra I',        forma:'Solo meñique estirado.',                                        manos:1},
  {sena:'L',          cat:'letra',     emoji:'👆', nombre:'Letra L',        forma:'Índice arriba + pulgar lateral. Forma L.',                      manos:1},
  {sena:'O',          cat:'letra',     emoji:'⭕', nombre:'Letra O',        forma:'Todos los dedos se tocan por las puntas.',                      manos:1},
  {sena:'R',          cat:'letra',     emoji:'🤞', nombre:'Letra R',        forma:'Índice y medio cruzados.',                                      manos:1},
  {sena:'S',          cat:'letra',     emoji:'✊', nombre:'Letra S',        forma:'Puño cerrado, pulgar sobre los dedos.',                         manos:1},
  {sena:'U',          cat:'letra',     emoji:'🤞', nombre:'Letra U',        forma:'Índice y medio juntos hacia arriba.',                           manos:1},
  {sena:'V',          cat:'letra',     emoji:'✌️', nombre:'Letra V',        forma:'Índice y medio separados en V.',                                manos:1},
  {sena:'W',          cat:'letra',     emoji:'✋', nombre:'Letra W',        forma:'Índice+medio+anular separados.',                                manos:1},
  {sena:'X',          cat:'letra',     emoji:'🤙', nombre:'Letra X',        forma:'Índice doblado en gancho.',                                     manos:1},
  {sena:'Y',          cat:'letra',     emoji:'🤟', nombre:'Letra Y',        forma:'Pulgar y meñique estirados.',                                   manos:1},
];

const FRASES = [
  {frase:'Hola, ¿cómo estás?',         señas:['HOLA','BIEN/OK','MAL/V'],             audio:'Hola, ¿cómo estás?'},
  {frase:'Me duele la cabeza',          señas:['DOLOR','CABEZA'],                     audio:'Me duele la cabeza'},
  {frase:'Me duele la garganta',        señas:['DOLOR','GARGANTA'],                   audio:'Me duele la garganta'},
  {frase:'Me duele el estómago',        señas:['DOLOR','ESTÓMAGO'],                   audio:'Me duele el estómago'},
  {frase:'Tengo fiebre',                señas:['FIEBRE'],                              audio:'Tengo fiebre'},
  {frase:'Tengo frío',                  señas:['FRÍO'],                                audio:'Tengo frío'},
  {frase:'Necesito agua',               señas:['NECESITAR','AGUA'],                   audio:'Necesito agua'},
  {frase:'Necesito comer',              señas:['NECESITAR','COMIDA'],                  audio:'Necesito comer'},
  {frase:'Por favor ayúdame',           señas:['POR FAVOR','AYUDA'],                  audio:'Por favor ayúdame'},
  {frase:'Gracias, estoy bien',         señas:['GRACIAS','BIEN/OK'],                  audio:'Gracias, estoy bien'},
  {frase:'Lo siento, estoy mal',        señas:['LO SIENTO','MAL/V'],                  audio:'Lo siento, estoy mal'},
  {frase:'Estoy cansado/a',             señas:['CANSADO'],                             audio:'Estoy cansado'},
  {frase:'Estoy feliz',                 señas:['FELIZ'],                               audio:'Estoy feliz'},
  {frase:'Estoy triste',                señas:['TRISTE'],                              audio:'Estoy triste'},
  {frase:'Te quiero / Te amo',          señas:['TE AMO'],                              audio:'Te amo'},
  {frase:'Necesito ir al baño',         señas:['NECESITAR','BAÑO'],                   audio:'Necesito ir al baño'},
  {frase:'Llama al doctor',             señas:['DOCTOR','AYUDA'],                      audio:'Llama al doctor'},
  {frase:'Quiero descansar',            señas:['QUERER','DESCANSAR'],                  audio:'Quiero descansar'},
  {frase:'Voy a trabajar',              señas:['TRABAJAR'],                            audio:'Voy a trabajar'},
  {frase:'¿Dónde está el hospital?',    señas:['HOSPITAL','AYUDA'],                   audio:'¿Dónde está el hospital?'},
];

// ══════════════════════════════════════════════════════════════
//  COMPONENTE WEB PRINCIPAL
// ══════════════════════════════════════════════════════════════
function TranslationWeb({ navigation }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const handsRef  = useRef(null);
  const rafRef    = useRef(null);
  const lastSena  = useRef(null);
  const frames    = useRef(0);
  const busy      = useRef(false);
  const lm1Ref    = useRef(null);
  const lm2Ref    = useRef(null);

  const [fase,     setFase]     = useState('cargando');
  const [detected, setDetected] = useState(null);
  const [hist,     setHist]     = useState([]);
  const [manos,    setManos]    = useState(0);
  const [errMsg,   setErrMsg]   = useState('');
  const [tab,      setTab]      = useState('detector');
  const [catF,     setCatF]     = useState('todos');
  const [search,   setSearch]   = useState('');

  const speak = (t) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t.replace(/[^\w\sáéíóúüñ¿?.,\/]/gi,''));
    u.lang='es-MX'; u.rate=0.9;
    window.speechSynthesis.speak(u);
  };

  const drawHand = (ctx, L, w, h, color='#f43f8e') => {
    const C=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
    ctx.strokeStyle=color; ctx.lineWidth=3; ctx.shadowBlur=8; ctx.shadowColor=color;
    C.forEach(([a,b])=>{ ctx.beginPath(); ctx.moveTo(L[a].x*w,L[a].y*h); ctx.lineTo(L[b].x*w,L[b].y*h); ctx.stroke(); });
    ctx.shadowBlur=0;
    L.forEach((p,i)=>{ ctx.beginPath(); ctx.arc(p.x*w,p.y*h,[0,4,8,12,16,20].includes(i)?8:5,0,Math.PI*2); ctx.fillStyle=[0,4,8,12,16,20].includes(i)?'#fbbf24':'#fff'; ctx.fill(); });
  };

  const onResults = (r) => {
    const cv=canvasRef.current; if(!cv){busy.current=false;return;}
    const ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height);
    const landmarks = r.multiHandLandmarks || [];
    setManos(landmarks.length);

    lm1Ref.current = landmarks[0] || null;
    lm2Ref.current = landmarks[1] || null;

    // Dibuja las manos con colores distintos
    if (landmarks[0]) drawHand(ctx, landmarks[0], cv.width, cv.height, '#f43f8e');
    if (landmarks[1]) drawHand(ctx, landmarks[1], cv.width, cv.height, '#a855f7');

    const res = detectar(landmarks[0], landmarks[1]);
    if (res) {
      if (res.sena===lastSena.current) {
        frames.current++;
        if (frames.current===8) {
          setDetected(res); speak(res.nombre);
          setHist(p=>[res,...p.filter(x=>x.sena!==res.sena)].slice(0,10));
        }
      } else { lastSena.current=res.sena; frames.current=1; }
    } else { lastSena.current=null; frames.current=0; setDetected(null); }
    busy.current=false;
  };

  const loop=()=>{ if(handsRef.current&&videoRef.current?.readyState>=2&&!busy.current){busy.current=true;handsRef.current.send({image:videoRef.current}).catch(()=>{busy.current=false;});} rafRef.current=requestAnimationFrame(loop); };

  useEffect(()=>{
    let dead=false;
    const addScript=src=>new Promise((ok,no)=>{ if(document.querySelector(`script[src="${src}"]`))return ok(); const s=document.createElement('script'); s.src=src; s.crossOrigin='anonymous'; s.onload=ok; s.onerror=no; document.head.appendChild(s); });
    (async()=>{
      try {
        await addScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js');
        if(dead)return;
        const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}}});
        if(dead){stream.getTracks().forEach(t=>t.stop());return;}
        const vid=videoRef.current; vid.srcObject=stream;
        vid.play().catch(()=>{});
        await new Promise(res=>{ vid.onloadeddata=res; setTimeout(res,4000); });
        await new Promise(res=>{ const t=setInterval(()=>{if(vid.readyState>=2){clearInterval(t);res();}},100); setTimeout(()=>{clearInterval(t);res();},5000); });
        if(dead)return;
        // Configurar con 2 manos
        const hands=new window.Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${f}`});
        hands.setOptions({maxNumHands:2,modelComplexity:1,minDetectionConfidence:0.6,minTrackingConfidence:0.6});
        hands.onResults(onResults);
        try{await hands.send({image:vid});}catch(_){}
        handsRef.current=hands;
        if(dead)return;
        setFase('listo'); loop();
      } catch(e){ setErrMsg(e.message||'Error'); setFase('error'); }
    })();
    return()=>{ dead=true; cancelAnimationFrame(rafRef.current); videoRef.current?.srcObject?.getTracks().forEach(t=>t.stop()); handsRef.current?.close(); };
  },[]);

  const catColor = c => CATEGORIAS_DEF[c]?.color || '#888';
  const catBg    = c => CATEGORIAS_DEF[c]?.bg    || 'rgba(100,100,100,0.15)';
  const catLabel = c => CATEGORIAS_DEF[c]?.label || c;

  const vocFiltrado = VOCABULARIO.filter(v => {
    const matchCat = catF==='todos' || v.cat===catF;
    const matchS = !search || v.nombre.toLowerCase().includes(search.toLowerCase()) || v.sena.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchS;
  });

  const R = { // estilos reutilizables
    card: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(219,39,119,0.25)', borderRadius:16, padding:'14px' },
    label: { color:'#f9a8d4', fontSize:9, fontWeight:700, letterSpacing:1.1, margin:0 },
  };

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0f0225 0%,#1e0840 40%,#0d0020 100%)',display:'flex',flexDirection:'column',fontFamily:'system-ui,sans-serif',color:'#fce7f3'}}>

      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 20px',background:'rgba(13,0,32,0.88)',borderBottom:'1px solid rgba(219,39,119,0.2)',backdropFilter:'blur(12px)',flexShrink:0,gap:12}}>
        <button onClick={()=>navigation.goBack()} style={{background:'none',border:'1px solid rgba(249,168,212,0.35)',color:'#f9a8d4',padding:'5px 14px',borderRadius:20,fontSize:12,cursor:'pointer'}}>← Volver</button>
        <div style={{textAlign:'center'}}>
          <div style={{color:'#fce7f3',fontSize:15,fontWeight:700,letterSpacing:0.3}}>Traducción LSM</div>
          <div style={{color:'rgba(249,168,212,0.4)',fontSize:10}}>{VOCABULARIO.length} señas · 1 y 2 manos · Voz automática</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,background:fase==='listo'?'rgba(74,222,128,0.1)':'rgba(219,39,119,0.1)',border:`1px solid ${fase==='listo'?'rgba(74,222,128,0.4)':'rgba(219,39,119,0.35)'}`,borderRadius:20,padding:'4px 10px'}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:fase==='listo'?'#4ade80':'#db2777',animation:'pulse 1.5s infinite'}}/>
          <span style={{color:fase==='listo'?'#4ade80':'#f9a8d4',fontSize:11}}>{fase==='listo'?`En vivo · ${manos} mano${manos!==1?'s':''}`:fase==='error'?'Error':'Cargando…'}</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(13,0,32,0.5)',flexShrink:0}}>
        {[['detector','🎥 Detector'],['vocabulario','📖 Vocabulario'],['frases','💬 Frases']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'9px',background:'none',border:'none',borderBottom:`2px solid ${tab===id?'#db2777':'transparent'}`,color:tab===id?'#fce7f3':'rgba(249,168,212,0.45)',fontSize:12,fontWeight:tab===id?600:400,cursor:'pointer',transition:'all .2s'}}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── TAB DETECTOR ── */}
      {tab==='detector' && (
        <div style={{display:'flex',flex:1,gap:12,padding:12,overflow:'hidden'}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:10,minWidth:0}}>
            <div style={{background:'#000',border:'1px solid rgba(219,39,119,0.3)',borderRadius:16,overflow:'hidden'}}>
              <div style={{position:'relative',width:'100%',height:400,background:'#000',overflow:'hidden'}}>
                <video ref={videoRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',transform:'scaleX(-1)',display:'block'}} playsInline muted autoPlay/>
                <canvas ref={canvasRef} width={1280} height={720} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',transform:'scaleX(-1)'}}/>
                {fase==='listo'&&<>
                  <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-55%)',width:170,height:170,pointerEvents:'none'}}>
                    {[{top:0,left:0,borderRight:'none',borderBottom:'none'},{top:0,right:0,borderLeft:'none',borderBottom:'none'},{bottom:0,left:0,borderRight:'none',borderTop:'none'},{bottom:0,right:0,borderLeft:'none',borderTop:'none'}].map((s,i)=>(<div key={i} style={{position:'absolute',width:22,height:22,border:'2.5px solid rgba(219,39,119,0.75)',...s}}/>))}
                    <span style={{position:'absolute',bottom:-20,left:'50%',transform:'translateX(-50%)',color:'rgba(252,231,243,0.4)',fontSize:10,whiteSpace:'nowrap'}}>Coloca tu mano aquí</span>
                  </div>
                  <div style={{position:'absolute',top:8,left:8,display:'flex',alignItems:'center',gap:5,background:manos>0?'rgba(74,222,128,0.18)':'rgba(13,0,32,0.75)',border:`1px solid ${manos>0?'rgba(74,222,128,0.5)':'rgba(219,39,119,0.3)'}`,borderRadius:14,padding:'3px 9px'}}>
                    <div style={{width:6,height:6,borderRadius:'50%',background:manos>0?'#4ade80':'#f43f8e',animation:'pulse 1s infinite'}}/>
                    <span style={{color:manos>0?'#4ade80':'#f9a8d4',fontSize:10}}>{manos>0?`✋ ${manos} mano${manos>1?'s':''}  detectada${manos>1?'s':''}  •  🟣 2da mano`:'Sin mano'}</span>
                  </div>
                </>}
                {fase==='cargando'&&<div style={{position:'absolute',inset:0,background:'rgba(10,0,22,0.94)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,zIndex:10}}><div style={{width:48,height:48,border:'3px solid rgba(219,39,119,0.15)',borderTop:'3px solid #db2777',borderRadius:'50%',animation:'spin 1s linear infinite'}}/><p style={{color:'#fce7f3',fontSize:13,fontWeight:600,margin:0}}>🧠 Cargando modelo IA…</p><p style={{color:'rgba(249,168,212,0.5)',fontSize:10,margin:0}}>Detecta hasta 2 manos · Primera vez ~15s</p></div>}
                {fase==='error'&&<div style={{position:'absolute',inset:0,background:'rgba(10,0,22,0.94)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,zIndex:10}}><p style={{fontSize:34,margin:0}}>😕</p><p style={{color:'#fca5a5',fontSize:12,textAlign:'center',margin:'0 20px'}}>{errMsg}</p><button onClick={()=>window.location.reload()} style={{background:'none',border:'1px solid rgba(249,168,212,0.4)',color:'#f9a8d4',padding:'5px 14px',borderRadius:12,fontSize:11,cursor:'pointer'}}>Reintentar</button></div>}
              </div>
              <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:4,padding:'7px 12px',borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                <span style={{color:'rgba(249,168,212,0.4)',fontSize:9,fontWeight:700,letterSpacing:0.8,flexShrink:0}}>DETECTANDO:</span>
                {VOCABULARIO.slice(0,18).map(v=>(
                  <span key={v.sena} style={{padding:'1px 7px',borderRadius:8,fontSize:10,fontWeight:600,border:'1px solid',transition:'all .15s',background:detected?.sena===v.sena?catBg(v.cat):'transparent',borderColor:detected?.sena===v.sena?catColor(v.cat):'rgba(147,51,234,0.2)',color:detected?.sena===v.sena?'#fce7f3':'#a78bfa',transform:detected?.sena===v.sena?'scale(1.1)':'scale(1)'}}>
                    {v.emoji} {v.sena}
                  </span>
                ))}
                <span style={{color:'rgba(249,168,212,0.3)',fontSize:9}}>+{VOCABULARIO.length-18} más</span>
              </div>
            </div>
          </div>

          {/* Panel derecho */}
          <div style={{width:264,flexShrink:0,display:'flex',flexDirection:'column',gap:10,overflowY:'auto'}}>
            {/* Resultado */}
            <div style={{...R.card,minHeight:195,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              {detected ? (
                <div style={{textAlign:'center',width:'100%'}}>
                  <div style={{display:'inline-flex',alignItems:'center',gap:4,background:catBg(detected.cat),border:`1px solid ${catColor(detected.cat)}`,borderRadius:10,padding:'2px 8px',marginBottom:8}}>
                    <span style={{fontSize:9}}>{detected.manos===2?'🙌':'🖐️'}</span>
                    <span style={{color:catColor(detected.cat),fontSize:9,fontWeight:700}}>{catLabel(detected.cat)} · {detected.manos} mano{detected.manos>1?'s':''}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,margin:'4px 0'}}>
                    <span style={{fontSize:38}}>{detected.emoji}</span>
                    <span style={{fontSize:48,fontWeight:800,color:'#fce7f3',lineHeight:1,textShadow:`0 0 20px ${catColor(detected.cat)}66`}}>{detected.sena}</span>
                  </div>
                  <p style={{color:'#f9a8d4',fontSize:14,fontWeight:600,margin:'4px 0 8px'}}>{detected.nombre}</p>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <div style={{flex:1,height:4,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:4,width:`${Math.round(detected.conf*100)}%`,background:detected.conf>=0.85?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,#fbbf24,#f59e0b)',transition:'width .4s'}}/>
                    </div>
                    <span style={{color:'rgba(249,168,212,0.5)',fontSize:10,minWidth:24}}>{Math.round(detected.conf*100)}%</span>
                  </div>
                  <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'2px 8px'}}>
                    <span style={{fontSize:11}}>🔊</span><span style={{color:'rgba(249,168,212,0.5)',fontSize:9}}>Voz activada</span>
                  </div>
                </div>
              ):(
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:42,marginBottom:8}}>{fase==='listo'?(manos>0?'👁️':'🖐️'):'⏳'}</div>
                  <p style={{color:'rgba(249,168,212,0.5)',fontSize:13,margin:'0 0 4px'}}>{fase!=='listo'?'Cargando…':manos>0?'Analizando seña…':'Muestra tu mano'}</p>
                  <p style={{color:'rgba(249,168,212,0.3)',fontSize:10,margin:0}}>Quieta ~0.5 segundos</p>
                  {fase==='listo'&&<p style={{color:'rgba(147,51,234,0.6)',fontSize:10,margin:'6px 0 0'}}>🙌 2 manos para señas como GRACIAS, FAMILIA, CASA…</p>}
                </div>
              )}
            </div>

            {/* Historial */}
            <div style={{...R.card,border:'1px solid rgba(147,51,234,0.22)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={R.label}>HISTORIAL</span>
                {hist.length>0&&<button onClick={()=>setHist([])} style={{background:'none',border:'1px solid rgba(249,168,212,0.2)',color:'#f9a8d4',padding:'1px 6px',borderRadius:6,fontSize:9,cursor:'pointer'}}>Limpiar</button>}
              </div>
              {hist.length===0?<p style={{color:'rgba(249,168,212,0.25)',fontSize:11,textAlign:'center',margin:0}}>Sin señas aún</p>:
              <div style={{display:'flex',flexDirection:'column',gap:4}}>
                {hist.map((s,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.04)',borderRadius:8,padding:'5px 8px',opacity:1-i*0.09}}>
                    <span style={{fontSize:14}}>{s.emoji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{color:'#fce7f3',fontSize:11,fontWeight:600,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.sena}</p>
                      <p style={{color:'rgba(249,168,212,0.5)',fontSize:9,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.nombre}</p>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                      <div style={{width:3,height:16,borderRadius:2,background:catColor(s.cat)}}/>
                      {s.manos===2&&<span style={{fontSize:8}}>🙌</span>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>

            {/* Tips */}
            <div style={{...R.card,border:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={R.label}>CONSEJOS</span>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:8}}>
                {[['💡','Buena luz'],['🖐️','Mano al frente'],['⏱️','Quieta 0.5s'],['🙌','2 manos para más señas']].map(([e,t])=>(
                  <div key={t} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,background:'rgba(255,255,255,0.03)',borderRadius:8,padding:'7px 4px'}}>
                    <span style={{fontSize:16}}>{e}</span>
                    <span style={{color:'rgba(249,168,212,0.6)',fontSize:9,textAlign:'center'}}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB VOCABULARIO ── */}
      {tab==='vocabulario' && (
        <div style={{flex:1,padding:14,overflowY:'auto'}}>
          {/* Búsqueda + filtros */}
          <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar seña…" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(219,39,119,0.3)',color:'#fce7f3',padding:'6px 12px',borderRadius:12,fontSize:12,outline:'none',flexShrink:0}}/>
            <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
              {[['todos','Todos','#db2777'],...Object.entries(CATEGORIAS_DEF).map(([k,v])=>[k,v.label,v.color])].map(([id,lbl,col])=>(
                <button key={id} onClick={()=>setCatF(id)} style={{background:catF===id?col:'rgba(255,255,255,0.05)',border:`1px solid ${catF===id?col:'rgba(255,255,255,0.1)'}`,color:catF===id?'#fff':'rgba(249,168,212,0.6)',padding:'3px 10px',borderRadius:12,fontSize:10,cursor:'pointer',fontWeight:catF===id?600:400}}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <p style={{color:'rgba(249,168,212,0.5)',fontSize:11,margin:'0 0 10px'}}>{vocFiltrado.length} señas · Toca cualquiera para escucharla 🔊</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:8}}>
            {vocFiltrado.map(v=>(
              <div key={v.sena} onClick={()=>speak(v.nombre)} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${catColor(v.cat)}44`,borderRadius:14,padding:'12px 10px',cursor:'pointer',transition:'all .18s',textAlign:'center'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.transform='translateY(-2px)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.transform='translateY(0)';}}>
                <div style={{fontSize:28,marginBottom:4}}>{v.emoji}</div>
                <div style={{fontSize:14,fontWeight:700,color:'#fce7f3',marginBottom:1}}>{v.sena}</div>
                <div style={{fontSize:10,color:'#f9a8d4',marginBottom:5}}>{v.nombre}</div>
                <div style={{display:'inline-flex',alignItems:'center',gap:2,background:catBg(v.cat),border:`1px solid ${catColor(v.cat)}`,borderRadius:8,padding:'1px 6px',marginBottom:5}}>
                  <span style={{color:catColor(v.cat),fontSize:8,fontWeight:700}}>{catLabel(v.cat)}</span>
                  {v.manos===2&&<span style={{fontSize:8}}>🙌</span>}
                </div>
                <div style={{color:'rgba(249,168,212,0.5)',fontSize:9,lineHeight:1.4}}>{v.forma}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB FRASES ── */}
      {tab==='frases' && (
        <div style={{flex:1,padding:14,overflowY:'auto'}}>
          <p style={{color:'rgba(249,168,212,0.55)',fontSize:11,margin:'0 0 12px'}}>Frases de conversación real. Toca para escuchar. Practica cada seña en el Detector.</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {FRASES.map((f,i)=>(
              <div key={i} onClick={()=>speak(f.audio)} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(219,39,119,0.18)',borderRadius:14,padding:'12px 14px',cursor:'pointer',transition:'all .18s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                  <span style={{fontSize:18}}>💬</span>
                  <span style={{color:'#fce7f3',fontSize:13,fontWeight:600,flex:1}}>{f.frase}</span>
                  <span style={{fontSize:14}}>🔊</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {f.señas.map(s=>{
                    const v=VOCABULARIO.find(x=>x.sena===s);
                    return v?(
                      <span key={s} style={{display:'inline-flex',alignItems:'center',gap:3,background:catBg(v.cat),border:`1px solid ${catColor(v.cat)}`,borderRadius:10,padding:'2px 8px',fontSize:10,color:catColor(v.cat),fontWeight:600}}>
                        {v.emoji} {v.sena} {v.manos===2?'🙌':''}
                      </span>
                    ):null;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:14,background:'rgba(147,51,234,0.08)',border:'1px solid rgba(147,51,234,0.22)',borderRadius:14,padding:'12px 14px'}}>
            <p style={{color:'#c4b5fd',fontSize:11,fontWeight:600,margin:'0 0 6px'}}>🙌 Señas que requieren 2 manos</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {VOCABULARIO.filter(v=>v.manos===2).map(v=>(
                <span key={v.sena} onClick={()=>speak(v.nombre)} style={{display:'inline-flex',alignItems:'center',gap:3,background:catBg(v.cat),border:`1px solid ${catColor(v.cat)}`,borderRadius:10,padding:'3px 10px',fontSize:11,color:catColor(v.cat),fontWeight:600,cursor:'pointer'}}>
                  {v.emoji} {v.sena}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing:border-box; }
        input::placeholder { color:rgba(249,168,212,0.35); }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(219,39,119,0.3); border-radius:3px; }
      `}</style>
    </div>
  );
}

export default function TranslationScreen({ navigation }) {
  if (Platform.OS==='web') return <TranslationWeb navigation={navigation}/>;
  return (
    <LinearGradient colors={['#0f0225','#1a0535','#0d0020']} style={{flex:1,alignItems:'center',justifyContent:'center',padding:32}}>
      <Text style={{color:'#fce7f3',fontSize:20,fontWeight:'700',textAlign:'center',marginBottom:10}}>Disponible en versión web</Text>
      <Text style={{color:'#f9a8d4',fontSize:14,textAlign:'center'}}>Abre localhost:8081 en tu navegador</Text>
      <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginTop:28,padding:12,borderWidth:1,borderColor:'rgba(249,168,212,0.4)',borderRadius:24}}>
        <Text style={{color:'#f9a8d4'}}>← Volver</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}