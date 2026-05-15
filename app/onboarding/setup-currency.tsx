/**
 * Onboarding — Setup Currency
 */
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@src/theme';
import { currencyList } from '@src/constants/currencies';

export default function SetupCurrencyScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('INR');

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text style={styles.step}>Step 1 of 2</Text>
        <Text style={styles.title}>Choose your currency</Text>
        <Text style={styles.subtitle}>This sets how amounts are displayed</Text>
      </Animated.View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {currencyList.map((cur) => (
          <Pressable key={cur.code} onPress={() => setSelected(cur.code)} style={[styles.currencyRow, selected === cur.code && styles.currencyRowActive]}>
            <Text style={styles.currencySymbol}>{cur.symbol}</Text>
            <View style={styles.currencyInfo}>
              <Text style={styles.currencyCode}>{cur.code}</Text>
              <Text style={styles.currencyName}>{cur.name}</Text>
            </View>
            {selected === cur.code && <Text style={styles.check}>✓</Text>}
          </Pressable>
        ))}
      </ScrollView>

      <Pressable onPress={() => router.push('/onboarding/setup-categories')} style={styles.nextBtn}>
        <Text style={styles.nextText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0, padding: 24, paddingTop: 60 },
  step: { fontSize: 13, color: colors.cyan, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },
  list: { flex: 1 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface1, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  currencyRowActive: { borderColor: colors.cyan, backgroundColor: colors.cyanGlow },
  currencySymbol: { fontSize: 24, width: 40, textAlign: 'center', marginRight: 12, color: colors.textPrimary },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  currencyName: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  check: { fontSize: 20, color: colors.cyan, fontWeight: '700' },
  nextBtn: { backgroundColor: colors.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  nextText: { fontSize: 16, fontWeight: '700', color: colors.black },
});
