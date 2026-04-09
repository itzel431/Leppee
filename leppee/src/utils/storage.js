// storage.js — usa SOLO localStorage (web compatible)
// En móvil nativo funciona igual porque expo lo polyfilla

const KEYS = {
  PERFIL:    'leppe_perfil',
  PROGRESO:  'leppe_progreso',
  HISTORIAL: 'leppe_historial',
  STATS:     'leppe_stats',
  CONFIG:    'leppe_config',
};

const store = {
  get: (key) => {
    try { return Promise.resolve(localStorage.getItem(key)); }
    catch { return Promise.resolve(null); }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, value); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
  remove: (key) => {
    try { localStorage.removeItem(key); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
  multiRemove: (keys) => {
    try { keys.forEach(k => localStorage.removeItem(k)); return Promise.resolve(); }
    catch { return Promise.resolve(); }
  },
};

export const getPerfil = async () => {
  try {
    const data = await store.get(KEYS.PERFIL);
    return data ? JSON.parse(data) : {
      nombre:'', iniciales:'', modo:'personal',
      fechaCreacion: new Date().toISOString(),
    };
  } catch { return { nombre:'', iniciales:'', modo:'personal', fechaCreacion: new Date().toISOString() }; }
};

export const savePerfil = async (perfil) => {
  try { await store.set(KEYS.PERFIL, JSON.stringify(perfil)); } catch {}
};

export const getProgreso = async () => {
  try {
    const data = await store.get(KEYS.PROGRESO);
    return data ? JSON.parse(data) : {
      senasVistas:{}, totalVistas:0, racha:0, ultimoDia:null, diasUsados:[],
    };
  } catch { return { senasVistas:{}, totalVistas:0, racha:0, ultimoDia:null, diasUsados:[] }; }
};

export const marcarSenaVista = async (sena) => {
  try {
    const prog = await getProgreso();
    if (!prog.senasVistas[sena]) {
      prog.senasVistas[sena] = true;
      prog.totalVistas = Object.keys(prog.senasVistas).length;
    }
    const hoy = new Date().toDateString();
    if (prog.ultimoDia !== hoy) {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      prog.racha = prog.ultimoDia === ayer.toDateString() ? prog.racha + 1 : 1;
      prog.ultimoDia = hoy;
      if (!prog.diasUsados.includes(hoy)) prog.diasUsados.push(hoy);
    }
    await store.set(KEYS.PROGRESO, JSON.stringify(prog));
    return prog;
  } catch { return null; }
};

export const getHistorial = async () => {
  try {
    const data = await store.get(KEYS.HISTORIAL);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const addHistorial = async (sena) => {
  try {
    const hist = await getHistorial();
    const nueva = { ...sena, fecha: new Date().toISOString() };
    const actualizado = [nueva, ...hist.filter(h => h.sena !== sena.sena)].slice(0, 50);
    await store.set(KEYS.HISTORIAL, JSON.stringify(actualizado));
    return actualizado;
  } catch { return []; }
};

export const clearHistorial = async () => {
  try { await store.remove(KEYS.HISTORIAL); } catch {}
};

export const getStats = async () => {
  try {
    const data = await store.get(KEYS.STATS);
    return data ? JSON.parse(data) : {
      tiempoTotal:0, sesiones:0, senasUsadas:{}, ultimaSesion:null,
    };
  } catch { return { tiempoTotal:0, sesiones:0, senasUsadas:{}, ultimaSesion:null }; }
};

export const updateStats = async (sena, segundos = 0) => {
  try {
    const stats = await getStats();
    stats.tiempoTotal += segundos;
    if (sena) stats.senasUsadas[sena] = (stats.senasUsadas[sena] || 0) + 1;
    stats.ultimaSesion = new Date().toISOString();
    await store.set(KEYS.STATS, JSON.stringify(stats));
    return stats;
  } catch { return null; }
};

export const iniciarSesion = async () => {
  try {
    const stats = await getStats();
    stats.sesiones += 1;
    stats.ultimaSesion = new Date().toISOString();
    await store.set(KEYS.STATS, JSON.stringify(stats));
  } catch {}
};

export const getConfig = async () => {
  try {
    const data = await store.get(KEYS.CONFIG);
    return data ? JSON.parse(data) : {
      velocidadVoz:0.9, idioma:'es-MX',
      modOscuro:true, notificaciones:false, volumenVoz:true,
    };
  } catch { return { velocidadVoz:0.9, idioma:'es-MX', modOscuro:true, notificaciones:false, volumenVoz:true }; }
};

export const saveConfig = async (config) => {
  try { await store.set(KEYS.CONFIG, JSON.stringify(config)); } catch {}
};

export const formatTiempo = (segundos) => {
  const s = segundos || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

export const getTopSenas = (senasUsadas, n = 5) => {
  return Object.entries(senasUsadas || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([sena, count]) => ({ sena, count }));
};

export const clearAll = async () => {
  try { await store.multiRemove(Object.values(KEYS)); } catch {}
};