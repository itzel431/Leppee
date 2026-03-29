import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TranslationScreen({ navigation }) {
  return (
    <LinearGradient colors={['#0f0225', '#1a0535', '#0d0020']} style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Traducción en{'\n'}Tiempo Real</Text>
        <Text style={styles.sub}>🚧 Próximamente: cámara + IA</Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: 26 },
  back: { marginBottom: 30 },
  backText: { color: '#f9a8d4', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '700', color: '#fce7f3', marginBottom: 20 },
  sub: { color: '#f9a8d4', fontSize: 16 },
});