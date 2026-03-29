import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const starOpacity = useRef(new Animated.Value(0.4)).current;
  const sunGlow = useRef(new Animated.Value(0.7)).current;
  const titleY = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const btn1X = useRef(new Animated.Value(-60)).current;
  const btn1Opacity = useRef(new Animated.Value(0)).current;
  const btn2X = useRef(new Animated.Value(60)).current;
  const btn2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity, { toValue: 1, duration: 2500, useNativeDriver: true }),
        Animated.timing(starOpacity, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlow, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(sunGlow, { toValue: 0.55, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.parallel([
      Animated.timing(titleY,      { toValue: 0, duration: 900, delay: 400, useNativeDriver: true }),
      Animated.timing(titleOpacity,{ toValue: 1, duration: 900, delay: 400, useNativeDriver: true }),
      Animated.timing(btn1X,       { toValue: 0, duration: 700, delay: 800, useNativeDriver: true }),
      Animated.timing(btn1Opacity, { toValue: 1, duration: 700, delay: 800, useNativeDriver: true }),
      Animated.timing(btn2X,       { toValue: 0, duration: 700, delay: 1000, useNativeDriver: true }),
      Animated.timing(btn2Opacity, { toValue: 1, duration: 700, delay: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  const stars = [
    { top: 55,  left: 30  }, { top: 30,  left: 110 },
    { top: 75,  left: 190 }, { top: 42,  left: 270 },
    { top: 65,  left: 330 }, { top: 28,  left: width - 55 },
    { top: 88,  left: width - 95  }, { top: 50, left: width - 140 },
    { top: 100, left: 60  }, { top: 20,  left: 230 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Degradado suave del cielo */}
      <LinearGradient
        colors={[
          '#0f0225',  // morado muy oscuro (arriba)
          '#2d0f4e',  // morado
          '#6b1f7a',  // morado medio
          '#a8305a',  // rosa-morado
          '#c94a2a',  // naranja oscuro
          '#e8622a',  // naranja
          '#f0853a',  // naranja claro
          '#e8607a',  // rosa-naranja
          '#c0406a',  // rosa
          '#0d0020',  // negro (abajo)
        ]}
        locations={[0, 0.1, 0.22, 0.35, 0.44, 0.52, 0.58, 0.64, 0.68, 0.78]}
        style={styles.gradient}
      />

      {/* Estrellas parpadeando */}
      {stars.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            { top: pos.top, left: pos.left, opacity: starOpacity },
            i % 3 === 0 && { width: 2, height: 2 },
          ]}
        />
      ))}

      {/* Sol con glow suave */}
      <Animated.View style={[styles.sunWrapper, { opacity: sunGlow }]}>
        <LinearGradient
          colors={['#fef9c3', '#fde68a', '#fbbf24', '#f97316', 'transparent']}
          style={styles.sunGlow}
        />
        <View style={styles.sunCore} />
      </Animated.View>

      {/* Colinas silueta */}
      <View style={styles.hillLeft} />
      <View style={styles.hillRight} />

      {/* Overlay para legibilidad del texto */}
      <LinearGradient
        colors={['transparent', 'rgba(13,0,32,0.55)', 'rgba(13,0,32,0.92)', '#0d0020']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.overlay}
      />

      <SafeAreaView style={styles.content}>
        {/* Logo + Título */}
        <Animated.View style={[
          styles.titleSection,
          { opacity: titleOpacity, transform: [{ translateY: titleY }] }
        ]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🤟</Text>
          </View>
          <Text style={styles.appName}>Leppe</Text>
          <Text style={styles.tagline}>Comunicación sin barreras</Text>
        </Animated.View>

        {/* Botones principales */}
        <View style={styles.buttonsContainer}>
          <Animated.View style={{ opacity: btn1Opacity, transform: [{ translateX: btn1X }] }}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => navigation.navigate('Translation')}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['#f43f8e', '#db2777', '#be185d']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonEmoji}>🖐️</Text>
                <Text style={styles.buttonText}>Traducción</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: btn2Opacity, transform: [{ translateX: btn2X }] }}>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate('Learning')}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['#a855f7', '#9333ea', '#7e22ce']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonEmoji}>📚</Text>
                <Text style={styles.buttonText}>Aprendizaje</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Botón perfil */}
        <Animated.View style={{ opacity: btn2Opacity }}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>👤  Mi perfil</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0225' },
  gradient: { ...StyleSheet.absoluteFillObject },
  star: {
    position: 'absolute', width: 3, height: 3,
    borderRadius: 2, backgroundColor: '#ffffff',
  },
  sunWrapper: {
    position: 'absolute',
    top: height * 0.36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGlow: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
  },
  sunCore: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#fffde7',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  hillLeft: {
    position: 'absolute',
    top: height * 0.52,
    left: -width * 0.15,
    width: width * 0.75,
    height: 100,
    borderRadius: 999,
    backgroundColor: '#0d0020',
  },
  hillRight: {
    position: 'absolute',
    top: height * 0.54,
    left: width * 0.45,
    width: width * 0.75,
    height: 100,
    borderRadius: 999,
    backgroundColor: '#0d0020',
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.65,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
    paddingHorizontal: 26,
  },
  titleSection: { alignItems: 'center', marginBottom: 44 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(219,39,119,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(249,168,212,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  appName: {
    fontSize: 40, fontWeight: '700',
    color: '#fce7f3', letterSpacing: 1.5, marginBottom: 6,
  },
  tagline: { fontSize: 14, color: '#f9a8d4', letterSpacing: 0.5 },
  buttonsContainer: { gap: 14, marginBottom: 16 },
  buttonPrimary: { borderRadius: 28, overflow: 'hidden' },
  buttonSecondary: { borderRadius: 28, overflow: 'hidden' },
  buttonGradient: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 17,
    gap: 10,
  },
  buttonEmoji: { fontSize: 20 },
  buttonText: {
    fontSize: 17, fontWeight: '600',
    color: '#ffffff', letterSpacing: 0.4,
  },
  profileButton: {
    alignItems: 'center', paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(249,168,212,0.35)',
    borderRadius: 28,
    marginTop: 4,
  },
  profileButtonText: { fontSize: 15, color: '#f9a8d4', fontWeight: '500' },
});