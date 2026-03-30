// ─────────────────────────────────────────────────────────────
//  handposePatterns.js
//  Patrones LSM basados en "Manos con Voz — Diccionario de
//  Lengua de Señas Mexicana" (Libre Acceso A.C. / CONAPRED 2011)
//
//  MediaPipe Hands — 21 landmarks:
//  0=muñeca  1-4=pulgar  5-8=índice  9-12=medio
//  13-16=anular  17-20=meñique
// ─────────────────────────────────────────────────────────────

export const LANDMARKS = {
  MUNECA: 0,
  PULGAR_CMC: 1, PULGAR_MCP: 2, PULGAR_IP: 3,  PULGAR_TIP: 4,
  INDICE_MCP:  5, INDICE_PIP:  6, INDICE_DIP:  7,  INDICE_TIP:  8,
  MEDIO_MCP:   9, MEDIO_PIP:  10, MEDIO_DIP:  11,  MEDIO_TIP:  12,
  ANULAR_MCP: 13, ANULAR_PIP: 14, ANULAR_DIP: 15,  ANULAR_TIP: 16,
  MENIQUE_MCP:17, MENIQUE_PIP:18, MENIQUE_DIP:19,  MENIQUE_TIP:20,
};

// ── Helpers ──────────────────────────────────────────────────

/** Distancia euclidiana 2D entre dos landmarks */
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** ¿El dedo está extendido? (punta más arriba que nudillo medio) */
function extendido(L, tip, pip, mcp) {
  return L[tip].y < L[pip].y && L[pip].y < L[mcp].y;
}

/** Estado de los 5 dedos */
function dedos(L) {
  const anchoMano = dist(L[5], L[17]);
  return {
    // Pulgar: se mueve horizontalmente — comparar x vs base
    pulgar:  dist(L[4], L[2]) > anchoMano * 0.45,
    indice:  extendido(L, 8,  6,  5),
    medio:   extendido(L, 12, 10, 9),
    anular:  extendido(L, 16, 14, 13),
    menique: extendido(L, 20, 18, 17),
  };
}

// ── Función principal ────────────────────────────────────────

/**
 * Detecta la seña LSM en los 21 landmarks de MediaPipe.
 * Retorna { sena, nombre, descripcion, categoria, confianza }
 * o null si no hay coincidencia clara.
 */
