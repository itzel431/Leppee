import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, TextInput, Modal, Alert, Animated,
  SafeAreaView, Platform, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  getPerfil, savePerfil, getProgreso, getHistorial,
  getStats, getConfig, saveConfig, clearHistorial,
  clearAll, formatTiempo, getTopSenas,
} from '../utils/storage';

const { width } = Dimensions.get('window');

const MODOS = [
  { id:'personal',   emoji:'👤', label:'Personal'  },
  { id:'salud',      emoji:'🏥', label:'Salud'     },
  { id:'empresa',    emoji:'🏢', label:'Empresa'   },
  { id:'educacion',  emoji:'🎓', label:'Educación' },
];

const CATEGORIAS_PROG = [
  { id:'saludo',    label:'Saludos',     color:'#db2777', total:7  },
  { id:'salud',     label:'Salud',       color:'#dc2626', total:8  },
  { id:'cuerpo',    label:'Cuerpo',      color:'#0891b2', total:14 },
  { id:'emocion',   label:'Emociones',   color:'#ea580c', total:7  },
  { id:'necesidad', label:'Necesidades', color:'#65a30d', total:5  },
  { id:'accion',    label:'Acciones',    color:'#0369a1', total:18 },
  { id:'numero',    label:'Números',     color:'#b45309', total:10 },
  { id:'letra',     label:'Letras',      color:'#525252', total:16 },
];

// Mapa seña → categoría
const SENA_CAT = {
  HOLA:'saludo',ADIÓS:'saludo',GRACIAS:'saludo','POR FAVOR':'saludo','LO SIENTO':'saludo','TE AMO':'saludo',AMOR:'saludo',
  SÍ:'basico',NO:'basico','BIEN/OK':'basico','MAL/V':'basico',AYUDA:'saludo',NECESITAR:'necesidad',
  FELIZ:'emocion',TRISTE:'emocion',CANSADO:'emocion',ENOJADO:'emocion',MIEDO:'emocion',SORPRESA:'emocion',QUERER:'emocion',
  DOLOR:'salud',FIEBRE:'salud',FRÍO:'salud',CALIENTE:'salud',MEDICINA:'salud',HOSPITAL:'salud',DOCTOR:'salud',EMERGENCIA:'salud',
  CABEZA:'cuerpo',GARGANTA:'cuerpo',ESTÓMAGO:'cuerpo',ESPALDA:'cuerpo',CORAZÓN:'cuerpo',
  DIENTE:'cuerpo',OJO:'cuerpo',NARIZ:'cuerpo',OÍDO:'cuerpo',CUELLO:'cuerpo',LABIO:'cuerpo',LENGUA:'cuerpo',CUERPO:'cuerpo',
  AGUA:'necesidad',COMIDA:'necesidad',BAÑO:'necesidad',DORMIR:'necesidad',DESCANSAR:'necesidad',
  HABLAR:'accion',ESCUCHAR:'accion',VER:'accion',COMER:'accion',BEBER:'accion',CAMINAR:'accion',
  TRABAJAR:'accion',ESTUDIAR:'accion',LEER:'accion',ESCRIBIR:'accion',BAILAR:'accion',MANEJAR:'accion',NACER:'accion',OBEDECER:'accion',
  FAMILIA:'social',MAMÁ:'social',PAPÁ:'social',HERMANO:'social',HERMANA:'social',AMIGO:'social',DINERO:'social',
  CASA:'social',HOY:'social',MAÑANA:'social',TARDE:'social',NOCHE:'social',
  '0':'numero','1':'numero','2':'numero','3':'numero','4':'numero',
  '5':'numero','6':'numero','7':'numero','8':'numero','9':'numero',
  A:'letra',B:'letra',C:'letra',D:'letra',E:'letra',F:'letra',G:'letra',
  I:'letra',L:'letra',O:'letra',R:'letra',S:'letra',U:'letra',V:'letra',W:'letra',Y:'letra',
};

