import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PERFIL:    'leppe_perfil',
  PROGRESO:  'leppe_progreso',
  HISTORIAL: 'leppe_historial',
  STATS:     'leppe_stats',
  CONFIG:    'leppe_config',
};

// ── Perfil ──────────────────────────────────────────────────
export const getPerfil = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PERFIL);
    return data ? JSON.parse(data) : {
      nombre: '',
      iniciales: '',
      modo: 'personal',
      fechaCreacion: new Date().toISOString(),
    };
  } catch { return null; }
};

export const savePerfil = async (perfil) => {
  try {
    await AsyncStorage.setItem(KEYS.PERFIL, JSON.stringify(perfil));
  } catch {}
};

// ── Progreso ────────────────────────────────────────────────
export const getProgreso = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROGRESO);
    return data ? JSON.parse(data) : {
      senasVistas: {},      // { 'HOLA': true, 'GRACIAS': true, ... }
      totalVistas: 0,
      racha: 0,
      ultimoDia: null,
      diasUsados: [],
    };
  } catch { return null; }
};

export const marcarSenaVista = async (sena) => {
  try {
    const prog = await getProgreso();
    if (!prog.senasVistas[sena]) {
      prog.senasVistas[sena] = true;
      prog.totalVistas = Object.keys(prog.senasVistas).length;
    }
    // Actualiza racha
    const hoy = new Date().toDateString();
    if (prog.ultimoDia !== hoy) {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      prog.racha = prog.ultimoDia === ayer.toDateString() ? prog.racha + 1 : 1;
      prog.ultimoDia = hoy;
      if (!prog.diasUsados.includes(hoy)) prog.diasUsados.push(hoy);
    }
    await AsyncStorage.setItem(KEYS.PROGRESO, JSON.stringify(prog));
    return prog;
  } catch { return null; }
};

// ── Historial ───────────────────────────────────────────────
export const getHistorial = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.HISTORIAL);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addHistorial = async (sena) => {
  try {
    const hist = await getHistorial();
    const nueva = { ...sena, fecha: new Date().toISOString() };
    const actualizado = [nueva, ...hist.filter(h => h.sena !== sena.sena)].slice(0, 50);
    await AsyncStorage.setItem(KEYS.HISTORIAL, JSON.stringify(actualizado));
    return actualizado;
  } catch { return []; }
};

export const clearHistorial = async () => {
  try { await AsyncStorage.removeItem(KEYS.HISTORIAL); } catch {}
};

// ── Estadísticas ────────────────────────────────────────────
export const getStats = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.STATS);
    return data ? JSON.parse(data) : {
      tiempoTotal: 0,          // segundos
      sesiones: 0,
      senasUsadas: {},          // { 'HOLA': 5, 'GRACIAS': 3, ... }
      ultimaSesion: null,
    };
  } catch { return null; }
};

export const updateStats = async (sena, segundos = 0) => {
  try {
    const stats = await getStats();
    stats.tiempoTotal += segundos;
    if (sena) {
      stats.senasUsadas[sena] = (stats.senasUsadas[sena] || 0) + 1;
    }
    stats.ultimaSesion = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    return stats;
  } catch { return null; }
};

export const iniciarSesion = async () => {
  try {
    const stats = await getStats();
    stats.sesiones += 1;
    stats.ultimaSesion = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  } catch {}
};

// ── Configuración ───────────────────────────────────────────
export const getConfig = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : {
      velocidadVoz: 0.9,
      idioma: 'es-MX',
      modOscuro: true,
      notificaciones: false,
      volumenVoz: true,
    };
  } catch { return null; }
};

export const saveConfig = async (config) => {
  try {
    await AsyncStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  } catch {}
};

// ── Helpers ─────────────────────────────────────────────────
export const formatTiempo = (segundos) => {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${segundos}s`;
};

export const getTopSenas = (senasUsadas, n = 5) => {
  return Object.entries(senasUsadas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([sena, count]) => ({ sena, count }));
};

export const clearAll = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
};