export function detectarSena(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const L = landmarks;
  const d = dedos(L);

  const anchoMano = dist(L[5], L[17]);

  // Tips
  const tP  = L[4];   // pulgar
  const tI  = L[8];   // índice
  const tM  = L[12];  // medio
  const tA  = L[16];  // anular
  const tMe = L[20];  // meñique

  // Distancias clave
  const dPI  = dist(tP, tI);
  const dPM  = dist(tP, tM);
  const dPA  = dist(tP, tA);
  const dPMe = dist(tP, tMe);
  const dIM  = dist(tI, tM);
  const dMA  = dist(tM, tA);
  const dAMe = dist(tA, tMe);

  const um = anchoMano; // alias corto

  // ══════════════════════════════════════════════════════════
  //  ABECEDARIO  (descripción exacta del diccionario)
  // ══════════════════════════════════════════════════════════

  // A — mano cerrada, uñas al frente, pulgar estirado al lado
  if (!d.indice && !d.medio && !d.anular && !d.menique && d.pulgar)
    return { sena:'A', nombre:'Letra A', descripcion:'Mano cerrada, pulgar al lado', categoria:'abecedario', confianza:0.88 };

  // B — índice, medio, anular y meñique estirados juntos; pulgar doblado
  if (d.indice && d.medio && d.anular && d.menique && !d.pulgar && dIM < um*0.3)
    return { sena:'B', nombre:'Letra B', descripcion:'Cuatro dedos estirados juntos, pulgar doblado', categoria:'abecedario', confianza:0.90 };

  // C — dedos en posición cóncava, palma de lado
  if (!d.indice && !d.medio && !d.anular && !d.menique &&
      dPI < um*0.65 && dPI > um*0.3 && dPMe < um*0.75)
    return { sena:'C', nombre:'Letra C', descripcion:'Mano en forma de C', categoria:'abecedario', confianza:0.76 };

  // D — medio, anular, meñique y pulgar se tocan; índice estirado
  if (d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      dPM < um*0.4)
    return { sena:'D', nombre:'Letra D', descripcion:'Índice estirado, otros dedos y pulgar se tocan', categoria:'abecedario', confianza:0.82 };

  // E — todos los dedos completamente doblados, uñas al frente
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      dPI < um*0.45 && tI.y > L[5].y)
    return { sena:'E', nombre:'Letra E', descripcion:'Todos los dedos doblados, uñas al frente', categoria:'abecedario', confianza:0.76 };

  // F — mano abierta, índice dobla hasta tocar yema del pulgar
  if (!d.indice && d.medio && d.anular && d.menique && !d.pulgar &&
      dPI < um*0.28)
    return { sena:'F', nombre:'Letra F', descripcion:'Índice toca yema del pulgar, otros estirados', categoria:'abecedario', confianza:0.80 };

  // G — mano cerrada, índice y pulgar estirados, palma hacia uno
  if (d.indice && !d.medio && !d.anular && !d.menique && d.pulgar &&
      Math.abs(tI.y - tP.y) < um*0.4)
    return { sena:'G', nombre:'Letra G', descripcion:'Índice y pulgar estirados horizontalmente', categoria:'abecedario', confianza:0.80 };

  // H — mano cerrada, índice y medio estirados juntos, pulgar arriba
  if (d.indice && d.medio && !d.anular && !d.menique && d.pulgar &&
      dIM < um*0.22)
    return { sena:'H', nombre:'Letra H', descripcion:'Índice y medio juntos, pulgar arriba', categoria:'abecedario', confianza:0.80 };

  // I — mano cerrada, meñique estirado hacia arriba
  if (!d.indice && !d.medio && !d.anular && d.menique && !d.pulgar)
    return { sena:'I', nombre:'Letra I', descripcion:'Solo meñique estirado hacia arriba', categoria:'abecedario', confianza:0.88 };

  // J — igual que I pero con movimiento (se simplifica a I en estático)
  // K — índice, medio y pulgar estirados; yema del pulgar entre índice y medio
  if (d.indice && d.medio && !d.anular && !d.menique && d.pulgar &&
      dIM > um*0.22 && dPI < um*0.45)
    return { sena:'K', nombre:'Letra K', descripcion:'Índice, medio y pulgar estirados', categoria:'abecedario', confianza:0.78 };

  // L — índice y pulgar estirados formando L
  if (d.indice && !d.medio && !d.anular && !d.menique && d.pulgar &&
      Math.abs(tI.y - tP.y) > um*0.35)
    return { sena:'L', nombre:'Letra L', descripcion:'Índice arriba y pulgar lateral — forma L', categoria:'abecedario', confianza:0.86 };

  // M — mano cerrada, índice+medio+anular sobre el pulgar
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      tI.y > L[5].y && tM.y > L[9].y && tA.y > L[13].y && dPA < um*0.45)
    return { sena:'M', nombre:'Letra M', descripcion:'Tres dedos sobre el pulgar', categoria:'abecedario', confianza:0.75 };

  // N — mano cerrada, índice+medio sobre el pulgar
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      dPI < um*0.38 && dPM < um*0.38 && dPA > um*0.42)
    return { sena:'N', nombre:'Letra N', descripcion:'Índice y medio sobre el pulgar', categoria:'abecedario', confianza:0.74 };

  // O — todos los dedos se tocan por las puntas formando O
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      dPI < um*0.28 && dPMe < um*0.38)
    return { sena:'O', nombre:'Letra O', descripcion:'Todos los dedos forman O', categoria:'abecedario', confianza:0.82 };

  // R — índice y medio estirados y entrelazados
  if (d.indice && d.medio && !d.anular && !d.menique && !d.pulgar &&
      dIM < um*0.18)
    return { sena:'R', nombre:'Letra R', descripcion:'Índice y medio entrelazados', categoria:'abecedario', confianza:0.77 };

  // S — mano cerrada, pulgar sobre los otros dedos
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      tP.y < L[5].y)
    return { sena:'S', nombre:'Letra S', descripcion:'Puño cerrado, pulgar sobre los dedos', categoria:'abecedario', confianza:0.76 };

  // T — mano cerrada, pulgar entre índice y medio
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      tP.x > L[5].x && tP.x < L[9].x)
    return { sena:'T', nombre:'Letra T', descripcion:'Pulgar entre índice y medio', categoria:'abecedario', confianza:0.74 };

  // U — índice y medio estirados y unidos
  if (d.indice && d.medio && !d.anular && !d.menique && !d.pulgar &&
      dIM < um*0.22)
    return { sena:'U', nombre:'Letra U', descripcion:'Índice y medio juntos hacia arriba', categoria:'abecedario', confianza:0.83 };

  // V — índice y medio estirados y separados
  if (d.indice && d.medio && !d.anular && !d.menique && !d.pulgar &&
      dIM >= um*0.22)
    return { sena:'V', nombre:'Letra V', descripcion:'Índice y medio separados en V', categoria:'abecedario', confianza:0.87 };

  // W — índice, medio y anular estirados separados
  if (d.indice && d.medio && d.anular && !d.menique && !d.pulgar &&
      dIM > um*0.18 && dMA > um*0.18)
    return { sena:'W', nombre:'Letra W', descripcion:'Índice, medio y anular separados', categoria:'abecedario', confianza:0.85 };

  // X — índice y pulgar en garra, movimiento al frente (estático: gancho)
  if (!d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar &&
      tI.y < L[6].y && tI.y > L[5].y)
    return { sena:'X', nombre:'Letra X', descripcion:'Índice doblado en gancho', categoria:'abecedario', confianza:0.72 };

  // Y — meñique y pulgar estirados
  if (!d.indice && !d.medio && !d.anular && d.menique && d.pulgar)
    return { sena:'Y', nombre:'Letra Y', descripcion:'Pulgar y meñique estirados', categoria:'abecedario', confianza:0.88 };

  // Z — índice estirado (movimiento en Z en el aire — estático: índice)
  // Se diferencia de D porque el pulgar no toca otros dedos

  // ══════════════════════════════════════════════════════════
  //  NÚMEROS
  // ══════════════════════════════════════════════════════════

  // 1 — solo índice estirado (sin pulgar)
  if (d.indice && !d.medio && !d.anular && !d.menique && !d.pulgar)
    return { sena:'1', nombre:'Número 1', descripcion:'Solo índice estirado', categoria:'numeros', confianza:0.90 };

  // 2 — índice y medio en V (igual que V — contexto diferencia)
  // Ya cubierto como V arriba. Se mapea igual.

  // 3 — pulgar + índice + medio estirados
  if (d.indice && d.medio && !d.anular && !d.menique && d.pulgar &&
      dIM < um*0.35)
    return { sena:'3', nombre:'Número 3', descripcion:'Pulgar, índice y medio estirados', categoria:'numeros', confianza:0.82 };

  // 4 — cuatro dedos estirados sin pulgar (separados)
  if (d.indice && d.medio && d.anular && d.menique && !d.pulgar &&
      dIM > um*0.15)
    return { sena:'4', nombre:'Número 4', descripcion:'Cuatro dedos estirados sin pulgar', categoria:'numeros', confianza:0.86 };

  // 5 — mano completamente abierta
  if (d.indice && d.medio && d.anular && d.menique && d.pulgar)
    return { sena:'5', nombre:'Número 5 / Hola', descripcion:'Mano completamente abierta', categoria:'numeros', confianza:0.93 };

  // 6 — meñique y pulgar estirados (igual que Y)
  // Diferenciado por contexto

  // 7 — anular y pulgar se tocan; índice, medio y meñique estirados
  if (d.indice && d.medio && !d.anular && d.menique && !d.pulgar &&
      dPA < um*0.3)
    return { sena:'7', nombre:'Número 7', descripcion:'Anular toca pulgar, tres dedos arriba', categoria:'numeros', confianza:0.78 };

  // 8 — medio y pulgar se tocan; índice, anular y meñique estirados
  if (d.indice && !d.medio && d.anular && d.menique && !d.pulgar &&
      dPM < um*0.3)
    return { sena:'8', nombre:'Número 8', descripcion:'Medio toca pulgar, otros estirados', categoria:'numeros', confianza:0.78 };

  // 9 — índice y pulgar forman aro; medio, anular y meñique estirados
  if (!d.indice && d.medio && d.anular && d.menique && !d.pulgar &&
      dPI < um*0.3)
    return { sena:'9', nombre:'Número 9', descripcion:'Índice toca pulgar, otros tres estirados', categoria:'numeros', confianza:0.80 };

  // 0 — igual que O
  // Ya cubierto arriba como O

  // ══════════════════════════════════════════════════════════
  //  SALUDOS
  // ══════════════════════════════════════════════════════════

  // HOLA / 5 — mano abierta (ya cubierto arriba como 5/Hola)

  // GRACIAS — mano abierta toca barbilla y se extiende
  //   En estático: los 4 dedos juntos, palma hacia dentro
  if (d.indice && d.medio && d.anular && d.menique && !d.pulgar &&
      dIM < um*0.25 && dMA < um*0.25 && dAMe < um*0.25)
    return { sena:'GRACIAS', nombre:'Gracias', descripcion:'Dedos juntos tocando barbilla y extendiendo', categoria:'saludos', confianza:0.78 };

  // SÍ — puño (S) con movimiento asintiendo
  //   Estático = S ya cubierto

  // NO — índice y medio moviéndose (estático: V horizontal)

  // POR FAVOR — mano abierta en círculo sobre el pecho
  //   Aproximación estática: mano abierta con pulgar (5)
  //   Diferente de Hola por la orientación — difícil sin movimiento

  // ══════════════════════════════════════════════════════════
  //  FAMILIA
  // ══════════════════════════════════════════════════════════

  // MAMÁ — pulgar toca la barbilla (pulgar apuntando arriba, otros cerrados)
  if (!d.indice && !d.medio && !d.anular && !d.menique && d.pulgar &&
      tP.y < L[2].y)
    return { sena:'MAMÁ', nombre:'Mamá', descripcion:'Pulgar apuntando arriba (toca barbilla)', categoria:'familia', confianza:0.79 };

  // PAPÁ — pulgar toca la frente (misma forma que mamá pero contacto diferente)
  // No diferenciable sin posición absoluta de la mano — se omite aquí

  // ══════════════════════════════════════════════════════════
  //  COLORES (señas basadas en letras + movimiento)
  //  En estático se detecta la letra base
  // ══════════════════════════════════════════════════════════

  // ROJO — índice raspa el labio (estático: D con movimiento)
  // AZUL  — B con sacudida → estático = B (ya cubierto)
  // VERDE — G con sacudida → estático = G (ya cubierto)
  // AMARILLO — Y con sacudida → estático = Y (ya cubierto)

  // ══════════════════════════════════════════════════════════
  //  PALABRAS BÁSICAS EXTRA
  // ══════════════════════════════════════════════════════════

  // BIEN / OK — índice y pulgar forman círculo, otros estirados (como 9 invertido)
  if (!d.indice && d.medio && d.anular && d.menique && d.pulgar &&
      dPI < um*0.28)
    return { sena:'BIEN', nombre:'Bien / OK', descripcion:'Índice y pulgar en aro, otros extendidos', categoria:'otros', confianza:0.80 };

  // TE AMO — índice + meñique + pulgar (rock / love)
  if (d.indice && !d.medio && !d.anular && d.menique && d.pulgar)
    return { sena:'TE AMO', nombre:'Te amo', descripcion:'Índice, meñique y pulgar estirados', categoria:'otros', confianza:0.85 };

  return null;
}