export default function ProfileScreen({ navigation }) {
  const [perfil,    setPerfil]    = useState(null);
  const [progreso,  setProgreso]  = useState(null);
  const [historial, setHistorial] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [config,    setConfig]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editNombre,setEditNombre]= useState('');
  const [tab,       setTab]       = useState('perfil');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const cargar = async () => {
    const [p, prog, hist, st, cfg] = await Promise.all([
      getPerfil(), getProgreso(), getHistorial(), getStats(), getConfig(),
    ]);
    setPerfil(p); setProgreso(prog); setHistorial(hist); setStats(st); setConfig(cfg);
    setLoading(false);
    Animated.timing(fadeAnim, { toValue:1, duration:600, useNativeDriver:true }).start();
  };

  useFocusEffect(useCallback(() => { cargar(); }, []));

  const guardarNombre = async () => {
    if (!editNombre.trim()) return;
    const iniciales = editNombre.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const nuevo = { ...perfil, nombre: editNombre.trim(), iniciales };
    await savePerfil(nuevo);
    setPerfil(nuevo);
    setEditModal(false);
  };

  const cambiarModo = async (modo) => {
    const nuevo = { ...perfil, modo };
    await savePerfil(nuevo);
    setPerfil(nuevo);
  };

  const toggleConfig = async (key) => {
    const nuevo = { ...config, [key]: !config[key] };
    await saveConfig(nuevo);
    setConfig(nuevo);
  };

  const cambiarVelocidad = async (val) => {
    const nuevo = { ...config, velocidadVoz: val };
    await saveConfig(nuevo);
    setConfig(nuevo);
  };

  const limpiarHistorial = () => {
    Alert.alert('Limpiar historial', '¿Eliminar todo el historial de señas?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Limpiar', style:'destructive', onPress: async () => {
        await clearHistorial(); setHistorial([]);
      }},
    ]);
  };

  const resetearTodo = () => {
    Alert.alert('Resetear todo', '¿Eliminar todos los datos del perfil?', [
      { text:'Cancelar', style:'cancel' },
      { text:'Resetear', style:'destructive', onPress: async () => {
        await clearAll(); cargar();
      }},
    ]);
  };

  // Calcula progreso por categoría
  const progresoCategoria = (catId) => {
    if (!progreso?.senasVistas) return 0;
    const vistas = Object.keys(progreso.senasVistas).filter(s => SENA_CAT[s] === catId).length;
    const cat = CATEGORIAS_PROG.find(c => c.id === catId);
    return cat ? Math.min(vistas / cat.total, 1) : 0;
  };

  const topSenas = stats ? getTopSenas(stats.senasUsadas || {}) : [];
  const modoActual = MODOS.find(m => m.id === perfil?.modo) || MODOS[0];

  if (loading) {
    return (
      <LinearGradient colors={['#0f0225','#1a0535','#0d0020']} style={S.centered}>
        <Text style={{ fontSize:36 }}>🤟</Text>
        <Text style={S.loadingTxt}>Cargando perfil…</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0225','#1e0840','#0d0020']} style={S.root}>
      <SafeAreaView style={{ flex:1 }}>

        {/* HEADER */}
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Text style={S.backTxt}>← Volver</Text>
          </TouchableOpacity>
          <Text style={S.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity onPress={resetearTodo} style={S.resetBtn}>
            <Text style={{ fontSize:18 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View style={S.tabBar}>
          {[['perfil','👤 Perfil'],['progreso','📈 Progreso'],['historial','🕑 Historial'],['config','⚙️ Config']].map(([id,lbl]) => (
            <TouchableOpacity key={id} onPress={() => setTab(id)} style={[S.tab, tab===id && S.tabActive]}>
              <Text style={[S.tabTxt, tab===id && S.tabTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}>

          {/* ════ TAB PERFIL ════ */}
          {tab==='perfil' && (
            <View style={S.section}>
              {/* Avatar + nombre */}
              <View style={S.avatarSection}>
                <LinearGradient colors={['rgba(219,39,119,0.3)','rgba(147,51,234,0.3)']} style={S.avatarRing}>
                  <View style={S.avatar}>
                    <Text style={S.avatarEmoji}>{perfil?.iniciales ? undefined : '🤟'}</Text>
                    {perfil?.iniciales && <Text style={S.avatarIniciales}>{perfil.iniciales}</Text>}
                  </View>
                </LinearGradient>
                <TouchableOpacity onPress={() => { setEditNombre(perfil?.nombre||''); setEditModal(true); }} style={S.editNameBtn}>
                  <Text style={S.name}>{perfil?.nombre || 'Sin nombre'}</Text>
                  <Text style={S.editHint}>✏️ Toca para editar</Text>
                </TouchableOpacity>
                <View style={S.modoBadge}>
                  <Text style={S.modoBadgeTxt}>{modoActual.emoji} {modoActual.label}</Text>
                </View>
              </View>

              {/* Stats rápidas */}
              <View style={S.statsRow}>
                {[
                  { val: progreso?.totalVistas || 0,                          lbl:'Señas vistas',    col:'#db2777' },
                  { val: progreso?.racha || 0,                                lbl:'Racha 🔥',         col:'#9333ea' },
                  { val: formatTiempo(stats?.tiempoTotal || 0),               lbl:'Tiempo total',    col:'#ea580c' },
                  { val: stats?.sesiones || 0,                                lbl:'Sesiones',        col:'#0891b2' },
                ].map((s, i) => (
                  <View key={i} style={S.statCard}>
                    <Text style={[S.statVal, { color: s.col }]}>{s.val}</Text>
                    <Text style={S.statLbl}>{s.lbl}</Text>
                  </View>
                ))}
              </View>

              {/* Modo de usuario */}
              <View style={S.card}>
                <Text style={S.cardLabel}>MODO DE USUARIO</Text>
                <View style={S.modosGrid}>
                  {MODOS.map(m => (
                    <TouchableOpacity key={m.id} onPress={() => cambiarModo(m.id)}
                      style={[S.modoBtn, perfil?.modo === m.id && S.modoBtnActive]}>
                      <Text style={{ fontSize:24 }}>{m.emoji}</Text>
                      <Text style={[S.modoTxt, perfil?.modo === m.id && S.modoTxtActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Top señas más usadas */}
              {topSenas.length > 0 && (
                <View style={S.card}>
                  <Text style={S.cardLabel}>SEÑAS MÁS USADAS</Text>
                  {topSenas.map((s, i) => (
                    <View key={s.sena} style={S.topRow}>
                      <Text style={S.topRank}>#{i+1}</Text>
                      <Text style={S.topSena}>{s.sena}</Text>
                      <View style={S.topBarWrap}>
                        <View style={[S.topBar, { width:`${Math.min((s.count / (topSenas[0]?.count||1))*100, 100)}%`, backgroundColor:'#db2777' }]}/>
                      </View>
                      <Text style={S.topCount}>{s.count}x</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ════ TAB PROGRESO ════ */}
          {tab==='progreso' && (
            <View style={S.section}>
              {/* Racha calendar */}
              <View style={S.card}>
                <Text style={S.cardLabel}>RACHA DE APRENDIZAJE</Text>
                <View style={S.rachaCenter}>
                  <Text style={S.rachaNum}>{progreso?.racha || 0}</Text>
                  <Text style={S.rachaEmoji}>🔥</Text>
                </View>
                <Text style={S.rachaSub}>
                  {progreso?.racha >= 7 ? '¡Increíble semana completa! 🏆' :
                   progreso?.racha >= 3 ? '¡Vas muy bien! Sigue así 💪' :
                   progreso?.racha >= 1 ? '¡Buen comienzo! Vuelve mañana 🌱' :
                   'Abre el detector hoy para empezar tu racha'}
                </Text>
                <Text style={S.rachaTotal}>
                  Total: {progreso?.diasUsados?.length || 0} días de práctica
                </Text>
              </View>

              {/* Progreso por categoría */}
              <View style={S.card}>
                <Text style={S.cardLabel}>PROGRESO POR CATEGORÍA</Text>
                {CATEGORIAS_PROG.map(cat => {
                  const pct = progresoCategoria(cat.id);
                  const vistas = Math.round(pct * cat.total);
                  return (
                    <View key={cat.id} style={S.catRow}>
                      <View style={S.catHeader}>
                        <Text style={S.catLabel}>{cat.label}</Text>
                        <Text style={S.catCount}>{vistas}/{cat.total}</Text>
                      </View>
                      <View style={S.barTrack}>
                        <Animated.View style={[S.barFill, { width:`${pct*100}%`, backgroundColor: cat.color }]}/>
                      </View>
                      <Text style={[S.pct, { color: cat.color }]}>{Math.round(pct*100)}%</Text>
                    </View>
                  );
                })}
              </View>

              {/* Total general */}
              <View style={S.card}>
                <Text style={S.cardLabel}>TOTAL GENERAL</Text>
                <View style={S.totalCenter}>
                  <Text style={S.totalNum}>{progreso?.totalVistas || 0}</Text>
                  <Text style={S.totalSub}>señas detectadas de 100+</Text>
                </View>
                <View style={S.barTrack}>
                  <View style={[S.barFill, { width:`${Math.min(((progreso?.totalVistas||0)/100)*100,100)}%`, backgroundColor:'#db2777' }]}/>
                </View>
                <Text style={S.pct}>{Math.min(Math.round(((progreso?.totalVistas||0)/100)*100),100)}% del vocabulario básico</Text>
              </View>
            </View>
          )}

          {/* ════ TAB HISTORIAL ════ */}
          {tab==='historial' && (
            <View style={S.section}>
              <View style={S.histHeader}>
                <Text style={S.cardLabel}>{historial.length} SEÑAS EN HISTORIAL</Text>
                {historial.length > 0 && (
                  <TouchableOpacity onPress={limpiarHistorial} style={S.clearBtn}>
                    <Text style={S.clearTxt}>Limpiar</Text>
                  </TouchableOpacity>
                )}
              </View>

              {historial.length === 0 ? (
                <View style={S.emptyBox}>
                  <Text style={{ fontSize:44, marginBottom:12 }}>🖐️</Text>
                  <Text style={S.emptyTxt}>Sin historial aún</Text>
                  <Text style={S.emptyHint}>Las señas que detectes aparecerán aquí</Text>
                </View>
              ) : (
                historial.map((h, i) => {
                  const fecha = new Date(h.fecha);
                  const hoy   = new Date();
                  const esHoy = fecha.toDateString() === hoy.toDateString();
                  return (
                    <View key={i} style={S.histItem}>
                      <View style={[S.histColor, { backgroundColor: h.cat ? '#db2777' : '#9333ea' }]}/>
                      <Text style={{ fontSize:22, marginRight:10 }}>{h.emoji || '🤟'}</Text>
                      <View style={{ flex:1 }}>
                        <Text style={S.histSena}>{h.sena}</Text>
                        <Text style={S.histNombre}>{h.nombre}</Text>
                      </View>
                      <Text style={S.histFecha}>
                        {esHoy ? fecha.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' }) :
                          fecha.toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ════ TAB CONFIG ════ */}
          {tab==='config' && config && (
            <View style={S.section}>

              {/* Voz */}
              <View style={S.card}>
                <Text style={S.cardLabel}>VOZ Y AUDIO</Text>

                <View style={S.configRow}>
                  <View style={{ flex:1 }}>
                    <Text style={S.configLbl}>🔊 Velocidad de voz</Text>
                    <Text style={S.configSub}>{config.velocidadVoz === 0.5 ? 'Lenta' : config.velocidadVoz <= 0.9 ? 'Normal' : 'Rápida'}</Text>
                  </View>
                </View>
                {/* Slider de velocidad */}
                <View style={S.sliderRow}>
                  {[0.5, 0.75, 0.9, 1.1, 1.3].map(v => (
                    <TouchableOpacity key={v} onPress={() => cambiarVelocidad(v)}
                      style={[S.speedBtn, config.velocidadVoz === v && S.speedBtnActive]}>
                      <Text style={[S.speedTxt, config.velocidadVoz === v && S.speedTxtActive]}>
                        {v === 0.5 ? '🐢' : v <= 0.75 ? '🐌' : v <= 0.9 ? '🚶' : v <= 1.1 ? '🏃' : '⚡'}
                      </Text>
                      <Text style={[S.speedVal, config.velocidadVoz === v && { color:'#fce7f3' }]}>{v}x</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={S.configRow}>
                  <Text style={S.configLbl}>🌐 Idioma</Text>
                  <View style={S.idiomaBadge}>
                    <Text style={S.idiomaTxt}>🇲🇽 Español MX</Text>
                  </View>
                </View>

                <View style={S.configRow}>
                  <View style={{ flex:1 }}>
                    <Text style={S.configLbl}>🔊 Voz activada</Text>
                    <Text style={S.configSub}>Pronuncia la seña detectada</Text>
                  </View>
                  <Switch
                    value={config.volumenVoz}
                    onValueChange={() => toggleConfig('volumenVoz')}
                    trackColor={{ false:'rgba(255,255,255,0.15)', true:'#db2777' }}
                    thumbColor={config.volumenVoz ? '#fce7f3' : 'rgba(249,168,212,0.5)'}
                  />
                </View>
              </View>

              {/* Apariencia */}
              <View style={S.card}>
                <Text style={S.cardLabel}>APARIENCIA</Text>
                <View style={S.configRow}>
                  <View style={{ flex:1 }}>
                    <Text style={S.configLbl}>🌙 Modo oscuro</Text>
                    <Text style={S.configSub}>Tema atardecer nocturno</Text>
                  </View>
                  <Switch
                    value={config.modOscuro}
                    onValueChange={() => toggleConfig('modOscuro')}
                    trackColor={{ false:'rgba(255,255,255,0.15)', true:'#9333ea' }}
                    thumbColor={config.modOscuro ? '#fce7f3' : 'rgba(249,168,212,0.5)'}
                  />
                </View>
              </View>

              {/* Notificaciones */}
              <View style={S.card}>
                <Text style={S.cardLabel}>NOTIFICACIONES</Text>
                <View style={S.configRow}>
                  <View style={{ flex:1 }}>
                    <Text style={S.configLbl}>🔔 Recordatorio diario</Text>
                    <Text style={S.configSub}>Practica para mantener tu racha</Text>
                  </View>
                  <Switch
                    value={config.notificaciones}
                    onValueChange={() => toggleConfig('notificaciones')}
                    trackColor={{ false:'rgba(255,255,255,0.15)', true:'#ea580c' }}
                    thumbColor={config.notificaciones ? '#fce7f3' : 'rgba(249,168,212,0.5)'}
                  />
                </View>
              </View>

              {/* Datos */}
              <View style={S.card}>
                <Text style={S.cardLabel}>DATOS</Text>
                <TouchableOpacity onPress={limpiarHistorial} style={S.dangerBtn}>
                  <Text style={S.dangerTxt}>🗑️ Limpiar historial</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={resetearTodo} style={[S.dangerBtn, { borderColor:'rgba(220,38,38,0.5)', marginTop:8 }]}>
                  <Text style={[S.dangerTxt, { color:'#fca5a5' }]}>⚠️ Resetear todo el perfil</Text>
                </TouchableOpacity>
              </View>

              {/* About */}
              <View style={[S.card, { alignItems:'center' }]}>
                <Text style={{ fontSize:32, marginBottom:8 }}>🤟</Text>
                <Text style={{ color:'#fce7f3', fontSize:16, fontWeight:'700', marginBottom:4 }}>Leppe</Text>
                <Text style={{ color:'rgba(249,168,212,0.5)', fontSize:12 }}>Comunicación sin barreras</Text>
                <Text style={{ color:'rgba(249,168,212,0.35)', fontSize:11, marginTop:4 }}>v1.0.0 · leppecontacto@gmail.com</Text>
              </View>

            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </SafeAreaView>

      {/* MODAL EDITAR NOMBRE */}
      <Modal visible={editModal} transparent animationType="fade">
        <View style={S.modalOverlay}>
          <View style={S.modalBox}>
            <Text style={S.modalTitle}>¿Cómo te llamas?</Text>
            <TextInput
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Tu nombre..."
              placeholderTextColor="rgba(249,168,212,0.4)"
              style={S.input}
              autoFocus
              maxLength={30}
            />
            <View style={S.modalBtns}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={S.modalCancel}>
                <Text style={{ color:'#f9a8d4', fontSize:14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={guardarNombre} style={S.modalSave}>
                <LinearGradient colors={['#f43f8e','#db2777']} style={S.modalSaveGrad}>
                  <Text style={{ color:'#fff', fontSize:14, fontWeight:'700' }}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const S = StyleSheet.create({
  root:       { flex:1 },
  centered:   { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loadingTxt: { color:'#f9a8d4', fontSize:14 },

  // Header
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:12, borderBottomWidth:1, borderBottomColor:'rgba(219,39,119,0.2)' },
  backBtn:      { padding:8 },
  backTxt:      { color:'#f9a8d4', fontSize:14 },
  headerTitle:  { color:'#fce7f3', fontSize:16, fontWeight:'700' },
  resetBtn:     { padding:8 },

  // Tabs
  tabBar:       { flexDirection:'row', borderBottomWidth:1, borderBottomColor:'rgba(255,255,255,0.06)' },
  tab:          { flex:1, paddingVertical:10, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabActive:    { borderBottomColor:'#db2777' },
  tabTxt:       { color:'rgba(249,168,212,0.45)', fontSize:11, fontWeight:'400' },
  tabTxtActive: { color:'#fce7f3', fontWeight:'600' },

  // Sección
  section:      { padding:16, gap:14 },

  // Avatar
  avatarSection: { alignItems:'center', paddingTop:8, gap:8 },
  avatarRing:    { width:100, height:100, borderRadius:50, alignItems:'center', justifyContent:'center' },
  avatar:        { width:88, height:88, borderRadius:44, backgroundColor:'#2d0f4e', alignItems:'center', justifyContent:'center' },
  avatarEmoji:   { fontSize:40 },
  avatarIniciales:{ fontSize:32, fontWeight:'700', color:'#fce7f3' },
  editNameBtn:   { alignItems:'center', gap:2 },
  name:          { color:'#fce7f3', fontSize:22, fontWeight:'700' },
  editHint:      { color:'rgba(249,168,212,0.45)', fontSize:11 },
  modoBadge:     { backgroundColor:'rgba(219,39,119,0.2)', borderWidth:1, borderColor:'rgba(219,39,119,0.45)', borderRadius:14, paddingHorizontal:14, paddingVertical:4 },
  modoBadgeTxt:  { color:'#f9a8d4', fontSize:12, fontWeight:'600' },

  // Stats
  statsRow:      { flexDirection:'row', gap:8 },
  statCard:      { flex:1, backgroundColor:'rgba(255,255,255,0.05)', borderRadius:14, padding:12, alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.07)' },
  statVal:       { fontSize:20, fontWeight:'700' },
  statLbl:       { color:'rgba(249,168,212,0.55)', fontSize:9, textAlign:'center', marginTop:2 },

  // Card
  card:          { backgroundColor:'rgba(255,255,255,0.04)', borderRadius:18, padding:16, borderWidth:1, borderColor:'rgba(219,39,119,0.2)', gap:12 },
  cardLabel:     { color:'#f9a8d4', fontSize:10, fontWeight:'700', letterSpacing:1.1 },

  // Modos
  modosGrid:     { flexDirection:'row', gap:8 },
  modoBtn:       { flex:1, alignItems:'center', gap:4, padding:12, borderRadius:14, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.04)' },
  modoBtnActive: { borderColor:'#db2777', backgroundColor:'rgba(219,39,119,0.2)' },
  modoTxt:       { color:'rgba(249,168,212,0.5)', fontSize:10, textAlign:'center' },
  modoTxtActive: { color:'#fce7f3', fontWeight:'600' },

  // Top señas
  topRow:        { flexDirection:'row', alignItems:'center', gap:8 },
  topRank:       { color:'rgba(249,168,212,0.4)', fontSize:11, width:22, textAlign:'center' },
  topSena:       { color:'#fce7f3', fontSize:13, fontWeight:'600', width:70 },
  topBarWrap:    { flex:1, height:5, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' },
  topBar:        { height:'100%', borderRadius:3 },
  topCount:      { color:'rgba(249,168,212,0.5)', fontSize:11, width:28, textAlign:'right' },

  // Progreso
  rachaCenter:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 },
  rachaNum:      { fontSize:56, fontWeight:'800', color:'#db2777' },
  rachaEmoji:    { fontSize:40 },
  rachaSub:      { color:'#f9a8d4', fontSize:13, textAlign:'center' },
  rachaTotal:    { color:'rgba(249,168,212,0.45)', fontSize:11, textAlign:'center' },
  catRow:        { gap:4 },
  catHeader:     { flexDirection:'row', justifyContent:'space-between' },
  catLabel:      { color:'#fce7f3', fontSize:12, fontWeight:'500' },
  catCount:      { color:'rgba(249,168,212,0.5)', fontSize:11 },
  barTrack:      { height:7, backgroundColor:'rgba(255,255,255,0.08)', borderRadius:4, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:4 },
  pct:           { color:'rgba(249,168,212,0.5)', fontSize:10, textAlign:'right' },
  totalCenter:   { alignItems:'center' },
  totalNum:      { fontSize:48, fontWeight:'800', color:'#db2777' },
  totalSub:      { color:'rgba(249,168,212,0.5)', fontSize:12 },

  // Historial
  histHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  clearBtn:      { backgroundColor:'rgba(255,255,255,0.06)', borderRadius:10, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:'rgba(249,168,212,0.2)' },
  clearTxt:      { color:'#f9a8d4', fontSize:11 },
  emptyBox:      { alignItems:'center', padding:40 },
  emptyTxt:      { color:'rgba(249,168,212,0.5)', fontSize:15, marginBottom:6 },
  emptyHint:     { color:'rgba(249,168,212,0.3)', fontSize:12, textAlign:'center' },
  histItem:      { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.04)', borderRadius:14, padding:12, marginBottom:6, borderWidth:1, borderColor:'rgba(255,255,255,0.06)' },
  histColor:     { width:4, height:36, borderRadius:2, marginRight:10 },
  histSena:      { color:'#fce7f3', fontSize:14, fontWeight:'700' },
  histNombre:    { color:'rgba(249,168,212,0.55)', fontSize:11 },
  histFecha:     { color:'rgba(249,168,212,0.35)', fontSize:10 },

  // Config
  configRow:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  configLbl:     { color:'#fce7f3', fontSize:13, fontWeight:'500' },
  configSub:     { color:'rgba(249,168,212,0.45)', fontSize:11, marginTop:2 },
  sliderRow:     { flexDirection:'row', gap:6 },
  speedBtn:      { flex:1, alignItems:'center', gap:2, padding:8, borderRadius:12, borderWidth:1, borderColor:'rgba(255,255,255,0.1)', backgroundColor:'rgba(255,255,255,0.04)' },
  speedBtnActive:{ borderColor:'#db2777', backgroundColor:'rgba(219,39,119,0.2)' },
  speedTxt:      { fontSize:16 },
  speedVal:      { color:'rgba(249,168,212,0.5)', fontSize:10 },
  speedTxtActive:{ color:'#fce7f3' },
  idiomaBadge:   { backgroundColor:'rgba(147,51,234,0.2)', borderRadius:12, paddingHorizontal:12, paddingVertical:4, borderWidth:1, borderColor:'rgba(147,51,234,0.4)' },
  idiomaTxt:     { color:'#c4b5fd', fontSize:12 },
  dangerBtn:     { borderWidth:1, borderColor:'rgba(249,168,212,0.25)', borderRadius:12, padding:12, alignItems:'center' },
  dangerTxt:     { color:'#f9a8d4', fontSize:13 },

  // Modal
  modalOverlay:  { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'center', alignItems:'center', padding:32 },
  modalBox:      { width:'100%', backgroundColor:'#1e0840', borderRadius:24, padding:24, borderWidth:1, borderColor:'rgba(219,39,119,0.35)' },
  modalTitle:    { color:'#fce7f3', fontSize:18, fontWeight:'700', textAlign:'center', marginBottom:16 },
  input:         { backgroundColor:'rgba(255,255,255,0.08)', borderRadius:14, padding:14, color:'#fce7f3', fontSize:15, borderWidth:1, borderColor:'rgba(219,39,119,0.3)', marginBottom:16 },
  modalBtns:     { flexDirection:'row', gap:10 },
  modalCancel:   { flex:1, padding:14, alignItems:'center', borderWidth:1, borderColor:'rgba(249,168,212,0.3)', borderRadius:14 },
  modalSave:     { flex:1, borderRadius:14, overflow:'hidden' },
  modalSaveGrad: { padding:14, alignItems:'center' },
});