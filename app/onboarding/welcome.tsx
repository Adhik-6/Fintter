/**
 * Onboarding — Welcome Screen
 */
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors } from '@src/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.glowCircle} />

      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.content}>
        <Text style={styles.logo}>💰</Text>
        <Text style={styles.title}>Fintter</Text>
        <Text style={styles.subtitle}>Your futuristic expense tracker</Text>
        <Text style={styles.desc}>Track spending, set budgets, understand{'\n'}your financial emotions — all offline.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500).duration(400)} style={styles.bottom}>
        <Pressable onPress={() => router.push('/onboarding/setup-currency')} style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Get Started</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0, justifyContent: 'center', alignItems: 'center', padding: 24 },
  glowCircle: { position: 'absolute', top: '20%', width: 300, height: 300, borderRadius: 150, backgroundColor: colors.cyanGlow, opacity: 0.5 },
  content: { alignItems: 'center' },
  logo: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 42, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 18, color: colors.cyan, fontWeight: '500', marginBottom: 16 },
  desc: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  bottom: { position: 'absolute', bottom: 50, left: 24, right: 24 },
  ctaBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  ctaText: { fontSize: 17, fontWeight: '700', color: colors.black },
});