// ─────────────────────────────────────────────────────────────
//  Catálogo completo de señas para el módulo de Aprendizaje
// ─────────────────────────────────────────────────────────────
export const CATALOGO_SENAS = {
  abecedario: {
    nombre: 'Abecedario', emoji: '🔤', color: ['#f43f8e','#db2777'],
    senas: [
      { key:'A', nombre:'Letra A', descripcion:'Mano cerrada mostrando uñas, pulgar estirado al lado. La palma mira al frente.' },
      { key:'B', nombre:'Letra B', descripcion:'Índice, medio, anular y meñique estirados bien unidos. Pulgar doblado hacia la palma.' },
      { key:'C', nombre:'Letra C', descripcion:'Dedos en posición cóncava formando una C. Pulgar también en esa posición. Palma de lado.' },
      { key:'D', nombre:'Letra D', descripcion:'Medio, anular, meñique y pulgar se unen por las puntas. Índice estirado. Palma al frente.' },
      { key:'E', nombre:'Letra E', descripcion:'Todos los dedos completamente doblados mostrando las uñas. Palma al frente.' },
      { key:'F', nombre:'Letra F', descripcion:'Mano abierta y dedos unidos. Índice dobla hasta tocar la yema del pulgar. Palma de lado.' },
      { key:'G', nombre:'Letra G', descripcion:'Mano cerrada, índice y pulgar estirados. Palma mirando hacia usted.' },
      { key:'H', nombre:'Letra H', descripcion:'Mano cerrada, índice y medio estirados unidos. Pulgar señalando arriba. Palma hacia usted.' },
      { key:'I', nombre:'Letra I', descripcion:'Mano cerrada, solo el meñique estirado hacia arriba. Palma de lado.' },
      { key:'J', nombre:'Letra J', descripcion:'Como la I, pero dibujando una J en el aire con el meñique.' },
      { key:'K', nombre:'Letra K', descripcion:'Mano cerrada, índice, medio y pulgar estirados. Yema del pulgar entre índice y medio.' },
      { key:'L', nombre:'Letra L', descripcion:'Mano cerrada, índice y pulgar estirados formando una L. Palma al frente.' },
      { key:'M', nombre:'Letra M', descripcion:'Mano cerrada, índice, medio y anular colocados sobre el pulgar.' },
      { key:'N', nombre:'Letra N', descripcion:'Mano cerrada, índice y medio colocados sobre el pulgar.' },
      { key:'Ñ', nombre:'Letra Ñ', descripcion:'Como N pero moviendo la muñeca a los lados.' },
      { key:'O', nombre:'Letra O', descripcion:'Todos los dedos se tocan por las puntas formando una O.' },
      { key:'P', nombre:'Letra P', descripcion:'Como K pero apuntando hacia abajo.' },
      { key:'Q', nombre:'Letra Q', descripcion:'Índice y pulgar en garra, palma hacia abajo, muñeca a los lados.' },
      { key:'R', nombre:'Letra R', descripcion:'Mano cerrada, índice y medio estirados y entrelazados. Palma al frente.' },
      { key:'S', nombre:'Letra S', descripcion:'Mano cerrada, pulgar colocado sobre los otros dedos. Palma al frente.' },
      { key:'T', nombre:'Letra T', descripcion:'Mano cerrada, pulgar entre el índice y el medio. Palma al frente.' },
      { key:'U', nombre:'Letra U', descripcion:'Mano cerrada, índice y medio estirados y unidos. Palma al frente.' },
      { key:'V', nombre:'Letra V', descripcion:'Mano cerrada, índice y medio estirados y separados. Palma al frente.' },
      { key:'W', nombre:'Letra W', descripcion:'Mano cerrada, índice, medio y anular estirados y separados. Palma al frente.' },
      { key:'X', nombre:'Letra X', descripcion:'Mano cerrada, índice y pulgar en posición de garra. Movimiento al frente y de regreso.' },
      { key:'Y', nombre:'Letra Y', descripcion:'Mano cerrada, meñique y pulgar estirados. Palma hacia usted.' },
      { key:'Z', nombre:'Letra Z', descripcion:'Mano cerrada, índice estirado. Se dibuja una Z en el aire.' },
    ]
  },
  numeros: {
    nombre: 'Números', emoji: '🔢', color: ['#a855f7','#9333ea'],
    senas: [
      { key:'0', nombre:'Número 0', descripcion:'Igual que la letra O: todos los dedos se tocan por las puntas.' },
      { key:'1', nombre:'Número 1', descripcion:'Solo el índice estirado hacia arriba.' },
      { key:'2', nombre:'Número 2', descripcion:'Índice y medio estirados y separados (como V).' },
      { key:'3', nombre:'Número 3', descripcion:'Pulgar, índice y medio estirados.' },
      { key:'4', nombre:'Número 4', descripcion:'Cuatro dedos estirados sin el pulgar.' },
      { key:'5', nombre:'Número 5', descripcion:'Mano completamente abierta con todos los dedos.' },
      { key:'6', nombre:'Número 6', descripcion:'Meñique y pulgar estirados (como Y).' },
      { key:'7', nombre:'Número 7', descripcion:'Anular y pulgar se tocan; índice, medio y meñique estirados.' },
      { key:'8', nombre:'Número 8', descripcion:'Medio y pulgar se tocan; índice, anular y meñique estirados.' },
      { key:'9', nombre:'Número 9', descripcion:'Índice y pulgar forman aro; medio, anular y meñique estirados.' },
    ]
  },
  saludos: {
    nombre: 'Saludos', emoji: '👋', color: ['#fb923c','#ea580c'],
    senas: [
      { key:'HOLA',       nombre:'Hola',          descripcion:'Mano abierta moviéndose de lado a lado.' },
      { key:'ADIÓS',      nombre:'Adiós',          descripcion:'Mano abierta moviéndose hacia abajo.' },
      { key:'BUENOS DÍAS',nombre:'Buenos días',    descripcion:'B sobre el corazón, se mueve al frente. Luego D en medio círculo.' },
      { key:'BUENAS NOCHES', nombre:'Buenas noches', descripcion:'B sobre el corazón al frente. Luego G sobre la frente hacia abajo.' },
      { key:'POR FAVOR',  nombre:'Por favor',      descripcion:'Mano abierta en círculo sobre el pecho.' },
      { key:'GRACIAS',    nombre:'Gracias',        descripcion:'Mano toca la barbilla y se extiende al frente.' },
      { key:'DE NADA',    nombre:'De nada',        descripcion:'Manos abiertas hacia arriba.' },
      { key:'SÍ',         nombre:'Sí',             descripcion:'Puño asintiendo hacia abajo (como la S).' },
      { key:'NO',         nombre:'No',             descripcion:'Índice y medio moviéndose horizontalmente.' },
      { key:'LO SIENTO',  nombre:'Lo siento',      descripcion:'Puño en círculo sobre el pecho.' },
      { key:'AYUDA',      nombre:'Ayuda',          descripcion:'Pulgar arriba sobre palma abierta que sube.' },
      { key:'TE AMO',     nombre:'Te amo',         descripcion:'Índice, meñique y pulgar estirados (I love you).' },
    ]
  },
  familia: {
    nombre: 'Familia', emoji: '👨‍👩‍👧', color: ['#34d399','#059669'],
    senas: [
      { key:'MAMÁ',     nombre:'Mamá',     descripcion:'Pulgar toca la barbilla.' },
      { key:'PAPÁ',     nombre:'Papá',     descripcion:'Pulgar toca la frente.' },
      { key:'HERMANO',  nombre:'Hermano',  descripcion:'L en la frente luego se une al frente.' },
      { key:'HERMANA',  nombre:'Hermana',  descripcion:'L en la mejilla luego se une al frente.' },
      { key:'ABUELO',   nombre:'Abuelo',   descripcion:'Mano abierta en la frente que se abre hacia afuera.' },
      { key:'ABUELA',   nombre:'Abuela',   descripcion:'Mano abierta en la mejilla que se abre hacia afuera.' },
      { key:'HIJO',     nombre:'Hijo',     descripcion:'Mano mece un bebé, luego señala hacia abajo.' },
      { key:'HIJA',     nombre:'Hija',     descripcion:'Igual que hijo pero marcando femenino.' },
      { key:'BEBÉ',     nombre:'Bebé',     descripcion:'Brazos mecen simulando un bebé.' },
      { key:'FAMILIA',  nombre:'Familia',  descripcion:'F con ambas manos formando un círculo.' },
      { key:'ESPOSO',   nombre:'Esposo',   descripcion:'Mano toca la sien y luego entrelaza dedos.' },
      { key:'ESPOSA',   nombre:'Esposa',   descripcion:'Mano toca la mejilla y luego entrelaza dedos.' },
    ]
  },
  colores: {
    nombre: 'Colores', emoji: '🎨', color: ['#f59e0b','#d97706'],
    senas: [
      { key:'ROJO',     nombre:'Rojo',     descripcion:'Índice raspa el labio hacia abajo.' },
      { key:'AZUL',     nombre:'Azul',     descripcion:'Letra B sacudiendo la mano.' },
      { key:'VERDE',    nombre:'Verde',    descripcion:'Letra G sacudiendo la mano.' },
      { key:'AMARILLO', nombre:'Amarillo', descripcion:'Letra Y sacudiendo la mano.' },
      { key:'NEGRO',    nombre:'Negro',    descripcion:'Índice cruza la frente de lado a lado.' },
      { key:'BLANCO',   nombre:'Blanco',   descripcion:'Mano abierta en el pecho se cierra.' },
      { key:'ROSA',     nombre:'Rosa',     descripcion:'Dedo medio raspa el labio.' },
      { key:'MORADO',   nombre:'Morado',   descripcion:'Letra P sacudiendo hacia abajo.' },
      { key:'NARANJA',  nombre:'Naranja',  descripcion:'Mano abre y cierra en la mejilla.' },
      { key:'CAFÉ',     nombre:'Café',     descripcion:'Letra C baja por la mejilla.' },
      { key:'GRIS',     nombre:'Gris',     descripcion:'Ambas manos abiertas que se entrelazan.' },
      { key:'DORADO',   nombre:'Dorado',   descripcion:'Letra G brilla hacia afuera.' },
    ]
  },
};

// Lista plana para búsqueda
export const TODAS_LAS_SENAS = Object.entries(CATALOGO_SENAS).flatMap(
  ([catKey, cat]) => cat.senas.map(s => ({
    ...s,
    categoria: catKey,
    categoriaNombre: cat.nombre,
    categoriaEmoji: cat.emoji,
    categoriaColor: cat.color,
  }))
);