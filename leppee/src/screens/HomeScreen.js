import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, SafeAreaView
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

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
    // Estrellas parpadeando
    Animated.loop(
      Animated.sequence([
        Animated.timing(starOpacity, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(starOpacity, { toValue: 0.4, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Sol brillando
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunGlow, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(sunGlow, { toValue: 0.6, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    // Animación de entrada
    Animated.parallel([
      Animated.timing(titleY, { toValue: 0, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }),
      Animated.timing(btn1X, { toValue: 0, duration: 700, delay: 700, useNativeDriver: true }),
      Animated.timing(btn1Opacity, { toValue: 1, duration: 700, delay: 700, useNativeDriver: true }),
      Animated.timing(btn2X, { toValue: 0, duration: 700, delay: 900, useNativeDriver: true }),
      Animated.timing(btn2Opacity, { toValue: 1, duration: 700, delay: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Capas del cielo */}
      <View style={[styles.skyLayer, { backgroundColor: '#1a0535', top: 0, height: height * 0.38 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#5c1a6b', top: height * 0.22, height: height * 0.12, opacity: 0.85 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#c2410c', top: height * 0.30, height: height * 0.10, opacity: 0.75 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#ea580c', top: height * 0.36, height: height * 0.09, opacity: 0.65 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#fb923c', top: height * 0.42, height: height * 0.08, opacity: 0.55 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#ec4899', top: height * 0.47, height: height * 0.07, opacity: 0.45 }]} />
      <View style={[styles.skyLayer, { backgroundColor: '#0d0020', top: height * 0.50, height: height * 0.50 }]} />

      {/* Estrellas */}
      {[
        { top: 60, left: 40 }, { top: 35, left: 120 }, { top: 80, left: 200 },
        { top: 45, left: 280 }, { top: 70, left: 340 }, { top: 30, left: width - 60 },
        { top: 90, left: width - 100 }, { top: 55, left: width - 150 },
      ].map((pos, i) => (
        <Animated.View
          key={i}
          style={[styles.star, { top: pos.top, left: pos.left, opacity: starOpacity }]}
        />
      ))}

      {/* Sol */}
      <Animated.View style={[styles.sunContainer, { opacity: sunGlow }]}>
        <View style={styles.sunOuter} />
        <View style={styles.sunMid} />
        <View style={styles.sunCore} />
      </Animated.View>

      {/* Colinas silhouette */}
      <View style={[styles.hill, { width: width * 0.7, left: -width * 0.1, top: height * 0.48, borderRadius: 999 }]} />
      <View style={[styles.hill, { width: width * 0.6, left: width * 0.5, top: height * 0.50, borderRadius: 999 }]} />

      {/* Overlay oscuro para texto */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.content}>
        {/* Logo + título */}
        <Animated.View style={[styles.titleSection, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🤟</Text>
          </View>
          <Text style={styles.appName}>Leppe</Text>
          <Text style={styles.tagline}>Comunicación sin barreras</Text>
        </Animated.View>

        {/* Botones */}
        <View style={styles.buttonsContainer}>
          <Animated.View style={{ opacity: btn1Opacity, transform: [{ translateX: btn1X }] }}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => navigation.navigate('Translation')}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonEmoji}>abc</Text>
              <Text style={styles.buttonText}>Traducción</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ opacity: btn2Opacity, transform: [{ translateX: btn2X }] }}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => navigation.navigate('Learning')}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonEmoji}>📚</Text>
              <Text style={styles.buttonText}>Aprendizaje</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Botón perfil */}
        <Animated.View style={{ opacity: btn2Opacity }}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileButtonText}>👤 Mi perfil</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0535' },
  skyLayer: { position: 'absolute', left: 0, right: 0 },
  star: {
    position: 'absolute', width: 3, height: 3,
    borderRadius: 2, backgroundColor: '#ffffff',
  },
  sunContainer: {
    position: 'absolute',
    top: height * 0.34,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100, height: 100,
  },
  sunOuter: {
    position: 'absolute', width: 90, height: 30,
    borderRadius: 50, backgroundColor: '#fbbf24', opacity: 0.35,
  },
  sunMid: {
    position: 'absolute', width: 60, height: 38,
    borderRadius: 50, backgroundColor: '#fde68a', opacity: 0.5,
  },
  sunCore: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fffbeb', opacity: 0.9,
  },
  hill: {
    position: 'absolute', height: 80,
    backgroundColor: '#0d0020',
  },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: height * 0.6, backgroundColor: '#0d0020', opacity: 0.6,
  },
  content: {
    flex: 1, justifyContent: 'flex-end', paddingBottom: 48, paddingHorizontal: 28,
  },
  titleSection: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(219,39,119,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoEmoji: { fontSize: 34 },
  appName: {
    fontSize: 38, fontWeight: '700',
    color: '#fce7f3', letterSpacing: 1, marginBottom: 6,
  },
  tagline: { fontSize: 14, color: '#f9a8d4', letterSpacing: 0.5 },
  buttonsContainer: { gap: 14, marginBottom: 20 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 28, gap: 10,
  },
  buttonPrimary: { backgroundColor: '#db2777' },
  buttonSecondary: { backgroundColor: '#9333ea' },
  buttonEmoji: { fontSize: 18 },
  buttonText: {
    fontSize: 17, fontWeight: '600',
    color: '#ffffff', letterSpacing: 0.4,
  },
  profileButton: {
    alignItems: 'center', paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(249,168,212,0.4)',
    borderRadius: 28,
  },
  profileButtonText: { fontSize: 15, color: '#f9a8d4', fontWeight: '500' },
});